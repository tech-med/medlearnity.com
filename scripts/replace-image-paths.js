import fs from 'node:fs';
import path from 'node:path';

const CONTENT_DIR = path.resolve('src/content');
const HOST = 'https://i2xfwztd2ksbegse.public.blob.vercel-storage.com';

function processFile(file) {
	const data = fs.readFileSync(file, 'utf8');
	let replaced = data.replace(/\(\/images\/wp\//g, `(${HOST}/wp/`);
	replaced = replaced.replace(/https:\/\/www\.medlearnity\.com\/\/images\/wp\//g, `${HOST}/wp/`);
	if (replaced !== data) {
		fs.writeFileSync(file, replaced);
		console.log('updated', file);
	}
}

function walk(dir) {
	for (const item of fs.readdirSync(dir)) {
		const full = path.join(dir, item);
		const stat = fs.statSync(full);
		if (stat.isDirectory()) walk(full);
		else if (full.endsWith('.md') || full.endsWith('.mdx')) processFile(full);
	}
}

walk(CONTENT_DIR);
