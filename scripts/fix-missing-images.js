#!/usr/bin/env node
// scripts/fix-missing-images.js
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Configuration
const CONTENT_DIRS = ['src/content/blog', 'src/content/wpPages'];
const BACKUP_DIR = 'public/images/wp';
const BASE_BLOB_URL = 'https://i2xfwztd2ksbegse.public.blob.vercel-storage.com/wp';

// Progress tracking
let totalImages = 0;
let foundImages = 0;
let uploadedImages = 0;
let missingImages = 0;

console.log('🔍 Scanning content for image references...');

async function getAllMarkdownFiles(dirs) {
	const files = [];

	for (const dir of dirs) {
		async function walk(currentDir) {
			try {
				const entries = await readdir(currentDir, { withFileTypes: true });

				for (const entry of entries) {
					const fullPath = join(currentDir, entry.name);

					if (entry.isDirectory()) {
						await walk(fullPath);
					} else if (entry.isFile() && entry.name.endsWith('.md')) {
						files.push(fullPath);
					}
				}
			} catch (error) {
				console.log(`⚠️  Skipping directory ${currentDir}: ${error.message}`);
			}
		}

		await walk(dir);
	}

	return files;
}

function extractImageUrls(content) {
	const imageUrls = new Set();

	// Match blob storage URLs
	const blobRegex =
		/https:\/\/i2xfwztd2ksbegse\.public\.blob\.vercel-storage\.com\/wp\/([^)\s"']+)/g;
	let match;

	while ((match = blobRegex.exec(content)) !== null) {
		imageUrls.add(match[1]); // Just the path part after wp/
	}

	return Array.from(imageUrls);
}

async function findFileInBackup(imagePath) {
	// Try to find the file in the backup directory
	const possiblePaths = [
		join(BACKUP_DIR, imagePath),
		join(BACKUP_DIR, imagePath.replace(/^wp\//, '')),
	];

	for (const path of possiblePaths) {
		try {
			await stat(path);
			return path;
		} catch {
			// File doesn't exist at this path
		}
	}

	return null;
}

async function checkImageExists(imagePath) {
	try {
		const response = await fetch(`${BASE_BLOB_URL}/${imagePath}`, {
			method: 'HEAD',
		});
		return response.ok;
	} catch {
		return false;
	}
}

async function uploadImage(localPath, blobPath) {
	try {
		const command = `vercel blob put "${localPath}" --pathname "wp/${blobPath}" --force`;
		execSync(command, { encoding: 'utf8', stdio: 'pipe' });

		console.log(`✅ Uploaded: ${blobPath}`);
		return true;
	} catch (error) {
		console.log(`❌ Failed to upload ${blobPath}: ${error.message}`);
		return false;
	}
}

async function main() {
	try {
		// Get all markdown files
		const markdownFiles = await getAllMarkdownFiles(CONTENT_DIRS);
		console.log(`📄 Found ${markdownFiles.length} content files`);

		// Extract all image URLs
		const allImageUrls = new Set();

		for (const file of markdownFiles) {
			const content = await readFile(file, 'utf-8');
			const imageUrls = extractImageUrls(content);

			imageUrls.forEach((url) => allImageUrls.add(url));
		}

		const uniqueImages = Array.from(allImageUrls);
		totalImages = uniqueImages.length;

		console.log(`🖼️  Found ${totalImages} unique image references`);

		if (totalImages === 0) {
			console.log('✅ No images found to process');
			return;
		}

		// Check each image
		const missingImagesList = [];

		console.log('🔍 Checking which images are missing from blob storage...');

		for (let i = 0; i < uniqueImages.length; i++) {
			const imagePath = uniqueImages[i];
			const progress = Math.round((i / uniqueImages.length) * 100);

			process.stdout.write(`\r📊 Progress: ${progress}% (${i + 1}/${uniqueImages.length})`);

			const exists = await checkImageExists(imagePath);

			if (exists) {
				foundImages++;
			} else {
				missingImagesList.push(imagePath);
				missingImages++;
			}
		}

		console.log(`\n\n📊 Image Status:`);
		console.log(`   ✅ Found in blob storage: ${foundImages}`);
		console.log(`   ❌ Missing from blob storage: ${missingImages}`);

		if (missingImagesList.length === 0) {
			console.log('🎉 All images are already uploaded!');
			return;
		}

		console.log(`\n🔄 Uploading ${missingImagesList.length} missing images...`);

		// Upload missing images
		for (let i = 0; i < missingImagesList.length; i++) {
			const imagePath = missingImagesList[i];
			const progress = Math.round((i / missingImagesList.length) * 100);

			console.log(`\n📊 ${progress}% | Uploading: ${imagePath}`);

			// Find the file in backup
			const localPath = await findFileInBackup(imagePath);

			if (!localPath) {
				console.log(`⚠️  File not found in backup: ${imagePath}`);
				continue;
			}

			// Upload to blob storage
			const success = await uploadImage(localPath, imagePath);

			if (success) {
				uploadedImages++;
			}

			// Small delay to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		console.log(`\n🎉 Upload completed!`);
		console.log(`📊 Final Results:`);
		console.log(`   🖼️  Total images referenced: ${totalImages}`);
		console.log(`   ✅ Already existed: ${foundImages}`);
		console.log(`   ❌ Missing: ${missingImages}`);
		console.log(`   📤 Successfully uploaded: ${uploadedImages}`);
		console.log(`   ⚠️  Failed/Not found: ${missingImages - uploadedImages}`);
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

main();
