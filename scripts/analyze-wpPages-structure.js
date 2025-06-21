#!/usr/bin/env node

/**
 * wpPages Structure Analysis Script
 *
 * Analyzes the current flat wpPages structure and categorizes content
 * to help plan the reorganization into a hierarchical structure.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Content classification rules
const CLASSIFICATIONS = {
	tutors: {
		name: 'Tutors',
		description: 'Individual tutor profile pages',
		patterns: [
			// Known tutors from the our-tutors page
			'dr-akshay-goel',
			'eytan-palte',
			'madeleine-basist',
			'radhika-srivastava',
			'viemma-nwigwe',
			'keith-cordner',
			'melissa-wing',
			'kush-patel',
			'ken-nakanote',
			'victoria-lord',
			'pranav-rekapalli',
			'sylvia-rhodes',
			'lucy-wang',
			'max-frankfurter',
			'farid-ghamsari',
			'keon-youssefzadeh',
			'robert-rosen',
			'richard-wang',
			'walid-ashmeik',
			'sai-bhatte',
			'dani-brown',
			'fawaz-naeem',
			'daksh-chauhan',
			'joseph-lu',
			'anna-chen',
			'mimi-kim',
			'justin-sardi',
			'amit-syal',
			'sarah-bell',
			'yehuda-elkaim',
			'katherine-oakley',
			'anthony',
		],
		subcategories: {
			leadership: ['dr-akshay-goel'],
			'medical-doctors': [
				'eytan-palte',
				'madeleine-basist',
				'radhika-srivastava',
				'viemma-nwigwe',
				'melissa-wing',
				'kush-patel',
				'ken-nakanote',
				'richard-wang',
			],
			'medical-students': [
				'victoria-lord',
				'pranav-rekapalli',
				'sylvia-rhodes',
				'lucy-wang',
				'max-frankfurter',
				'farid-ghamsari',
				'keon-youssefzadeh',
				'robert-rosen',
				'walid-ashmeik',
				'sai-bhatte',
				'dani-brown',
				'fawaz-naeem',
				'daksh-chauhan',
				'joseph-lu',
				'anna-chen',
				'mimi-kim',
				'justin-sardi',
				'amit-syal',
				'sarah-bell',
				'yehuda-elkaim',
				'keith-cordner',
				'anthony',
			],
		},
	},
	services: {
		name: 'Services',
		description: 'Main service offerings and consulting',
		patterns: [
			'professional-usmle-tutoring',
			'medical-school-admissions',
			'residency-admissions',
			'coursework',
			'medical-remediation-tutoring',
			'tutoring',
			'admissions',
		],
		subcategories: {
			tutoring: [
				'professional-usmle-tutoring',
				'medical-remediation-tutoring',
				'coursework',
				'tutoring',
			],
			admissions: ['medical-school-admissions', 'residency-admissions', 'admissions'],
		},
	},
	exams: {
		name: 'Exams',
		description: 'Exam-specific information and preparation',
		patterns: [
			'usmle',
			'usmle-tutoring-step-1',
			'step-2ck-usmle',
			'usmle-step-3',
			'failed-step-1-usmle-tutoring',
			'comlex',
			'comlex-1',
			'level-2-ce-and-pe',
			'level-3',
			'mcat',
			'nbme-shelf-exams',
			'conquer-mcat-get-into-medical',
		],
		subcategories: {
			usmle: [
				'usmle',
				'usmle-tutoring-step-1',
				'step-2ck-usmle',
				'usmle-step-3',
				'failed-step-1-usmle-tutoring',
				'professional-usmle-step-2-tutoring',
				'medlearnity-usmle-2',
				'usmletutoring',
				'usmle-study-guide',
			],
			comlex: ['comlex', 'comlex-1', 'level-2-ce-and-pe', 'level-3', 'comlex-tutoring'],
			mcat: ['mcat', 'conquer-mcat-get-into-medical'],
			'shelf-exams': ['nbme-shelf-exams'],
		},
	},
	'specialty-boards': {
		name: 'Specialty Board Exams',
		description: 'Specialized medical board exam preparation',
		patterns: [
			'residency-board-exams',
			'abs-exams',
			'abs-exams-2',
			'abs-qualifying-certifying',
			'abs-certifying-exam',
			'internal-medicine-boards',
			'family-medicine-certification-exam-abfm',
			'abr-core-exam-tutoring',
			'medlearnity-abr-core-exam-tutoring',
			'medlearnity-abs-exam-tutoring',
			'absite-core-shop',
			'qlearn-absite',
		],
	},
	shop: {
		name: 'Shop & E-commerce',
		description: 'Product pages and shopping functionality',
		patterns: [
			'conquer-the-usmle-shop',
			'radiology-core-shop',
			'premed-shop',
			'absite-core-shop',
			'conquer-the-usmle',
			'conquer-the-usmle-2',
		],
	},
	pages: {
		name: 'General Pages',
		description: 'Main informational pages',
		patterns: [
			'about',
			'our-services',
			'our-tutors',
			'start-here',
			'student-testimonials',
			'frequently-asked-questions',
			'choosemedlearnity',
		],
	},
	marketing: {
		name: 'Marketing & Landing Pages',
		description: 'Lead generation and conversion pages',
		patterns: [
			'discounted-trial-session',
			'discounted-trial-session-v2',
			'speak-to-advisor',
			'test-speak-to-advisor',
			'learn-more-via-email',
			'test-learn-more-via-email',
			'how-can-we-assist-you',
			'purchase-discounted-session',
			'core-video-review',
			'cvr-ft-thank-you',
			'ft-thank-you',
			'lmve-thank-you',
			'trial-reservation-thank-you',
			'radreview',
		],
	},
	ecommerce: {
		name: 'E-commerce Functionality',
		description: 'Shopping cart and payment processing',
		patterns: [
			'cart',
			'payment-confirmation',
			'payment-failed',
			'thanks',
			'competitor',
			'apprentice-registration-page',
		],
	},
	legal: {
		name: 'Legal & Compliance',
		description: 'Legal documents and terms',
		patterns: ['terms-and-conditions', 'privacy-policy', 'qlearn-terms-of-use'],
	},
	admin: {
		name: 'Admin & Utilities',
		description: 'Administrative and utility pages',
		patterns: [
			'sitemap',
			'email-reviews',
			'start-here-old-page',
			'test-form',
			'testing',
			'testing-2',
		],
	},
};

/**
 * Get all wpPages directories
 */
function getWpPagesDirectories() {
	const wpPagesPath = path.join(__dirname, '../src/content/wpPages');

	try {
		return fs
			.readdirSync(wpPagesPath, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name)
			.sort();
	} catch (error) {
		console.error('Error reading wpPages directory:', error.message);
		return [];
	}
}

/**
 * Classify a directory based on patterns
 */
function classifyDirectory(dirName) {
	for (const [category, config] of Object.entries(CLASSIFICATIONS)) {
		if (config.patterns.includes(dirName)) {
			// Check for subcategory
			if (config.subcategories) {
				for (const [subcat, patterns] of Object.entries(config.subcategories)) {
					if (patterns.includes(dirName)) {
						return { category, subcategory: subcat };
					}
				}
			}
			return { category, subcategory: null };
		}
	}
	return { category: 'uncategorized', subcategory: null };
}

/**
 * Analyze content of a directory
 */
function analyzeDirectory(dirName) {
	const dirPath = path.join(__dirname, '../src/content/wpPages', dirName);
	const indexPath = path.join(dirPath, 'index.md');

	let analysis = {
		hasIndex: false,
		title: null,
		description: null,
		pubDate: null,
		wordCount: 0,
	};

	try {
		if (fs.existsSync(indexPath)) {
			analysis.hasIndex = true;
			const content = fs.readFileSync(indexPath, 'utf8');

			// Extract frontmatter
			const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
			if (frontmatterMatch) {
				const frontmatter = frontmatterMatch[1];

				// Extract title
				const titleMatch = frontmatter.match(/title:\s*['"]([^'"]*)['"]/);
				if (titleMatch) analysis.title = titleMatch[1];

				// Extract description
				const descMatch = frontmatter.match(/description:\s*['"]([^'"]*)['"]/);
				if (descMatch) analysis.description = descMatch[1];

				// Extract pubDate
				const dateMatch = frontmatter.match(/pubDate:\s*([^\n]*)/);
				if (dateMatch) analysis.pubDate = dateMatch[1].trim();
			}

			// Count words in content (excluding frontmatter)
			const bodyContent = content.replace(/^---\s*\n[\s\S]*?\n---/, '');
			analysis.wordCount = bodyContent.split(/\s+/).filter((word) => word.length > 0).length;
		}
	} catch (error) {
		console.error(`Error analyzing ${dirName}:`, error.message);
	}

	return analysis;
}

/**
 * Generate reorganization plan
 */
function generateReorganizationPlan(categorizedDirs) {
	const plan = {
		commands: [],
		redirects: [],
		summary: {},
	};

	for (const [category, dirs] of Object.entries(categorizedDirs)) {
		if (category === 'uncategorized') continue;

		plan.summary[category] = dirs.length;

		for (const dir of dirs) {
			const { subcategory } = classifyDirectory(dir);
			const targetPath = subcategory ? `${category}/${subcategory}/${dir}` : `${category}/${dir}`;

			plan.commands.push(
				`mkdir -p src/content/wpPages/${category}${subcategory ? '/' + subcategory : ''}`
			);
			plan.commands.push(`mv src/content/wpPages/${dir} src/content/wpPages/${targetPath}`);

			plan.redirects.push({
				source: `/${dir}/`,
				destination: `/${targetPath}/`,
				permanent: true,
			});
		}
	}

	return plan;
}

/**
 * Main analysis function
 */
function analyzeWpPagesStructure() {
	console.log('🔍 Analyzing wpPages Structure...\n');

	const directories = getWpPagesDirectories();
	console.log(`📁 Found ${directories.length} directories in wpPages/\n`);

	// Categorize directories
	const categorized = {};
	const detailed = [];

	for (const dir of directories) {
		const classification = classifyDirectory(dir);
		const analysis = analyzeDirectory(dir);

		if (!categorized[classification.category]) {
			categorized[classification.category] = [];
		}
		categorized[classification.category].push(dir);

		detailed.push({
			directory: dir,
			...classification,
			...analysis,
		});
	}

	// Print summary by category
	console.log('📊 CATEGORIZATION SUMMARY');
	console.log('==================================================');

	for (const [category, config] of Object.entries(CLASSIFICATIONS)) {
		const count = categorized[category]?.length || 0;
		console.log(`${config.name.padEnd(25)} : ${count.toString().padStart(3)} pages`);
	}

	const uncategorizedCount = categorized.uncategorized?.length || 0;
	console.log(`${'Uncategorized'.padEnd(25)} : ${uncategorizedCount.toString().padStart(3)} pages`);
	console.log(`${'TOTAL'.padEnd(25)} : ${directories.length.toString().padStart(3)} pages`);

	// Print detailed breakdown
	console.log('\n📋 DETAILED BREAKDOWN');
	console.log('==================================================');

	for (const [category, dirs] of Object.entries(categorized)) {
		if (dirs.length === 0) continue;

		const categoryName = CLASSIFICATIONS[category]?.name || 'Uncategorized';
		console.log(`\n${categoryName.toUpperCase()} (${dirs.length})`);
		console.log('-'.repeat(50));

		for (const dir of dirs.sort()) {
			const detail = detailed.find((d) => d.directory === dir);
			const title = detail.title || 'No title';
			const words = detail.wordCount || 0;
			console.log(
				`  ${dir.padEnd(35)} | ${title.substring(0, 40).padEnd(40)} | ${words.toString().padStart(4)} words`
			);
		}
	}

	// Print uncategorized for manual review
	if (categorized.uncategorized?.length > 0) {
		console.log('\n⚠️  UNCATEGORIZED DIRECTORIES');
		console.log('==================================================');
		console.log('These directories need manual categorization:');

		for (const dir of categorized.uncategorized.sort()) {
			const detail = detailed.find((d) => d.directory === dir);
			const title = detail.title || 'No title';
			console.log(`  ${dir.padEnd(35)} | ${title}`);
		}
	}

	// Generate reorganization plan
	const plan = generateReorganizationPlan(categorized);

	console.log('\n🎯 REORGANIZATION IMPACT');
	console.log('==================================================');
	console.log(
		`Total directories to reorganize: ${directories.length - (categorized.uncategorized?.length || 0)}`
	);
	console.log(`Total redirects needed: ${plan.redirects.length}`);
	console.log(`Unique commands needed: ${[...new Set(plan.commands)].length}`);

	// Write detailed report
	const reportPath = path.join(__dirname, '../docs/wpPages-analysis-report.json');
	const report = {
		timestamp: new Date().toISOString(),
		totalDirectories: directories.length,
		categorized,
		detailed,
		reorganizationPlan: plan,
	};

	fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
	console.log(`\n📄 Detailed report saved to: ${reportPath}`);

	console.log('\n🚀 NEXT STEPS');
	console.log('==================================================');
	console.log('1. Review uncategorized directories and add to classifications');
	console.log('2. Run reorganization script to implement new structure');
	console.log('3. Update routing to handle nested paths');
	console.log('4. Add redirects for SEO preservation');
	console.log('5. Test build process with new structure');
}

// Run analysis
analyzeWpPagesStructure();
