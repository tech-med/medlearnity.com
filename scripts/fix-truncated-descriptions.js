#!/usr/bin/env node
// scripts/fix-truncated-descriptions.js
// Fix truncated descriptions in content files

import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';

// Directories to check
const CONTENT_DIRS = ['src/content/blog', 'src/content/wpPages'];

// Pattern to detect truncated descriptions (ending mid-word or with incomplete sentences)
const TRUNCATION_PATTERNS = [
	/description:\s*['"](.*?)(\s+(and\s+I|I\s+alway|stri|for\s+the|to\s+the|of\s+the|with\s+the|that\s+the|in\s+the|on\s+the|at\s+the|by\s+the|from\s+the))$/m,
	/description:\s*['"](.*?)\s+(stri|alway|prep|ment|guid|help|work|stud|exam|test|medi|doct|pati|surg|resi|prog|appl)$/m,
	/description:\s*['"](.*?)\s+[a-z]{1,3}$/m, // Ends with very short incomplete word
];

// Common completion patterns based on medical education context
const COMPLETION_SUGGESTIONS = {
	stri: 'strive to help students achieve their goals',
	alway: 'always committed to excellence in medical education',
	prep: 'preparation for success in medical examinations',
	ment: 'mentoring students throughout their medical journey',
	guid: 'guidance and support for aspiring medical professionals',
	help: 'helping students excel in their medical education',
	work: 'working with students to achieve their academic goals',
	stud: 'studying for medical examinations and board certifications',
	exam: 'examinations with comprehensive preparation strategies',
	test: 'testing with proven methods and expert guidance',
	medi: 'medical education and professional development',
	doct: 'doctors and medical professionals in training',
	pati: 'patient care and medical excellence',
	surg: 'surgical education and board preparation',
	resi: 'residency applications and career guidance',
	prog: 'programs designed for medical student success',
	appl: 'applications and admissions consulting services',
};

// Statistics
let totalFiles = 0;
let truncatedFound = 0;
let descriptionsFixed = 0;

function detectTruncation(content) {
	const lines = content.split('\n');
	const frontmatterEnd = lines.findIndex((line, index) => line.trim() === '---' && index > 0);

	if (frontmatterEnd === -1) return null;

	const frontmatter = lines.slice(0, frontmatterEnd + 1).join('\n');
	const descriptionMatch = frontmatter.match(/description:\s*['"](.*?)['"]$/m);

	if (!descriptionMatch) return null;

	const description = descriptionMatch[1];

	// Check for various truncation patterns
	for (const pattern of TRUNCATION_PATTERNS) {
		const match = `description: "${description}"`.match(pattern);
		if (match) {
			return {
				originalDescription: description,
				truncatedPart: match[2] || match[1].split(' ').pop(),
				fullMatch: match[0],
				isDefinitelyTruncated:
					description.length > 50 &&
					!description.endsWith('.') &&
					!description.endsWith('!') &&
					!description.endsWith('?'),
			};
		}
	}

	// Additional heuristic: very long descriptions that don't end with punctuation
	if (description.length > 100 && !description.match(/[.!?]$/)) {
		return {
			originalDescription: description,
			truncatedPart: description.split(' ').pop(),
			isDefinitelyTruncated: true,
		};
	}

	return null;
}

function suggestCompletion(truncationInfo) {
	const { originalDescription, truncatedPart } = truncationInfo;

	// Try to find a suitable completion
	for (const [pattern, completion] of Object.entries(COMPLETION_SUGGESTIONS)) {
		if (truncatedPart.toLowerCase().includes(pattern)) {
			return `${originalDescription.replace(truncatedPart, '')} ${completion}.`;
		}
	}

	// Generic completions based on context
	if (originalDescription.toLowerCase().includes('tutor')) {
		return `${originalDescription} to help students achieve their academic goals.`;
	}

	if (
		originalDescription.toLowerCase().includes('medical') ||
		originalDescription.toLowerCase().includes('exam')
	) {
		return `${originalDescription} for medical education excellence.`;
	}

	// Default fallback
	return `${originalDescription}.`;
}

async function processFile(filePath) {
	try {
		const content = await readFile(filePath, 'utf8');
		const truncationInfo = detectTruncation(content);

		totalFiles++;

		if (truncationInfo && truncationInfo.isDefinitelyTruncated) {
			truncatedFound++;

			const relativePath = relative(process.cwd(), filePath);
			console.log(`\n🔍 Found truncated description in: ${relativePath}`);
			console.log(`   Original: "${truncationInfo.originalDescription}"`);

			const suggested = suggestCompletion(truncationInfo);
			console.log(`   Suggested: "${suggested}"`);

			// For now, just report - don't auto-fix without review
			console.log(`   ⚠️  Manual review recommended`);
		}
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
	console.log('🔍 Scanning for Truncated Descriptions in Content Files\n');

	for (const dir of CONTENT_DIRS) {
		console.log(`📁 Processing ${dir}...`);
		await scanDirectory(dir);
	}

	console.log('\n📊 Scan Summary:');
	console.log(`   📄 Total files scanned: ${totalFiles}`);
	console.log(`   ⚠️  Truncated descriptions found: ${truncatedFound}`);
	console.log(`   ✅ Descriptions fixed: ${descriptionsFixed}`);

	if (truncatedFound > 0) {
		console.log('\n💡 Manual review and fixing of descriptions is recommended.');
		console.log('   Consider updating descriptions to be complete and SEO-friendly.');
	} else {
		console.log('\n✨ No truncated descriptions found - all content looks good!');
	}
}

main().catch((error) => {
	console.error('❌ Script failed:', error.message);
	process.exit(1);
});
