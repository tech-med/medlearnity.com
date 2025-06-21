#!/usr/bin/env node
// scripts/validate-csp-compliance.js
// Build-time CSP validation to prevent inline style regressions

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const CONTENT_DIRS = ['src/content', 'src/components', 'src/layouts', 'src/pages'];
const INLINE_STYLE_PATTERNS = [
	/style\s*=\s*["'][^"']*["']/gi, // style="..." or style='...'
	/<[^>]+\sstyle\s*=/gi, // Any HTML tag with style attribute
];

let violationCount = 0;

async function scanDirectory(dir) {
	try {
		const entries = await readdir(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = join(dir, entry.name);

			if (entry.isDirectory()) {
				await scanDirectory(fullPath);
			} else if (entry.isFile() && /\.(md|mdx|astro|html|vue|svelte)$/i.test(entry.name)) {
				await scanFile(fullPath);
			}
		}
	} catch (error) {
		// Directory might not exist, skip silently
		if (error.code !== 'ENOENT') {
			console.error(`Error scanning ${dir}: ${error.message}`);
		}
	}
}

async function scanFile(filePath) {
	try {
		const content = await readFile(filePath, 'utf-8');

		for (const pattern of INLINE_STYLE_PATTERNS) {
			const matches = content.match(pattern);
			if (matches) {
				violationCount += matches.length;
				console.error(`❌ CSP VIOLATION in ${filePath}:`);

				matches.forEach((match) => {
					console.error(`   ${match}`);
				});

				// Show context around the violation
				const lines = content.split('\n');
				matches.forEach((match) => {
					const lineIndex = lines.findIndex((line) => line.includes(match));
					if (lineIndex !== -1) {
						console.error(`   Line ${lineIndex + 1}: ${lines[lineIndex].trim()}`);
					}
				});
				console.error('');
			}
		}
	} catch (error) {
		console.error(`Error reading ${filePath}: ${error.message}`);
	}
}

async function main() {
	console.log('🔍 CSP Compliance Validation');
	console.log('=============================');
	console.log('Scanning for inline styles that violate Content Security Policy...\n');

	for (const dir of CONTENT_DIRS) {
		console.log(`📁 Scanning ${dir}/...`);
		await scanDirectory(dir);
	}

	console.log('\n📊 VALIDATION RESULTS');
	console.log('====================');

	if (violationCount === 0) {
		console.log('✅ No CSP violations found!');
		console.log('✅ All content is CSP-compliant');
		process.exit(0);
	} else {
		console.error(`❌ Found ${violationCount} CSP violation(s)`);
		console.error('❌ Build failed due to inline styles');
		console.error('\n💡 Fix: Remove inline styles and use CSS classes instead');
		console.error('   Example: <div style="color: red"> → <div class="text-red">');
		process.exit(1);
	}
}

main().catch((error) => {
	console.error('❌ CSP validation script failed:', error.message);
	process.exit(1);
});
