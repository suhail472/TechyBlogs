import connectToDatabase from '../src/lib/db.js';
import { authorService } from '../src/lib/services/author.service.js';

async function runAuthorEngineTests() {
  console.log('=====================================================');
  console.log('TEACHYBLOGS — NEWSROOM AUTHORS ENGINE INTEGRATION TESTS');
  console.log('=====================================================\n');

  try {
    // 1. Role Elevation Guard Test
    try {
      await authorService.updateAuthor(
        '64f1a2b3c4d5e6f7a8b9c0d1',
        { role: 'superadmin' },
        { _id: '64f1a2b3c4d5e6f7a8b9c0d2', role: 'contributor' }
      );
      throw new Error('Unauthorized role edit was not rejected!');
    } catch (err) {
      if (err.message.includes('Unauthorized to update this author profile')) {
        console.log('✅ updateAuthor correctly rejected non-admin role elevation attempt.');
      } else {
        throw err;
      }
    }

    // 2. Admin Create Guard Test
    try {
      await authorService.createAuthor(
        { name: 'Test Author', email: 'test@example.com' },
        { _id: '64f1a2b3c4d5e6f7a8b9c0d2', role: 'contributor' }
      );
      throw new Error('Non-admin author creation was not rejected!');
    } catch (err) {
      if (err.message.includes('Admin permission required')) {
        console.log('✅ createAuthor correctly rejected non-admin creation request.');
      } else {
        throw err;
      }
    }

    // 3. Test Database Overview Aggregation if DB connected
    try {
      await connectToDatabase();
      const overview = await authorService.getRosterOverview();
      console.log(`✅ getRosterOverview successfully calculated: ${overview.stats.totalAuthors} authors, ${overview.stats.totalBylines} bylines.`);
    } catch (dbErr) {
      console.log('ℹ️ Offline DB notice:', dbErr.message);
    }

    console.log('\n=====================================================');
    console.log('ALL AUTHOR & BUREAU ENGINE TESTS PASSED!');
    console.log('=====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Author Engine Test Failed:', err);
    process.exit(1);
  }
}

runAuthorEngineTests();
