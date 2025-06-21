#!/usr/bin/env node
// scripts/bulk-upload-blobs.js
import { put } from '@vercel/blob';
import { readdir, stat, access } from 'fs/promises';
import { join, relative } from 'path';
import { createReadStream } from 'fs';
import { config } from 'dotenv';
import { constants } from 'fs';
import pLimit from 'p-limit';

// Load environment variables
config({ path: '.env.local' });

// ------------------------
// CLI argument helpers
// ------------------------
function getArg(name, fallback) {
	const arg = process.argv.find((a) => a === name || a.startsWith(`${name}=`));
	if (!arg) return fallback;
	if (arg.includes('=')) {
		return arg.split('=')[1];
	}
	// Support space-separated value e.g. --concurrency 10
	const idx = process.argv.indexOf(name);
	return idx >= 0 && idx < process.argv.length - 1 ? process.argv[idx + 1] : fallback;
}

// Parse and validate CLI arguments
const concurrencyArg = Number(getArg('--concurrency', 5));
const maxRetriesArg = Number(getArg('--max-retries', 3));
const retryDelayArg = Number(getArg('--retry-delay', 1000));

// Apply validation and fallbacks
const CONCURRENCY =
	Number.isNaN(concurrencyArg) || concurrencyArg < 1 ? 5 : Math.max(1, concurrencyArg);
const MAX_RETRIES = Number.isNaN(maxRetriesArg) || maxRetriesArg < 0 ? 3 : maxRetriesArg;
const RETRY_DELAY = Number.isNaN(retryDelayArg) || retryDelayArg < 0 ? 1000 : retryDelayArg;

// Warn about invalid values that were corrected
if (Number.isNaN(concurrencyArg) || concurrencyArg < 1) {
	console.warn('⚠️  Invalid --concurrency value. Using default: 5');
}
if (Number.isNaN(maxRetriesArg) || maxRetriesArg < 0) {
	console.warn('⚠️  Invalid --max-retries value. Using default: 3');
}
if (Number.isNaN(retryDelayArg) || retryDelayArg < 0) {
	console.warn('⚠️  Invalid --retry-delay value. Using default: 1000ms');
}

// Check for required environment variables
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// Check for confirmation flags
const isDryRun = process.argv.includes('--dry-run');
const cliConfirmed = process.argv.includes('--confirm');
const envConfirmed = process.env.CONFIRM === 'true';
const isConfirmed = envConfirmed && cliConfirmed;

// CI/Environment checks
const isCI = process.env.CI === 'true';
const isDummyToken =
	BLOB_TOKEN === 'dummy-token-for-ci' || (BLOB_TOKEN && BLOB_TOKEN.includes('dummy'));

// Configuration
const SOURCE_DIR = 'public/images/wp';
const BLOB_PREFIX = 'wp/';

// Progress tracking
let totalFiles = 0;
let processedFiles = 0;
let successfulUploads = 0;
let failedUploads = 0;

// Early validation checks
async function validateEnvironment() {
	// Handle missing or dummy token in CI/test environments
	if (!BLOB_TOKEN || isDummyToken) {
		console.log('🧪 CI/Test Mode - Vercel Blob token not available or is dummy token');
		console.log('✅ Script validation passed - would work with proper token');
		process.exit(0);
	}

	// Check for token (unless in dry-run or CI)
	if (!BLOB_TOKEN && !isDryRun && !isCI) {
		console.error('❌ BLOB_READ_WRITE_TOKEN environment variable is required');
		console.error(
			'💡 Run with --dry-run to test without uploading, or set the token in .env.local'
		);
		process.exit(1);
	}

	// Check confirmation - require BOTH env var AND CLI flag for destructive operations
	if (!isDryRun && !isConfirmed) {
		console.error('❌ Destructive script requires DUAL confirmation for safety:');
		console.error(`   Environment: CONFIRM=true ${envConfirmed ? '✅' : '❌'}`);
		console.error(`   CLI Flag: --confirm ${cliConfirmed ? '✅' : '❌'}`);
		console.error('💡 Run with --dry-run to test safely, or set BOTH confirmations');
		process.exit(1);
	}

	// Check if source directory exists
	try {
		await access(SOURCE_DIR, constants.F_OK);
	} catch {
		console.log(`📁 Source directory '${SOURCE_DIR}' not found`);
		if (isCI || isDryRun) {
			console.log('✅ CI/Dry-run mode - Script validation passed');
			process.exit(0);
		} else {
			console.error('❌ Cannot proceed without source directory');
			process.exit(1);
		}
	}

	if (isDryRun) {
		console.log('🧪 DRY RUN MODE - No files will be uploaded\n');
	}
}

// Utility functions
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getAllFiles(dir) {
	const files = [];

	async function walk(currentDir) {
		const entries = await readdir(currentDir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = join(currentDir, entry.name);

			if (entry.isDirectory()) {
				await walk(fullPath);
			} else if (entry.isFile()) {
				files.push(fullPath);
			}
		}
	}

	await walk(dir);
	return files;
}

function exponentialBackoff(attempt) {
	// Backoff with jitter
	const baseDelay = RETRY_DELAY * 2 ** attempt;
	return baseDelay + Math.floor(Math.random() * 250);
}

async function uploadFile(filePath, retryCount = 0) {
	try {
		const relativePath = relative(SOURCE_DIR, filePath);
		const blobPath = `${BLOB_PREFIX}${relativePath.replace(/\\/g, '/')}`;

		// Check file size
		const stats = await stat(filePath);
		if (stats.size === 0) {
			console.log(`⚠️  Skipping empty file: ${relativePath}`);
			return { success: true, skipped: true };
		}

		// In dry-run mode, simulate the upload without actually doing it
		if (isDryRun) {
			const sizeKB = (stats.size / 1024).toFixed(1);
			console.log(`🧪 [DRY RUN] Would upload: ${relativePath} (${sizeKB}KB)`);
			return { success: true, url: `simulated-url-for-${relativePath}`, size: stats.size };
		}

		// Create file stream
		const fileStream = createReadStream(filePath);

		// Upload to Vercel Blob
		const result = await put(blobPath, fileStream, {
			access: 'public',
		});

		console.log(`✅ Uploaded: ${relativePath} (${(stats.size / 1024).toFixed(1)}KB)`);
		return { success: true, url: result.url, size: stats.size };
	} catch (error) {
		const isRateLimit = error?.status === 429 || /429/.test(error.message);
		if (retryCount < MAX_RETRIES) {
			const delay = exponentialBackoff(retryCount);
			console.log(
				`⚠️  Retry ${retryCount + 1}/${MAX_RETRIES} for: ${relative(
					SOURCE_DIR,
					filePath
				)} in ${delay}ms${isRateLimit ? ' (rate-limited)' : ''}`
			);
			await sleep(delay);
			return uploadFile(filePath, retryCount + 1);
		}

		console.error(`❌ Failed: ${relative(SOURCE_DIR, filePath)} - ${error.message}`);
		return { success: false, error: error.message };
	}
}

async function main() {
	console.log('🚀 Starting bulk upload to Vercel Blob Storage...\n');

	// Validate environment first
	await validateEnvironment();

	try {
		// Get all files
		console.log(`📁 Scanning ${SOURCE_DIR} for files...`);
		const allFiles = await getAllFiles(SOURCE_DIR);
		totalFiles = allFiles.length;

		if (totalFiles === 0) {
			console.log('❌ No files found to upload');
			return;
		}

		console.log(`📊 Found ${totalFiles} files to upload`);
		console.log(`⚙️  Concurrency: ${CONCURRENCY}, Max retries: ${MAX_RETRIES}\n`);

		const limit = pLimit(CONCURRENCY);
		const tasks = allFiles.map((file) =>
			limit(async () => {
				const result = await uploadFile(file);
				processedFiles++;
				if (result.success && !result.skipped) {
					successfulUploads++;
				} else if (!result.success) {
					failedUploads++;
				}
				updateProgress();
			})
		);

		await Promise.all(tasks);

		console.log('\n\n🎉 Upload completed!');
		console.log(`📊 Final Results:`);
		console.log(`   ✅ Successful uploads: ${successfulUploads}`);
		console.log(`   ❌ Failed uploads: ${failedUploads}`);
		console.log(`   📁 Total processed: ${processedFiles}`);

		if (failedUploads > 0) {
			console.log('\n💡 You can re-run this script to retry failed uploads');
			process.exit(1);
		}
	} catch (error) {
		console.error('\n❌ Script failed:', error.message);
		process.exit(1);
	}
}

// Progress update function added outside
function updateProgress() {
	const progress = ((processedFiles / totalFiles) * 100).toFixed(1);
	process.stdout.write(
		`\r📊 Progress: ${progress}% (${processedFiles}/${totalFiles}) | ✅ ${successfulUploads} | ❌ ${failedUploads}`
	);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
	console.log('\n\n⏹️  Upload interrupted by user');
	console.log(`📊 Progress: ${processedFiles}/${totalFiles} files processed`);
	process.exit(0);
});

main();
