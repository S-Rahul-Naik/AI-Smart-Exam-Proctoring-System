import mongoose from 'mongoose';

(async () => {
  try {
    await mongoose.connect('mongodb://localhost');
    console.log('✅ Connected to MongoDB\n');

    // Delete ALL sessions
    const deleteResult = await mongoose.connection.collection('sessions').deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} sessions\n`);

    // Delete ALL test students
    const deleteStudents = await mongoose.connection.collection('students').deleteMany({
      email: { $in: ['student1@test.com', 'student2@test.com', 'student3@test.com', 'student4@test.com', 'student5@test.com'] }
    });
    console.log(`🗑️  Deleted ${deleteStudents.deletedCount} test students\n`);

    // Create exactly 5 fresh test students
    const studentConfig = [
      { email: 'student1@test.com', firstName: 'Alex', lastName: 'Johnson', usn: 'USN001', program: 'CS', year: 3 },
      { email: 'student2@test.com', firstName: 'Beth', lastName: 'Smith', usn: 'USN002', program: 'CS', year: 2 },
      { email: 'student3@test.com', firstName: 'Charlie', lastName: 'Brown', usn: 'USN003', program: 'IT', year: 3 },
      { email: 'student4@test.com', firstName: 'Diana', lastName: 'Davis', usn: 'USN004', program: 'CS', year: 1 },
      { email: 'student5@test.com', firstName: 'Eve', lastName: 'Wilson', usn: 'USN005', program: 'IT', year: 2 },
    ];

    const studentRes = await mongoose.connection.collection('students').insertMany(
      studentConfig.map(s => ({
        ...s,
        createdAt: new Date(),
        status: 'active'
      }))
    );

    const studentIds = {};
    studentConfig.forEach((config, i) => {
      studentIds[config.email] = studentRes.insertedIds[i];
    });

    console.log(`✅ Created ${studentRes.insertedIds.length} fresh test students\n`);

    // Get exam
    const exam = await mongoose.connection.collection('exams').findOne({ code: 'CS401' });
    const examId = exam ? exam._id : new mongoose.Types.ObjectId();

    // Create exactly 14 clean sessions - NO DUPLICATES
    const baseDate = new Date('2026-04-10T00:00:00Z');
    const testSessions = [
      // Apr 10 - 4 exams
      { student: studentIds['student1@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 0 * 60000), createdAt: new Date(baseDate.getTime() + 0 * 60000), riskScore: 25, riskLevel: 'low', examScore: 85, flagged: false, status: 'completed' },
      { student: studentIds['student2@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 90 * 60000), createdAt: new Date(baseDate.getTime() + 90 * 60000), riskScore: 45, riskLevel: 'medium', examScore: 72, flagged: false, status: 'completed' },
      { student: studentIds['student3@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 300 * 60000), createdAt: new Date(baseDate.getTime() + 300 * 60000), riskScore: 65, riskLevel: 'high', examScore: 60, flagged: true, status: 'flagged' },
      { student: studentIds['student4@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 345 * 60000), createdAt: new Date(baseDate.getTime() + 345 * 60000), riskScore: 30, riskLevel: 'low', examScore: 88, flagged: false, status: 'completed' },

      // Apr 12 - 5 exams (2 days * 24 * 60 = 2880 minutes later)
      { student: studentIds['student5@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + (2880 + 15) * 60000), createdAt: new Date(baseDate.getTime() + (2880 + 15) * 60000), riskScore: 35, riskLevel: 'low', examScore: 82, flagged: false, status: 'completed' },
      { student: studentIds['student1@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + (2880 + 60) * 60000), createdAt: new Date(baseDate.getTime() + (2880 + 60) * 60000), riskScore: 55, riskLevel: 'medium', examScore: 68, flagged: false, status: 'completed' },
      { student: studentIds['student2@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + (2880 + 210) * 60000), createdAt: new Date(baseDate.getTime() + (2880 + 210) * 60000), riskScore: 72, riskLevel: 'high', examScore: 55, flagged: true, status: 'flagged' },
      { student: studentIds['student3@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + (2880 + 300) * 60000), createdAt: new Date(baseDate.getTime() + (2880 + 300) * 60000), riskScore: 48, riskLevel: 'medium', examScore: 75, flagged: false, status: 'completed' },
      { student: studentIds['student4@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + (2880 + 390) * 60000), createdAt: new Date(baseDate.getTime() + (2880 + 390) * 60000), riskScore: 62, riskLevel: 'high', examScore: 65, flagged: true, status: 'flagged' },

      // Apr 14 - 3 exams (4 days * 24 * 60 = 5760 minutes later)
      { student: studentIds['student5@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + (5760 + 45) * 60000), createdAt: new Date(baseDate.getTime() + (5760 + 45) * 60000), riskScore: 28, riskLevel: 'low', examScore: 90, flagged: false, status: 'completed' },
      { student: studentIds['student1@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + (5760 + 90) * 60000), createdAt: new Date(baseDate.getTime() + (5760 + 90) * 60000), riskScore: 42, riskLevel: 'medium', examScore: 78, flagged: false, status: 'completed' },
      { student: studentIds['student2@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + (5760 + 240) * 60000), createdAt: new Date(baseDate.getTime() + (5760 + 240) * 60000), riskScore: 35, riskLevel: 'low', examScore: 85, flagged: false, status: 'completed' },

      // Apr 16 - 2 exams (6 days * 24 * 60 = 8640 minutes later)
      { student: studentIds['student3@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + (8640 + 600) * 60000), createdAt: new Date(baseDate.getTime() + (8640 + 600) * 60000), riskScore: 22, riskLevel: 'low', examScore: 92, flagged: false, status: 'completed' },
      { student: studentIds['student4@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + (8640 + 720) * 60000), createdAt: new Date(baseDate.getTime() + (8640 + 720) * 60000), riskScore: 38, riskLevel: 'low', examScore: 80, flagged: false, status: 'completed' },
    ];

    const sessionRes = await mongoose.connection.collection('sessions').insertMany(testSessions);
    console.log(`✅ Inserted ${sessionRes.insertedIds.length} CLEAN test sessions (no duplicates)\n`);

    // Verify
    const remaining = await mongoose.connection.collection('sessions')
      .find({})
      .sort({ createdAt: 1 })
      .toArray();

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

    console.log(`\n✅ Total: ${remaining.length} sessions`);
    console.log('\n🔄 Refresh http://localhost:3000/admin/analytics!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
})();
