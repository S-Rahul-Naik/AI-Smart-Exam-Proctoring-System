import mongoose from 'mongoose';

(async () => {
  try {
    await mongoose.connect('mongodb://localhost');
    console.log('✅ Connected to MongoDB\n');

    // Get all sessions
    const allSessions = await mongoose.connection.collection('sessions')
      .find({})
      .toArray();

    console.log(`Total sessions before cleanup: ${allSessions.length}`);

    // Find duplicates - keep only first occurrence of each student+date combo
    const seen = new Set();
    const toDelete = [];

    allSessions.forEach(s => {
      const key = `${s.student}_${s.createdAt.toISOString().split('T')[0]}`;
      if (seen.has(key)) {
        toDelete.push(s._id);
      } else {
        seen.add(key);
      }
    });

    if (toDelete.length > 0) {
      const result = await mongoose.connection.collection('sessions').deleteMany({
        _id: { $in: toDelete }
      });
      console.log(`🗑️  Deleted ${result.deletedCount} duplicate sessions`);
    }

    // Show remaining sessions
    const remaining = await mongoose.connection.collection('sessions')
      .find({ status: { $in: ['submitted', 'completed', 'flagged', 'terminated'] } })
      .sort({ createdAt: 1 })
      .toArray();

    console.log(`\nRemaining sessions: ${remaining.length}\n`);
    
    console.log('Sessions by date:');
    const byDate = {};
    remaining.forEach(s => {
      const dateStr = s.createdAt.toISOString().split('T')[0];
      if (!byDate[dateStr]) byDate[dateStr] = [];
      byDate[dateStr].push(s.riskScore);
    });

    Object.entries(byDate).sort().forEach(([date, scores]) => {
      const avg = Math.round(scores.reduce((a,b) => a+b, 0) / scores.length);
      console.log(`  ${date}: ${scores.length} exams, avg risk ${avg}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
})();
