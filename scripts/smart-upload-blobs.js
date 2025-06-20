#!/usr/bin/env node
// scripts/smart-upload-blobs.js
import { put, list } from '@vercel/blob';
import { readdir, stat } from 'fs/promises';
import { join, relative, basename } from 'path';
import { createReadStream } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Check for dry-run flag
const isDryRun = process.argv.includes('--dry-run');
const isConfirmed = process.env.CONFIRM === 'true' || isDryRun;

if (!isDryRun && !isConfirmed) {
  console.error('❌ Destructive script requires confirmation. Run with --dry-run to test, or set CONFIRM=true');
  process.exit(1);
}

if (isDryRun) {
  console.log('🧪 DRY RUN MODE - No files will be uploaded\n');
}

const BATCH_SIZE = 15; // Process 15 files at a time (Pro account can handle more)
const MAX_RETRIES = 3;
const RETRY_DELAY = 500; // 500ms between retries

// Configuration
const SOURCE_DIR = 'public/images/wp';
const BLOB_PREFIX = 'wp/';

// Progress tracking
let totalFiles = 0;
let processedFiles = 0;
let successfulUploads = 0;
let failedUploads = 0;
let skippedFiles = 0;

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getAllLocalFiles(dir) {
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

async function getExistingBlobs() {
  console.log('🔍 Checking existing blobs...');
  const existingBlobs = new Set();
  let cursor;
  
  try {
    do {
      const result = await list({ 
        prefix: BLOB_PREFIX, 
        limit: 1000,
        cursor 
      });
      
      result.blobs.forEach(blob => {
        // Extract filename from pathname for comparison
        const filename = basename(blob.pathname);
        existingBlobs.add(filename);
      });
      
      cursor = result.cursor;
      process.stdout.write(`\r🔍 Found ${existingBlobs.size} existing blobs...`);
      
    } while (cursor);
    
    console.log(`\n✅ Found ${existingBlobs.size} existing blobs`);
    return existingBlobs;
    
  } catch (error) {
    console.error('❌ Error fetching existing blobs:', error.message);
    return new Set(); // Return empty set to upload all files
  }
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
      return { success: true, url: `simulated-url-for-${basename(filePath)}`, size: stats.size };
    }
    
    // Create file stream
    const fileStream = createReadStream(filePath);
    
    // Upload to Vercel Blob
    const result = await put(blobPath, fileStream, {
      access: 'public',
    });
    
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`✅ ${relativePath} (${sizeKB}KB)`);
    return { success: true, url: result.url, size: stats.size };
    
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await sleep(RETRY_DELAY * (retryCount + 1));
      return uploadFile(filePath, retryCount + 1);
    }
    
    console.error(`❌ ${relative(SOURCE_DIR, filePath)} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function processBatch(files) {
  const promises = files.map(file => uploadFile(file));
  const results = await Promise.allSettled(promises);
  
  results.forEach((result) => {
    processedFiles++;
    
    if (result.status === 'fulfilled' && result.value.success) {
      if (!result.value.skipped) {
        successfulUploads++;
      }
    } else {
      failedUploads++;
    }
  });
}

function updateProgress() {
  const progress = ((processedFiles / totalFiles) * 100).toFixed(1);
  const remaining = totalFiles - processedFiles;
  process.stdout.write(`\r📊 ${progress}% | ✅ ${successfulUploads} | ❌ ${failedUploads} | ⏳ ${remaining} remaining`);
}

async function main() {
  console.log('🚀 Smart Blob Upload - Only uploads missing files\n');
  
  try {
    // Get existing blobs first
    const existingBlobs = await getExistingBlobs();
    
    // Get all local files
    console.log(`\n📁 Scanning ${SOURCE_DIR} for files...`);
    const allLocalFiles = await getAllLocalFiles(SOURCE_DIR);
    
    // Filter out files that already exist
    const filesToUpload = allLocalFiles.filter(filePath => {
      const filename = basename(filePath);
      const exists = existingBlobs.has(filename);
      if (exists) {
        skippedFiles++;
      }
      return !exists;
    });
    
    totalFiles = filesToUpload.length;
    
    console.log(`\n📊 Upload Summary:`);
    console.log(`   📁 Total local files: ${allLocalFiles.length}`);
    console.log(`   ✅ Already uploaded: ${skippedFiles}`);
    console.log(`   🔄 Need to upload: ${totalFiles}`);
    
    if (totalFiles === 0) {
      console.log('\n🎉 All files are already uploaded!');
      return;
    }
    
    console.log(`\n⚙️  Processing in batches of ${BATCH_SIZE}...\n`);
    
    // Process files in batches
    for (let i = 0; i < filesToUpload.length; i += BATCH_SIZE) {
      const batch = filesToUpload.slice(i, i + BATCH_SIZE);
      await processBatch(batch);
      updateProgress();
      
      // Small delay between batches
      if (i + BATCH_SIZE < filesToUpload.length) {
        await sleep(50);
      }
    }
    
    console.log('\n\n🎉 Upload completed!');
    console.log(`📊 Final Results:`);
    console.log(`   ✅ Successful uploads: ${successfulUploads}`);
    console.log(`   ❌ Failed uploads: ${failedUploads}`);
    console.log(`   ⏭️  Already existed: ${skippedFiles}`);
    console.log(`   📁 Total processed: ${allLocalFiles.length}`);
    
    if (failedUploads > 0) {
      console.log('\n💡 Re-run this script to retry failed uploads');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Upload interrupted by user');
  console.log(`📊 Progress: ${processedFiles}/${totalFiles} files processed`);
  process.exit(0);
});

main(); 