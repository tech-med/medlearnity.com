#!/usr/bin/env node
// scripts/clean-wordpress-artifacts.js
// Remove WordPress shortcode artifacts from content files

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, relative } from 'path';

// WordPress artifacts to remove
const WORDPRESS_ARTIFACTS = [
	// Color palette configs - improved pattern
	/__CONFIG_colors_palette__\{[^_]*?__CONFIG_colors_palette__/gs,
	// Alternative color palette pattern
	/__CONFIG_colors_palette__[^_]+?__CONFIG_colors_palette__/gs,
	// Color palette configs with escaped underscores
	/\\_\\_CONFIG_colors_palette\\_\\_\{[^_]*?\\_\\_CONFIG_colors_palette\\_\\_/gs,
	// Alternative color palette pattern with escaped underscores
	/\\_\\_CONFIG_colors_palette\\_\\_[^_]+?\\_\\_CONFIG_colors_palette\\_\\_/gs,
	// Trustindex widgets
	/\[trustindex[^\]]*\]/g,
	// WordPress shortcodes that remain
	/\[tcb[^\]]*\]/g,
	// Empty or malformed links
	/\[\]\([^)]*\)/g,
	// Malformed image syntax at end of lines
	/!\s*$/gm,
];

// Directories to clean
const CONTENT_DIRS = ['src/content/blog', 'src/content/wpPages'];

// Statistics
let totalFiles = 0;
let cleanedFiles = 0;
let totalArtifacts = 0;

function cleanContent(content) {
	let cleaned = content;
	let artifactsFound = 0;

	WORDPRESS_ARTIFACTS.forEach((regex) => {
		const matches = cleaned.match(regex);
		if (matches) {
			artifactsFound += matches.length;
			cleaned = cleaned.replace(regex, '');
		}
	});

	// Clean up extra whitespace left by removed artifacts
	cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
	cleaned = cleaned.replace(/[ \t]+\n/g, '\n');

	return { cleaned, artifactsFound };
}

async function processFile(filePath) {
	try {
		const content = await readFile(filePath, 'utf8');
		const { cleaned, artifactsFound } = cleanContent(content);

		if (artifactsFound > 0) {
			await writeFile(filePath, cleaned, 'utf8');
			cleanedFiles++;
			totalArtifacts += artifactsFound;

			const relativePath = relative(process.cwd(), filePath);
			console.log(`✅ ${relativePath}: removed ${artifactsFound} artifacts`);
		}

		totalFiles++;
	} catch (error) {
		console.error(`❌ Error processing ${filePath}:`, error.message);
	}
}

async function scanDirectory(dir) {
	try {
		const entries = await readdir(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = join(dir, entry.name);

			if (entry.isDirectory()) {
				await scanDirectory(fullPath);
			} else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
				await processFile(fullPath);
			}
		}
	} catch (error) {
		console.error(`❌ Error scanning directory ${dir}:`, error.message);
	}
}

async function main() {
	console.log('🧹 Cleaning WordPress Artifacts from Content Files\n');

	for (const dir of CONTENT_DIRS) {
		console.log(`📁 Processing ${dir}...`);
		await scanDirectory(dir);
	}

	console.log('\n📊 Cleanup Summary:');
	console.log(`   📄 Total files processed: ${totalFiles}`);
	console.log(`   ✅ Files cleaned: ${cleanedFiles}`);
	console.log(`   🗑️  Total artifacts removed: ${totalArtifacts}`);

	if (cleanedFiles > 0) {
		console.log('\n🎉 WordPress artifacts successfully cleaned!');
	} else {
		console.log('\n✨ No WordPress artifacts found - content is clean!');
	}
}

main().catch((error) => {
	console.error('❌ Script failed:', error.message);
	process.exit(1);
});
