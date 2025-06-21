#!/usr/bin/env node
/**
 * Process WordPress audit data and compare with Astro build
 */

import fs from 'fs';
import path from 'path';

const TIMESTAMP = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '').replace('T', '-');

// Find the latest WordPress CSV file
const auditDir = 'docs/audit';
const csvFiles = fs
	.readdirSync(auditDir)
	.filter((f) => f.startsWith('wordpress-posts-') && f.endsWith('.csv'));
if (csvFiles.length === 0) {
	console.error('❌ No WordPress CSV files found in docs/audit/');
	process.exit(1);
}

const latestCsv = csvFiles.sort().pop();
const csvPath = path.join(auditDir, latestCsv);

console.log('🔍 WORDPRESS TO ASTRO COVERAGE ANALYSIS');
console.log('========================================');
console.log(`WordPress Data: ${csvPath}`);
console.log(`Generated: ${new Date().toISOString()}`);
console.log();

// Parse WordPress CSV data
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.trim().split('\n');
const _headers = lines[0].split(',');

console.log(`📊 WordPress Content Summary:`);
console.log(`   Total entries: ${lines.length - 1}`);

// Process WordPress data
const wordpressPages = [];
const wordpressPosts = [];

for (let i = 1; i < lines.length; i++) {
	const line = lines[i];

	// Handle CSV parsing with potential commas in titles - try quoted and unquoted formats
	let matches = line.match(/^(\d+),"([^"]+)",([^,]+),([^,]+),"([^"]+)"/);

	if (!matches) {
		// Try parsing without quotes around title (for single-word titles)
		matches = line.match(/^(\d+),([^,]+),([^,]+),([^,]+),"([^"]+)"/);
	}

	if (!matches) {
		console.warn(`⚠️  Skipping malformed line: ${line}`);
		continue;
	}

	const [, id, title, slug, type, date] = matches;

	const item = {
		id: parseInt(id),
		title: title.replace('""', '"'), // Handle escaped quotes
		slug,
		type,
		date: new Date(date),
	};

	if (type === 'post') {
		wordpressPosts.push(item);
	} else if (type === 'page') {
		wordpressPages.push(item);
	}
}

console.log(`   Pages: ${wordpressPages.length}`);
console.log(`   Posts: ${wordpressPosts.length}`);
console.log();

// Generate expected URLs
const wordpressUrls = new Set();

// Pages - simple slug-based URLs
wordpressPages.forEach((page) => {
	wordpressUrls.add(`/${page.slug}/`);
});

// Posts - both date-based and slug-based URLs
wordpressPosts.forEach((post) => {
	const year = post.date.getFullYear();
	const month = String(post.date.getMonth() + 1).padStart(2, '0');
	const day = String(post.date.getDate()).padStart(2, '0');

	// WordPress typically uses date-based permalinks for posts
	wordpressUrls.add(`/${year}/${month}/${day}/${post.slug}/`);
	// But also direct slug access
	wordpressUrls.add(`/${post.slug}/`);
});

console.log(`📋 WordPress URLs Generated: ${wordpressUrls.size}`);

// Get Astro URLs
console.log('🏗️  Analyzing Astro build...');

if (!fs.existsSync('dist')) {
	console.log('   Building Astro site...');
	const { execSync } = await import('child_process');
	execSync('npm run build', { stdio: 'inherit' });
}

const astroUrls = new Set();

function findHtmlFiles(dir, basePath = '') {
	const items = fs.readdirSync(dir);

	for (const item of items) {
		const fullPath = path.join(dir, item);
		const stat = fs.statSync(fullPath);

		if (stat.isDirectory()) {
			findHtmlFiles(fullPath, path.join(basePath, item));
		} else if (item === 'index.html') {
			const urlPath = '/' + basePath.replace(/\\/g, '/').replace(/\/$/, '') + '/';
			astroUrls.add(urlPath === '//' ? '/' : urlPath);
		}
	}
}

findHtmlFiles('dist');
console.log(`   Astro URLs found: ${astroUrls.size}`);
console.log();

// Compare URLs
const wordpressUrlsArray = Array.from(wordpressUrls).sort();
const astroUrlsArray = Array.from(astroUrls).sort();

const missing = wordpressUrlsArray.filter((url) => !astroUrls.has(url));
const extra = astroUrlsArray.filter((url) => !wordpressUrls.has(url));
const matched = wordpressUrlsArray.filter((url) => astroUrls.has(url));

console.log('📊 COVERAGE ANALYSIS');
console.log('===================');
console.log(`WordPress URLs: ${wordpressUrlsArray.length}`);
console.log(`Astro URLs: ${astroUrlsArray.length}`);
console.log(`Missing in Astro: ${missing.length}`);
console.log(`Extra in Astro: ${extra.length}`);
console.log(`Matched: ${matched.length}`);
console.log(`Coverage: ${((matched.length / wordpressUrlsArray.length) * 100).toFixed(1)}%`);
console.log();

// Detailed analysis
if (missing.length > 0) {
	console.log(`❌ MISSING IN ASTRO (${missing.length}):`);
	missing.slice(0, 20).forEach((url) => console.log(`   ${url}`));
	if (missing.length > 20) {
		console.log(`   ... and ${missing.length - 20} more`);
	}
	console.log();
}

if (extra.length > 0) {
	console.log(`➕ EXTRA IN ASTRO (${extra.length}):`);
	extra.slice(0, 10).forEach((url) => console.log(`   ${url}`));
	if (extra.length > 10) {
		console.log(`   ... and ${extra.length - 10} more`);
	}
	console.log();
}

// Save detailed report
const reportPath = `docs/audit/coverage-analysis-${TIMESTAMP}.md`;
const report = `# WordPress to Astro Migration Coverage Analysis

**Generated**: ${new Date().toISOString()}  
**WordPress Source**: ${csvPath}  
**WordPress Content**: ${wordpressPages.length} pages, ${wordpressPosts.length} posts  

## Summary

| Metric | Count | Percentage |
|--------|-------|------------|
| WordPress URLs | ${wordpressUrlsArray.length} | 100% |
| Astro URLs | ${astroUrlsArray.length} | ${((astroUrlsArray.length / wordpressUrlsArray.length) * 100).toFixed(1)}% |
| Missing in Astro | ${missing.length} | ${((missing.length / wordpressUrlsArray.length) * 100).toFixed(1)}% |
| Successfully Matched | ${matched.length} | ${((matched.length / wordpressUrlsArray.length) * 100).toFixed(1)}% |

## Missing in Astro (WordPress → Astro gaps)

${missing.map((url) => `- \`${url}\``).join('\n')}

## Extra in Astro (not in WordPress)

${extra
	.slice(0, 20)
	.map((url) => `- \`${url}\``)
	.join('\n')}
${extra.length > 20 ? `\n_... and ${extra.length - 20} more_` : ''}

## Successfully Matched URLs

${matched
	.slice(0, 30)
	.map((url) => `- \`${url}\``)
	.join('\n')}
${matched.length > 30 ? `\n_... and ${matched.length - 30} more_` : ''}

---

## Action Items

### High Priority (Missing Pages)
${missing
	.slice(0, 10)
	.map((url) => `- [ ] Add redirect for \`${url}\``)
	.join('\n')}

### Medium Priority
- [ ] Review extra Astro URLs for accuracy
- [ ] Validate matched URLs work correctly  
- [ ] Test critical missing pages manually

### Next Steps
1. Add missing URLs to vercel.json redirects
2. Re-run analysis to verify improvements
3. Manual testing of key pages
`;

fs.writeFileSync(reportPath, report);
console.log(`📝 Detailed report saved: ${reportPath}`);

// Generate redirect suggestions
const blogMissingUrls = missing.filter((url) => {
	// Look for date-based blog URLs or content that should redirect to /blog/
	return (
		url.match(/^\/\d{4}\/\d{2}\/\d{2}\//) || wordpressPosts.some((post) => url.includes(post.slug))
	);
});

const pageMissingUrls = missing.filter((url) => !blogMissingUrls.includes(url));

if (blogMissingUrls.length > 0) {
	console.log(`📝 SUGGESTED BLOG REDIRECTS (${blogMissingUrls.length}):`);
	blogMissingUrls.slice(0, 10).forEach((url) => {
		if (url.match(/^\/\d{4}\/\d{2}\/\d{2}\/(.+)\/$/)) {
			const slug = url.match(/^\/\d{4}\/\d{2}\/\d{2}\/(.+)\/$/)[1];
			console.log(`   "${url}" → "/blog/${slug}/"`);
		} else {
			console.log(`   "${url}" → "/blog${url}"`);
		}
	});
	console.log();
}

if (pageMissingUrls.length > 0) {
	console.log(`📝 SUGGESTED PAGE REDIRECTS (${pageMissingUrls.length}):`);
	pageMissingUrls.slice(0, 10).forEach((url) => {
		console.log(`   "${url}" → "/pages${url}" or appropriate destination`);
	});
	console.log();
}

console.log('✅ Analysis complete!');

if (missing.length === 0) {
	console.log('🎉 PERFECT COVERAGE! All WordPress URLs are covered.');
	process.exit(0);
} else {
	console.log(`⚠️  ${missing.length} URLs need attention for complete coverage.`);
	process.exit(1);
}
