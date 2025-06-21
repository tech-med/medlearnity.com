#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// ANSI color codes for better output
const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	bold: '\x1b[1m',
};

function log(message, color = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function extractFrontmatter(content) {
	const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
	const match = content.match(frontmatterRegex);

	if (!match) {
		return { frontmatter: null, error: 'No frontmatter found' };
	}

	return { frontmatter: match[1], error: null };
}

function validateYaml(yamlContent) {
	try {
		const parsed = yaml.load(yamlContent);
		return { valid: true, parsed };
	} catch (error) {
		return { valid: false, error: error.message };
	}
}

function validateRequiredFields(parsed) {
	const required = ['title'];
	const missing = [];

	for (const field of required) {
		if (!parsed[field]) {
			missing.push(field);
		}
	}

	return missing.length === 0 ? { valid: true } : { valid: false, missing };
}

function scanDirectory(dir) {
	const results = {
		totalFiles: 0,
		validFiles: 0,
		invalidFiles: 0,
		errors: [],
	};

	function processFile(filePath) {
		if (!filePath.endsWith('.md') && !filePath.endsWith('.mdx')) {
			return;
		}

		results.totalFiles++;
		const relativePath = path.relative(process.cwd(), filePath);

		try {
			const content = fs.readFileSync(filePath, 'utf8');
			const { frontmatter, error: extractError } = extractFrontmatter(content);

			if (extractError) {
				results.invalidFiles++;
				results.errors.push({
					file: relativePath,
					error: extractError,
					type: 'extraction',
				});
				return;
			}

			const { parsed, error: yamlError } = validateYaml(frontmatter);

			if (yamlError) {
				results.invalidFiles++;
				results.errors.push({
					file: relativePath,
					error: `YAML parsing error: ${yamlError}`,
					type: 'yaml',
				});
				return;
			}

			const schemaErrors = validateRequiredFields(parsed);
			if (!schemaErrors.valid) {
				results.invalidFiles++;
				results.errors.push({
					file: relativePath,
					error: schemaErrors.missing.join(', '),
					type: 'schema',
				});
				return;
			}

			results.validFiles++;
		} catch (error) {
			results.invalidFiles++;
			results.errors.push({
				file: relativePath,
				error: `File reading error: ${error.message}`,
				type: 'file',
			});
		}
	}

	function walkDir(currentDir) {
		const items = fs.readdirSync(currentDir);

		for (const item of items) {
			const itemPath = path.join(currentDir, item);
			const stat = fs.statSync(itemPath);

			if (stat.isDirectory()) {
				walkDir(itemPath);
			} else {
				processFile(itemPath);
			}
		}
	}

	walkDir(dir);
	return results;
}

// Main execution
function main() {
	log('🔍 Starting YAML Frontmatter Validation...', 'cyan');
	console.log();

	const contentDirs = [
		path.join(process.cwd(), 'src/content/wpPages'),
		path.join(process.cwd(), 'src/content/blog'),
	];

	let totalResults = {
		totalFiles: 0,
		validFiles: 0,
		invalidFiles: 0,
		errors: [],
	};

	for (const dir of contentDirs) {
		if (!fs.existsSync(dir)) {
			log(`⚠️  Directory not found: ${dir}`, 'yellow');
			continue;
		}

		log(`📁 Scanning ${path.relative(process.cwd(), dir)}...`, 'blue');
		const results = scanDirectory(dir);

		// Merge results
		totalResults.totalFiles += results.totalFiles;
		totalResults.validFiles += results.validFiles;
		totalResults.invalidFiles += results.invalidFiles;
		totalResults.errors.push(...results.errors);

		log(
			`   Found ${results.totalFiles} files, ${results.validFiles} valid, ${results.invalidFiles} invalid`,
			'magenta'
		);
	}

	console.log();
	log('📊 VALIDATION SUMMARY', 'bold');
	log('='.repeat(50), 'blue');
	log(`Total Files Scanned: ${totalResults.totalFiles}`, 'cyan');
	log(`✅ Valid Files: ${totalResults.validFiles}`, 'green');
	log(`❌ Invalid Files: ${totalResults.invalidFiles}`, 'red');

	if (totalResults.errors.length > 0) {
		console.log();
		log('🚨 ERRORS FOUND:', 'red');
		log('='.repeat(50), 'red');

		// Group errors by type
		const errorsByType = {
			yaml: [],
			schema: [],
			extraction: [],
			file: [],
		};

		totalResults.errors.forEach((error) => {
			errorsByType[error.type].push(error);
		});

		// Display errors by type
		Object.entries(errorsByType).forEach(([type, errors]) => {
			if (errors.length === 0) return;

			console.log();
			log(`${type.toUpperCase()} ERRORS (${errors.length}):`, 'yellow');
			errors.forEach((error) => {
				log(`  📄 ${error.file}`, 'cyan');
				log(`     ${error.error}`, 'red');
			});
		});

		console.log();
		log(`❌ Validation completed with ${totalResults.errors.length} errors!`, 'red');
		process.exit(1);
	} else {
		console.log();
		log('🎉 All files have valid YAML frontmatter!', 'green');
		process.exit(0);
	}
}

main();
