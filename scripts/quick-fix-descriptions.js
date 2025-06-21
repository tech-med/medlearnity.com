#!/usr/bin/env node
// scripts/quick-fix-descriptions.js
// Auto-append a period to truncated description lines in markdown front-matter

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, relative } from 'path';

const TARGET_DIRS = ['src/content/blog', 'src/content/wpPages'];

const DESCRIPTION_REGEX = /^(description:\s*['"])(.*?)(['"])$/m;

let filesProcessed = 0;
let filesFixed = 0;

async function fixFile(filePath) {
  const raw = await readFile(filePath, 'utf8');
  const match = raw.match(DESCRIPTION_REGEX);
  if (!match) return;

  const [, prefix, body, quote] = match;
  if (body.trim().length === 0) return;
  const lastChar = body.trim().slice(-1);
  if (/[.!?]/.test(lastChar)) return; // already ends properly

  const fixedBody = body.trim() + '.'; // append period
  const fixed = raw.replace(DESCRIPTION_REGEX, `${prefix}${fixedBody}${quote}`);
  if (fixed !== raw) {
    await writeFile(filePath, fixed, 'utf8');
    filesFixed++;
  }
  filesProcessed++;
}

async function walk(dir) {
  const items = await readdir(dir, { withFileTypes: true });
  for (const it of items) {
    const p = join(dir, it.name);
    if (it.isDirectory()) await walk(p);
    else if (it.isFile() && (p.endsWith('.md') || p.endsWith('.mdx'))) await fixFile(p);
  }
}

(async function main() {
  for (const dir of TARGET_DIRS) await walk(dir);
  console.log(`✅ quick-fix complete — processed ${filesProcessed} files, fixed ${filesFixed}`);
})(); 