import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  student: String,
  exam: mongoose.Schema.Types.ObjectId,
  date: Date,
  riskScore: Number,
  riskLevel: String,
  examScore: Number,
  flagged: Boolean,
});

const Session = mongoose.model('Session', SessionSchema);

(async () => {
  try {
    await mongoose.connect('mongodb://localhost');
    console.log('✅ Connected to MongoDB\n');

    // Check if test data already exists
    const existingCount = await Session.countDocuments({
      student: { $in: ['student1@test.com', 'student2@test.com', 'student3@test.com', 'student4@test.com', 'student5@test.com'] }
    });

    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} test records already exist. Deleting...`);
      await Session.deleteMany({
        student: { $in: ['student1@test.com', 'student2@test.com', 'student3@test.com', 'student4@test.com', 'student5@test.com'] }
      });
      console.log('✅ Deleted existing test records\n');
    }

    // Use existing exam ID from CS401
    const existingExam = await mongoose.connection.collection('exams').findOne({ code: 'CS401' });
    const examId = existingExam ? existingExam._id : new mongoose.Types.ObjectId();

    console.log(`📊 Using exam ID: ${examId}\n`);

    // Generate test session data across multiple dates
    const baseDate = new Date('2026-04-10');
    const testSessions = [
      // Apr 10 - 4 exams, mixed risk (avg: 41)
      { student: 'student1@test.com', exam: examId, startTime: new Date(baseDate.getTime() + 0), createdAt: new Date(baseDate.getTime() + 0), riskScore: 25, riskLevel: 'low', examScore: 85, flagged: false, status: 'completed' },
      { student: 'student2@test.com', exam: examId, startTime: new Date(baseDate.getTime() + 90 * 60000), createdAt: new Date(baseDate.getTime() + 90 * 60000), riskScore: 45, riskLevel: 'medium', examScore: 72, flagged: false, status: 'completed' },
      { student: 'student3@test.com', exam: examId, startTime: new Date(baseDate.getTime() + 300 * 60000), createdAt: new Date(baseDate.getTime() + 300 * 60000), riskScore: 65, riskLevel: 'high', examScore: 60, flagged: true, status: 'flagged' },
      { student: 'student4@test.com', exam: examId, startTime: new Date(baseDate.getTime() + 345 * 60000), createdAt: new Date(baseDate.getTime() + 345 * 60000), riskScore: 30, riskLevel: 'low', examScore: 88, flagged: false, status: 'completed' },

      // Apr 12 - 5 exams, higher risk trend
      { student: 'student5@test.com', exam: examId, startTime: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 15 * 60000), createdAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 15 * 60000), riskScore: 35, riskLevel: 'low', examScore: 82, flagged: false, status: 'completed' },
      { student: 'student1@test.com', exam: examId, startTime: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 60 * 60000), createdAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 60 * 60000), riskScore: 55, riskLevel: 'medium', examScore: 68, flagged: false, status: 'completed' },
      { student: 'student2@test.com', exam: examId, startTime: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 210 * 60000), createdAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 210 * 60000), riskScore: 72, riskLevel: 'high', examScore: 55, flagged: true, status: 'flagged' },
      { student: 'student3@test.com', exam: examId, startTime: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 300 * 60000), createdAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 300 * 60000), riskScore: 48, riskLevel: 'medium', examScore: 75, flagged: false, status: 'completed' },
      { student: 'student4@test.com', exam: examId, startTime: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 390 * 60000), createdAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 390 * 60000), riskScore: 62, riskLevel: 'high', examScore: 65, flagged: true, status: 'flagged' },

      // Apr 14 - 3 exams, risk decreasing
      { student: 'student5@test.com', exam: examId, startTime: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 45 * 60000), createdAt: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 45 * 60000), riskScore: 28, riskLevel: 'low', examScore: 90, flagged: false, status: 'completed' },
      { student: 'student1@test.com', exam: examId, startTime: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 90 * 60000), createdAt: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 90 * 60000), riskScore: 42, riskLevel: 'medium', examScore: 78, flagged: false, status: 'completed' },
      { student: 'student2@test.com', exam: examId, startTime: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 240 * 60000), createdAt: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 240 * 60000), riskScore: 35, riskLevel: 'low', examScore: 85, flagged: false, status: 'completed' },

      // Apr 16 - 2 exams (today), low risk
      { student: 'student3@test.com', exam: examId, startTime: new Date('2026-04-16T10:00:00Z'), createdAt: new Date('2026-04-16T10:00:00Z'), riskScore: 22, riskLevel: 'low', examScore: 92, flagged: false, status: 'completed' },
      { student: 'student4@test.com', exam: examId, startTime: new Date('2026-04-16T12:00:00Z'), createdAt: new Date('2026-04-16T12:00:00Z'), riskScore: 38, riskLevel: 'low', examScore: 80, flagged: false, status: 'completed' },
    ];

    await Session.insertMany(testSessions);
    console.log(`✅ Inserted ${testSessions.length} test exam sessions\n`);
    console.log('📊 Test Data Summary:');
    console.log('   Apr 10: 4 exams, avg risk ~41 → cumulative exams: 4');
    console.log('   Apr 12: 5 exams, avg risk ~55 → cumulative exams: 9');
    console.log('   Apr 14: 3 exams, avg risk ~35 → cumulative exams: 12');
    console.log('   Apr 16: 2 exams, avg risk ~30 → cumulative exams: 14');
    console.log('\n✅ Refresh http://localhost:3000/admin/analytics to see the populated chart!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
})();
