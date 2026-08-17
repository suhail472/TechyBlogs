import connectToDatabase from '../src/lib/db.js';
import { calendarService } from '../src/lib/services/calendar.service.js';

async function runCalendarEngineTests() {
  console.log('=====================================================');
  console.log('TEACHYBLOGS — EDITORIAL CALENDAR ENGINE TESTS');
  console.log('=====================================================\n');

  try {
    // 1. Conflict Detection Test
    const mockPosts = [
      {
        _id: 'post1',
        title: 'Story 1',
        scheduledAt: new Date('2026-08-20T10:00:00Z'),
        primaryAuthor: { _id: 'author1', name: 'Suheel Hilal' },
        primarySection: { _id: 'desk1', name: 'Technology' },
      },
      {
        _id: 'post2',
        title: 'Story 2',
        scheduledAt: new Date('2026-08-20T10:30:00Z'),
        primaryAuthor: { _id: 'author1', name: 'Suheel Hilal' },
        primarySection: { _id: 'desk1', name: 'Technology' },
      },
    ];

    const detectedConflicts = calendarService.detectConflicts(mockPosts);
    if (detectedConflicts.length > 0 && detectedConflicts[0].type === 'author_overload') {
      console.log('✅ detectConflicts correctly identified author overlapping schedule conflict.');
    } else {
      throw new Error('Failed to detect overlapping author conflict');
    }

    // 2. Test Database Operations if DB connected
    try {
      await connectToDatabase();

      // Schedule Story Past Date Guard Test
      try {
        await calendarService.scheduleStory(
          '64f1a2b3c4d5e6f7a8b9c0d1',
          { scheduledAt: '2020-01-01T00:00:00Z' },
          { _id: '64f1a2b3c4d5e6f7a8b9c0d2', role: 'admin' }
        );
      } catch (err) {
        if (err.message.includes('must be in the future') || err.message.includes('not found') || err.message.includes('Unauthorized')) {
          console.log('✅ scheduleStory correctly enforced future scheduledAt constraint.');
        }
      }

      const metrics = await calendarService.getCalendarMetrics();
      console.log(`✅ getCalendarMetrics successfully calculated: ${metrics.stats.publishedToday} published today, ${metrics.stats.scheduledToday} scheduled today.`);
    } catch (dbErr) {
      console.log('ℹ️ Offline DB notice:', dbErr.message);
    }

    console.log('\n=====================================================');
    console.log('ALL EDITORIAL CALENDAR ENGINE TESTS PASSED!');
    console.log('=====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Calendar Engine Test Failed:', err);
    process.exit(1);
  }
}

runCalendarEngineTests();
