#!/usr/bin/env node
// scripts/bulk-upload-blobs.js
import { put } from '@vercel/blob';
import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import { createReadStream } from 'fs';
import pLimit from 'p-limit';

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

const CONCURRENCY = Math.max(1, Number(getArg('--concurrency', 5)) || 5);
const MAX_RETRIES = Number(getArg('--max-retries', 3));
const RETRY_DELAY = Number(getArg('--retry-delay', 1000)); // milliseconds

// Warn if concurrency < 1
if (Number.isNaN(CONCURRENCY) || CONCURRENCY < 1) {
	console.warn('⚠️  Invalid --concurrency value. Falling back to 5');
}

// Configuration
const SOURCE_DIR = 'public/images/wp';
const BLOB_PREFIX = 'wp/';

// Progress tracking
let totalFiles = 0;
let processedFiles = 0;
let successfulUploads = 0;
let failedUploads = 0;

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
