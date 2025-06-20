import fs from 'node:fs';
import path from 'node:path';

const CONTENT_ROOT = path.resolve('src/content');
const TARGET_DIRS = ['blog', 'pages'];

function extractExcerpt(content) {
  // Remove markdown formatting for a clean excerpt
  let text = content
    .replace(/#+\s/g, '') // headers
    .replace(/[*_`]/g, '') // emphasis
    .replace(/!\[.*?\]\(.*?\)/g, '') // images
    .replace(/\[.*?\]\(.*?\)/g, '') // links
    .replace(/\n/g, ' ')
    .trim();
  const firstSentence = text.split(/\n+/).find((l) => l.trim().length > 40) || text;
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
    const yamlEndMatch = raw.match(/^---$/m);
    if (!yamlEndMatch) return;

    const parts = raw.split(/^---$/m);
    let [, fmStr, ...bodyArr] = parts;
    const bodyContent = bodyArr.join('---');
    if (/description\s*:/i.test(fmStr)) return; // already has description
    const excerpt = extractExcerpt(bodyContent);
    fmStr = fmStr.trimEnd() + `\ndescription: "${excerpt}"\n`;
    const updated = ['---', fmStr, '---', bodyContent].join('\n');
    fs.writeFileSync(fullPath, updated);
    console.log(`Added description to ${fullPath}`);
  });
} 