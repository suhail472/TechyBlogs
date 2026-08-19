import fs from 'fs';
if (fs.existsSync('.env.local')) {
  const env = fs.readFileSync('.env.local', 'utf-8');
  for (const line of env.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
}

import connectToDatabase from '../src/lib/db.js';
import Post from '../src/lib/models/post.model.js';

async function main() {
  await connectToDatabase();
  const posts = await Post.find({}).select('title slug status likes').lean();
  console.log(`Found ${posts.length} posts:`);
  for (const p of posts) {
    console.log(`- Slug: "${p.slug}", Title: "${p.title}", Status: "${p.status}", Likes: ${p.likes}`);
  }
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
