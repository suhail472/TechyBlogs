import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startLocalMongo() {
  console.log('Starting local embedded MongoDB Server...');
  try {
    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'teachyblogs',
      },
      spawn: {
        timeout: 60000,
      },
    });

    const uri = mongod.getUri();
    console.log(`\n🚀 Local Embedded MongoDB is running at: ${uri}`);
    console.log('You can now run:');
    console.log('  node scripts/seed-blogs.js');
    console.log('  npm run dev\n');

    // Keep process alive
    process.on('SIGINT', async () => {
      console.log('Stopping local MongoDB...');
      await mongod.stop();
      process.exit(0);
    });
  } catch (err) {
    console.error('Failed to start embedded MongoDB:', err.message);
  }
}

startLocalMongo();
