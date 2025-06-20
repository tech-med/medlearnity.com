#!/usr/bin/env node
// scripts/bulk-upload-blobs.js
import { put } from '@vercel/blob';
import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import { createReadStream } from 'fs';

const BATCH_SIZE = 10; // Process 10 files at a time
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Configuration
const SOURCE_DIR = 'public/images/wp';
const BLOB_PREFIX = 'wp/';

// Progress tracking
let totalFiles = 0;
let processedFiles = 0;
let successfulUploads = 0;
let failedUploads = 0;

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
    if (retryCount < MAX_RETRIES) {
      console.log(`⚠️  Retry ${retryCount + 1}/${MAX_RETRIES} for: ${relative(SOURCE_DIR, filePath)}`);
      await sleep(RETRY_DELAY * (retryCount + 1));
      return uploadFile(filePath, retryCount + 1);
    }
    
    console.error(`❌ Failed: ${relative(SOURCE_DIR, filePath)} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function processBatch(files) {
  const promises = files.map(file => uploadFile(file));
  const results = await Promise.allSettled(promises);
  
  results.forEach((result) => {
    processedFiles++;
    
    if (result.status === 'fulfilled' && result.value.success) {
      successfulUploads++;
    } else {
      failedUploads++;
    }
    
    // Progress update
    const progress = ((processedFiles / totalFiles) * 100).toFixed(1);
    process.stdout.write(`\r📊 Progress: ${progress}% (${processedFiles}/${totalFiles}) | ✅ ${successfulUploads} | ❌ ${failedUploads}`);
  });
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
    console.log(`⚙️  Processing in batches of ${BATCH_SIZE}\n`);
    
    // Process files in batches
    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      const batch = allFiles.slice(i, i + BATCH_SIZE);
      await processBatch(batch);
      
      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < allFiles.length) {
        await sleep(100);
      }
    }
    
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

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Upload interrupted by user');
  console.log(`📊 Progress: ${processedFiles}/${totalFiles} files processed`);
  process.exit(0);
});

main(); 