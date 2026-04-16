import mongoose from 'mongoose';

(async () => {
  try {
    await mongoose.connect('mongodb://localhost');
    console.log('✅ Connected to MongoDB\n');

    // Get all sessions with status filter (what getResultSessions does)
    const sessions = await mongoose.connection.collection('sessions')
      .find({ status: { $in: ['submitted', 'completed', 'flagged', 'terminated'] } })
      .toArray();

    console.log(`Found ${sessions.length} sessions with valid status\n`);
    console.log('Sessions:');
    sessions.forEach((s, i) => {
      console.log(`${i + 1}. createdAt: ${s.createdAt}, riskScore: ${s.riskScore}, status: ${s.status}`);
    });

    // Check dates
    const dates = sessions.map(s => s.createdAt).sort((a, b) => a - b);
    console.log(`\nDate range: ${dates[0]} to ${dates[dates.length - 1]}`);
    
    console.log('\nSessions by date:');
    const byDate = {};
    sessions.forEach(s => {
      const dateStr = s.createdAt.toISOString().split('T')[0];
      byDate[dateStr] = (byDate[dateStr] || 0) + 1;
    });
    Object.entries(byDate).sort().forEach(([date, count]) => {
      console.log(`  ${date}: ${count} sessions`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
})();
