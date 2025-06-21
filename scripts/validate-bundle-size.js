#!/usr/bin/env node
// scripts/validate-bundle-size.js
// Monitor bundle size and fail CI on significant growth

import { stat, writeFile, readFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const DIST_DIR = 'dist';
const SIZE_FILE = 'scripts/.bundle-baseline.json';
const MAX_SIZE_MB = 10; // Maximum allowed size in MB
const MAX_GROWTH_KB = 50; // Maximum allowed growth in KB

async function getDirectorySize(dir) {
	try {
		const { stdout } = await execAsync(`du -sk ${dir}`);
		const sizeKB = parseInt(stdout.split('\t')[0]);
		return sizeKB;
	} catch {
		console.error(`Error getting size of ${dir}`);
		return 0;
	}
}

async function getPreviousSize() {
	try {
		const content = await readFile(SIZE_FILE, 'utf-8');
		const baseline = JSON.parse(content);
		return baseline.sizeKB || null;
	} catch {
		// File doesn't exist, this is the first build
		return null;
	}
}

async function main() {
	console.log('📊 Bundle Size Validation');
	console.log('=========================');

	try {
		// Check if dist directory exists
		await stat(DIST_DIR);
	} catch {
		console.error(`❌ Build directory '${DIST_DIR}' not found`);
		console.error('💡 Run "npm run build" first');
		process.exit(1);
	}

	const currentSizeKB = await getDirectorySize(DIST_DIR);
	const currentSizeMB = (currentSizeKB / 1024).toFixed(2);

	console.log(`📁 Current bundle size: ${currentSizeKB} KB (${currentSizeMB} MB)`);

	// Check absolute size limit
	if (currentSizeKB > MAX_SIZE_MB * 1024) {
		console.error(`❌ Bundle too large: ${currentSizeMB} MB > ${MAX_SIZE_MB} MB limit`);
		console.error('💡 Optimize assets, remove unused dependencies, or enable compression');
		process.exit(1);
	}

	// Check growth compared to previous build
	const previousSizeKB = await getPreviousSize();

	if (previousSizeKB !== null) {
		const growthKB = currentSizeKB - previousSizeKB;
		const growthPercent = ((growthKB / previousSizeKB) * 100).toFixed(1);

		console.log(`📈 Size change: ${growthKB > 0 ? '+' : ''}${growthKB} KB (${growthPercent}%)`);
		console.log(`📊 Previous: ${previousSizeKB} KB → Current: ${currentSizeKB} KB`);

		if (growthKB > MAX_GROWTH_KB) {
			console.error(`❌ Bundle growth too large: ${growthKB} KB > ${MAX_GROWTH_KB} KB limit`);
			console.error('💡 Check what was added and optimize if possible');
			process.exit(1);
		}

		if (growthKB > 0) {
			console.log(`⚠️  Bundle size increased by ${growthKB} KB`);
		} else {
			console.log(`✅ Bundle size optimized (${Math.abs(growthKB)} KB smaller)`);
		}
	} else {
		console.log('📝 First build - establishing baseline');
	}

	// Save current size for next comparison
	const baseline = {
		buildDate: new Date().toISOString(),
		sizeKB: currentSizeKB,
		sizeMB: parseFloat(currentSizeMB),
		maxSizeLimitMB: MAX_SIZE_MB,
		maxGrowthLimitKB: MAX_GROWTH_KB,
		nodeVersion: process.version,
		platform: process.platform,
	};

	await writeFile(SIZE_FILE, JSON.stringify(baseline, null, 2));

	console.log('✅ Bundle size validation passed');
	console.log(`📄 Baseline saved to ${SIZE_FILE}`);
}

main().catch((error) => {
	console.error('❌ Bundle size validation failed:', error.message);
	process.exit(1);
});
