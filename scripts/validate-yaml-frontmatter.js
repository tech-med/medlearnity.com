#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
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

function validateYaml(yamlContent, filePath) {
  try {
    const parsed = yaml.load(yamlContent);
    return { parsed, error: null };
  } catch (error) {
    return { 
      parsed: null, 
      error: {
        message: error.message,
        line: error.mark ? error.mark.line + 1 : 'unknown'
      }
    };
  }
}

function validateRequiredFields(parsed, filePath) {
  const errors = [];
  const requiredFields = ['title', 'pubDate'];
  
  requiredFields.forEach(field => {
    if (!parsed[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Validate date fields
  if (parsed.pubDate) {
    const date = new Date(parsed.pubDate);
    if (isNaN(date.getTime())) {
      errors.push(`Invalid pubDate format: ${parsed.pubDate}`);
    }
  }
  
  if (parsed.updatedDate) {
    const date = new Date(parsed.updatedDate);
    if (isNaN(date.getTime())) {
      errors.push(`Invalid updatedDate format: ${parsed.updatedDate}`);
    }
  }
  
  return errors;
}

function scanDirectory(dir) {
  const results = {
    totalFiles: 0,
    validFiles: 0,
    invalidFiles: 0,
    errors: []
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
          type: 'extraction'
        });
        return;
      }
      
      const { parsed, error: yamlError } = validateYaml(frontmatter, filePath);
      
      if (yamlError) {
        results.invalidFiles++;
        results.errors.push({
          file: relativePath,
          error: `YAML parsing error at line ${yamlError.line}: ${yamlError.message}`,
          type: 'yaml'
        });
        return;
      }
      
      const schemaErrors = validateRequiredFields(parsed, filePath);
      if (schemaErrors.length > 0) {
        results.invalidFiles++;
        results.errors.push({
          file: relativePath,
          error: schemaErrors.join(', '),
          type: 'schema'
        });
        return;
      }
      
      results.validFiles++;
      
    } catch (error) {
      results.invalidFiles++;
      results.errors.push({
        file: relativePath,
        error: `File reading error: ${error.message}`,
        type: 'file'
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
    path.join(process.cwd(), 'src/content/blog')
  ];
  
  let totalResults = {
    totalFiles: 0,
    validFiles: 0,
    invalidFiles: 0,
    errors: []
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
    
    log(`   Found ${results.totalFiles} files, ${results.validFiles} valid, ${results.invalidFiles} invalid`, 'magenta');
  }
  
  console.log();
  log('📊 VALIDATION SUMMARY', 'bold');
  log('=' .repeat(50), 'blue');
  log(`Total Files Scanned: ${totalResults.totalFiles}`, 'cyan');
  log(`✅ Valid Files: ${totalResults.validFiles}`, 'green');
  log(`❌ Invalid Files: ${totalResults.invalidFiles}`, 'red');
  
  if (totalResults.errors.length > 0) {
    console.log();
    log('🚨 ERRORS FOUND:', 'red');
    log('=' .repeat(50), 'red');
    
    // Group errors by type
    const errorsByType = {
      yaml: [],
      schema: [],
      extraction: [],
      file: []
    };
    
    totalResults.errors.forEach(error => {
      errorsByType[error.type].push(error);
    });
    
    // Display errors by type
    Object.entries(errorsByType).forEach(([type, errors]) => {
      if (errors.length === 0) return;
      
      console.log();
      log(`${type.toUpperCase()} ERRORS (${errors.length}):`, 'yellow');
      errors.forEach(error => {
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