import fs from 'node:fs';
import path from 'node:path';

const CONTENT_ROOT = path.resolve('src/content');
const TARGET_DIRS = ['blog', 'pages'];

function extractExcerpt(markdown) {
  // remove html tags, markdown links etc. naive.
  const clean = markdown
    .replace(/\!\[[^\]]*\]\([^\)]*\)/g, '') // images
    .replace(/\[[^\]]*\]\([^\)]*\)/g, '') // links
    .replace(/[#>*_`~-]/g, '') // markdown chars
    .trim();
  const firstSentence = clean.split(/\n+/).find((l) => l.trim().length > 40) || clean;
  return firstSentence.substring(0, 155).replace(/"/g, '\\"');
}

for (const dir of TARGET_DIRS) {
  const folder = path.join(CONTENT_ROOT, dir);
  if (!fs.existsSync(folder)) continue;
  const files = fs.readdirSync(folder, { recursive: true })
    .filter((f) => f.endsWith('.md'));
  files.forEach((relPath) => {
    const fullPath = path.join(folder, relPath);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const parts = raw.split('---');
    if (parts.length < 3) return; // not normal
    let [pre, fmStr, ...bodyArr] = parts;
    const body = bodyArr.join('---');
    if (/description\s*:/i.test(fmStr)) return; // already has description
    const excerpt = extractExcerpt(body);
    fmStr = fmStr.trimEnd() + `\ndescription: "${excerpt}"\n`;
    const updated = ['---', fmStr, '---', body].join('\n');
    fs.writeFileSync(fullPath, updated);
    console.log(`Added description to ${fullPath}`);
  });
} 