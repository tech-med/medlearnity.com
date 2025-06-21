#!/usr/bin/env node
/**
 * Crawl www.medlearnity.com and validate all internal pages are present in Astro site
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const WORDPRESS_SITE = 'https://www.medlearnity.com';
const MAX_PAGES = 500; // Limit to prevent infinite crawling
const EXCLUDED_EXTENSIONS = ['.pdf', '.jpg', '.png', '.gif', '.svg', '.ico', '.css', '.js', '.xml', '.txt'];
const EXCLUDED_PATHS = ['/wp-admin', '/wp-content', '/wp-includes', '/feed', '/author', '/tag', '/category', '/page/', '/wp-json'];

class SiteCrawler {
  constructor() {
    this.discoveredPages = new Set();
    this.crawledPages = new Set();
    this.astroPages = new Set();
    this.redirects = new Map();
    this.errors = [];
    
    this.loadAstroPages();
    this.loadRedirects();
  }

  // Load all pages built by Astro
  loadAstroPages() {
    console.log('📁 Loading Astro built pages...');
    
    if (!fs.existsSync('dist')) {
      console.log('⚠️  dist/ folder not found. Running build...');
      execSync('npm run build', { stdio: 'inherit' });
    }

    const findHtmlFiles = (dir, basePath = '') => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          findHtmlFiles(fullPath, path.join(basePath, item));
        } else if (item === 'index.html') {
          const urlPath = '/' + basePath.replace(/\\/g, '/').replace(/\/$/, '') + '/';
          this.astroPages.add(urlPath === '//' ? '/' : urlPath);
        }
      }
    };

    findHtmlFiles('dist');
    console.log(`   Found ${this.astroPages.size} Astro pages`);
  }

  // Load redirect mappings from vercel.json
  loadRedirects() {
    console.log('🔄 Loading redirect mappings...');
    
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    const redirects = vercelConfig.redirects || [];
    
    redirects.forEach(redirect => {
      if (redirect.permanent && !redirect.source.includes(':')) {
        this.redirects.set(redirect.source, redirect.destination);
      }
    });
    
    console.log(`   Found ${this.redirects.size} explicit redirects`);
  }

  // Check if a URL should be excluded from crawling
  shouldExclude(url) {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Skip non-HTML files
    if (EXCLUDED_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
      return true;
    }
    
    // Skip admin and system paths
    if (EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
      return true;
    }
    
    // Skip query parameters and fragments
    if (urlObj.search || urlObj.hash) {
      return true;
    }
    
    return false;
  }

  // Extract internal links from HTML content
  extractLinks(html, baseUrl) {
    const links = new Set();
    
    // Simple regex to find href attributes
    const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
    let match;
    
    while ((match = hrefRegex.exec(html)) !== null) {
      try {
        const href = match[1];
        
        // Skip external links, fragments, and email/tel links
        if (href.startsWith('http') && !href.startsWith(WORDPRESS_SITE)) continue;
        if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
        
        // Convert relative URLs to absolute
        const absoluteUrl = new URL(href, baseUrl).href;
        
        if (absoluteUrl.startsWith(WORDPRESS_SITE) && !this.shouldExclude(absoluteUrl)) {
          links.add(absoluteUrl);
        }
      } catch (error) {
        // Skip malformed URLs
      }
    }
    
    return links;
  }

  // Fetch and crawl a single page
  async crawlPage(url) {
    if (this.crawledPages.has(url) || this.crawledPages.size >= MAX_PAGES) {
      return;
    }
    
    this.crawledPages.add(url);
    console.log(`🕷️  Crawling: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MedLearnity-Migration-Validator/1.0)'
        },
        timeout: 10000
      });
      
      if (!response.ok) {
        this.errors.push(`${url} - HTTP ${response.status}`);
        return;
      }
      
      const html = await response.text();
      const newLinks = this.extractLinks(html, url);
      
      // Add new links to discovery queue
      newLinks.forEach(link => {
        if (!this.crawledPages.has(link)) {
          this.discoveredPages.add(link);
        }
      });
      
    } catch (error) {
      this.errors.push(`${url} - ${error.message}`);
    }
  }

  // Main crawling function
  async crawlSite() {
    console.log(`🚀 Starting crawl of ${WORDPRESS_SITE}...`);
    console.log(`   Max pages: ${MAX_PAGES}`);
    
    // Start with homepage
    this.discoveredPages.add(WORDPRESS_SITE);
    
    while (this.discoveredPages.size > 0 && this.crawledPages.size < MAX_PAGES) {
      const url = this.discoveredPages.values().next().value;
      this.discoveredPages.delete(url);
      
      await this.crawlPage(url);
      
      // Add small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✅ Crawl complete: ${this.crawledPages.size} pages discovered`);
  }

  // Check if a WordPress URL is covered in Astro site
  checkCoverage(wpUrl) {
    const urlObj = new URL(wpUrl);
    const pathname = urlObj.pathname;
    
    // Direct match in Astro pages
    if (this.astroPages.has(pathname)) {
      return { covered: true, method: 'direct', target: pathname };
    }
    
    // Check redirects
    if (this.redirects.has(pathname)) {
      const redirectTarget = this.redirects.get(pathname);
      if (this.astroPages.has(redirectTarget)) {
        return { covered: true, method: 'redirect', target: redirectTarget };
      } else {
        return { covered: false, method: 'redirect-missing', target: redirectTarget };
      }
    }
    
    // Check if it matches a dynamic redirect pattern
    const dynamicPatterns = [
      { pattern: /^\/(\d{4})\/(\d{2})\/(\d{2})\/([^\/]+)\/$/, target: '/blog/$4/' },
      { pattern: /^\/(\d{4})\/(\d{2})\/([^\/]+)\/$/, target: '/blog/$3/' },
      { pattern: /^\/(\d{4})\/([^\/]+)\/$/, target: '/blog/$2/' },
      { pattern: /^\/category\/[^\/]+\/?$/, target: '/blog/' },
      { pattern: /^\/tag\/[^\/]+\/?$/, target: '/blog/' },
      { pattern: /^\/author\/[^\/]+\/?$/, target: '/blog/' }
    ];
    
    for (const { pattern, target } of dynamicPatterns) {
      const match = pathname.match(pattern);
      if (match) {
        let resolvedTarget = target;
        for (let i = 1; i < match.length; i++) {
          resolvedTarget = resolvedTarget.replace(`$${i}`, match[i]);
        }
        
        if (this.astroPages.has(resolvedTarget)) {
          return { covered: true, method: 'dynamic-redirect', target: resolvedTarget };
        }
      }
    }
    
    return { covered: false, method: 'missing', target: null };
  }

  // Generate coverage report
  generateReport() {
    console.log('\n📊 COVERAGE ANALYSIS');
    console.log('='.repeat(50));
    
    const wordpressUrls = Array.from(this.crawledPages);
    const coverage = {
      total: wordpressUrls.length,
      covered: 0,
      missing: [],
      methods: { direct: 0, redirect: 0, 'dynamic-redirect': 0, missing: 0 }
    };
    
    wordpressUrls.forEach(url => {
      const result = this.checkCoverage(url);
      coverage.methods[result.method]++;
      
      if (result.covered) {
        coverage.covered++;
      } else {
        coverage.missing.push({ url, reason: result.method, target: result.target });
      }
    });
    
    // Summary
    console.log(`📈 COVERAGE SUMMARY:`);
    console.log(`   Total WordPress pages: ${coverage.total}`);
    console.log(`   Covered pages: ${coverage.covered} (${((coverage.covered / coverage.total) * 100).toFixed(1)}%)`);
    console.log(`   Missing pages: ${coverage.missing.length}`);
    console.log();
    
    console.log(`📋 COVERAGE METHODS:`);
    console.log(`   Direct matches: ${coverage.methods.direct}`);
    console.log(`   Explicit redirects: ${coverage.methods.redirect}`);
    console.log(`   Dynamic redirects: ${coverage.methods['dynamic-redirect']}`);
    console.log(`   Missing: ${coverage.methods.missing}`);
    console.log();
    
    if (coverage.missing.length > 0) {
      console.log(`❌ MISSING PAGES (${coverage.missing.length}):`);
      coverage.missing.slice(0, 20).forEach(({ url, reason, target }) => {
        console.log(`   ${url} (${reason}${target ? ` -> ${target}` : ''})`);
      });
      
      if (coverage.missing.length > 20) {
        console.log(`   ... and ${coverage.missing.length - 20} more`);
      }
    }
    
    if (this.errors.length > 0) {
      console.log(`\n⚠️  CRAWL ERRORS (${this.errors.length}):`);
      this.errors.slice(0, 10).forEach(error => {
        console.log(`   ${error}`);
      });
      
      if (this.errors.length > 10) {
        console.log(`   ... and ${this.errors.length - 10} more`);
      }
    }
    
    return coverage;
  }
}

// Main execution
async function main() {
  console.log('🔍 WORDPRESS TO ASTRO MIGRATION VALIDATOR');
  console.log('='.repeat(50));
  
  const crawler = new SiteCrawler();
  
  try {
    await crawler.crawlSite();
    const coverage = crawler.generateReport();
    
    if (coverage.missing.length === 0) {
      console.log('\n🎉 PERFECT COVERAGE! All WordPress pages are covered in Astro migration.');
      process.exit(0);
    } else {
      console.log(`\n⚠️  ${coverage.missing.length} pages need attention.`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Crawler failed:', error.message);
    process.exit(1);
  }
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
} 