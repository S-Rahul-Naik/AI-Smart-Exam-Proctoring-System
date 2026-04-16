import mongoose from 'mongoose';

(async () => {
  try {
    await mongoose.connect('mongodb://localhost');
    console.log('✅ Connected to MongoDB\n');

    const sessions = await mongoose.connection.collection('sessions').find({}).limit(5).toArray();
    console.log('First 5 sessions:\n');
    sessions.forEach((s, i) => {
      console.log(`Session ${i + 1}:`);
      console.log(`  _id: ${s._id}`);
      console.log(`  student: ${s.student}`);
      console.log(`  exam: ${s.exam}`);
      console.log(`  startTime: ${s.startTime}`);
      console.log(`  createdAt: ${s.createdAt}`);
      console.log(`  riskScore: ${s.riskScore}`);
      console.log(`  status: ${s.status}`);
      console.log();
    });

    const count = await mongoose.connection.collection('sessions').countDocuments({});
    console.log(`Total sessions: ${count}`);

    const statusCounts = await mongoose.connection.collection('sessions').aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    console.log('\nSessions by status:');
    statusCounts.forEach(s => {
      console.log(`  ${s._id}: ${s.count}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
})();
