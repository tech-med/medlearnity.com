import { list } from '@vercel/blob';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const PREFIX = 'wp/';              // what we're counting
const LIMIT  = 1000;               // max rows per page

(async () => {
  let total = 0;
  let cursor;

  console.log('🔍 Counting uploaded blobs...');
  
  do {
    const { blobs, cursor: next } = await list({ prefix: PREFIX, cursor, limit: LIMIT });
    total  += blobs.length;
    cursor = next;                 // undefined == finished
    
    if (blobs.length > 0) {
      console.log(`   Found ${blobs.length} blobs in this batch (total: ${total})`);
    }
  } while (cursor);

  console.log(`✅  Uploaded blobs with prefix "${PREFIX}": ${total}`);
})().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
}); 