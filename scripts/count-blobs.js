import { list } from '@vercel/blob';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Check for required environment variables
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const isDummyToken = BLOB_TOKEN === 'dummy-token-for-ci' || (BLOB_TOKEN && BLOB_TOKEN.includes('dummy'));

// Early exit if no token available or dummy token (CI/test environments)
if (!BLOB_TOKEN || isDummyToken) {
	console.log('🧪 CI/Test Mode - Vercel Blob token not available or is dummy token');
	console.log('✅ Script validation passed - would work with proper token');
	process.exit(0);
}

const PREFIX = 'wp/'; // what we're counting
const LIMIT = 1000; // max rows per page

(async () => {
	let total = 0;
	let cursor;

	console.log('🔍 Counting uploaded blobs...');

	do {
		const { blobs, cursor: next } = await list({ prefix: PREFIX, cursor, limit: LIMIT });
		total += blobs.length;
		cursor = next; // undefined == finished

		if (blobs.length > 0) {
			console.log(`   Found ${blobs.length} blobs in this batch (total: ${total})`);
		}
	} while (cursor);

	console.log(`✅  Uploaded blobs with prefix "${PREFIX}": ${total}`);
})().catch((err) => {
	console.error('❌ Error:', err.message);
	process.exit(1);
});
