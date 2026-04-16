import mongoose from 'mongoose';

(async () => {
  try {
    await mongoose.connect('mongodb://localhost');
    console.log('✅ Connected to MongoDB\n');

    // Delete ALL old test sessions
    const deleteResult = await mongoose.connection.collection('sessions').deleteMany({
      $or: [
        { student: { $type: 'string' } },  // Delete string student references
        { createdAt: { $exists: false } }  // Delete sessions without createdAt
      ]
    });
    
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} malformed test sessions\n`);

    // Get/create proper test students
    const studentConfig = [
      { email: 'student1@test.com', firstName: 'Alex', lastName: 'Johnson', usn: 'USN001', program: 'CS', year: 3 },
      { email: 'student2@test.com', firstName: 'Beth', lastName: 'Smith', usn: 'USN002', program: 'CS', year: 2 },
      { email: 'student3@test.com', firstName: 'Charlie', lastName: 'Brown', usn: 'USN003', program: 'IT', year: 3 },
      { email: 'student4@test.com', firstName: 'Diana', lastName: 'Davis', usn: 'USN004', program: 'CS', year: 1 },
      { email: 'student5@test.com', firstName: 'Eve', lastName: 'Wilson', usn: 'USN005', program: 'IT', year: 2 },
    ];

    // Delete old test students (by email)
    await mongoose.connection.collection('students').deleteMany({
      email: { $in: studentConfig.map(s => s.email) }
    });
    console.log('🗑️  Deleted old test students\n');

    // Create fresh students
    const students = await mongoose.connection.collection('students').insertMany(
      studentConfig.map(s => ({
        ...s,
        createdAt: new Date(),
        status: 'active'
      }))
    );

    console.log(`✅ Created ${students.insertedIds.length} new test students`);
    console.log('Student IDs:');
    const studentIdMap = {};
    studentConfig.forEach((config, i) => {
      const id = students.insertedIds[i];
      studentIdMap[config.email] = id;
      console.log(`   ${config.email}: ${id}`);
    });

    // Get exam
    const exam = await mongoose.connection.collection('exams').findOne({ code: 'CS401' });
    const examId = exam ? exam._id : new mongoose.Types.ObjectId();
    console.log(`\n📝 Using exam ID: ${examId}`);

    // Create proper test sessions with ObjectId references and dates
    const baseDate = new Date('2026-04-10T00:00:00Z');
    const testSessions = [
      // Apr 10 - 4 exams
      { student: studentIdMap['student1@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 0), createdAt: new Date(baseDate.getTime() + 0), riskScore: 25, riskLevel: 'low', examScore: 85, flagged: false, status: 'completed' },
      { student: studentIdMap['student2@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 90 * 60000), createdAt: new Date(baseDate.getTime() + 90 * 60000), riskScore: 45, riskLevel: 'medium', examScore: 72, flagged: false, status: 'completed' },
      { student: studentIdMap['student3@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 300 * 60000), createdAt: new Date(baseDate.getTime() + 300 * 60000), riskScore: 65, riskLevel: 'high', examScore: 60, flagged: true, status: 'flagged' },
      { student: studentIdMap['student4@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 345 * 60000), createdAt: new Date(baseDate.getTime() + 345 * 60000), riskScore: 30, riskLevel: 'low', examScore: 88, flagged: false, status: 'completed' },

      // Apr 12 - 5 exams
      { student: studentIdMap['student5@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 15 * 60000), createdAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 15 * 60000), riskScore: 35, riskLevel: 'low', examScore: 82, flagged: false, status: 'completed' },
      { student: studentIdMap['student1@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 60 * 60000), createdAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 60 * 60000), riskScore: 55, riskLevel: 'medium', examScore: 68, flagged: false, status: 'completed' },
      { student: studentIdMap['student2@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 210 * 60000), createdAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 210 * 60000), riskScore: 72, riskLevel: 'high', examScore: 55, flagged: true, status: 'flagged' },
      { student: studentIdMap['student3@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 300 * 60000), createdAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 300 * 60000), riskScore: 48, riskLevel: 'medium', examScore: 75, flagged: false, status: 'completed' },
      { student: studentIdMap['student4@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 390 * 60000), createdAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 390 * 60000), riskScore: 62, riskLevel: 'high', examScore: 65, flagged: true, status: 'flagged' },

      // Apr 14 - 3 exams
      { student: studentIdMap['student5@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 45 * 60000), createdAt: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 45 * 60000), riskScore: 28, riskLevel: 'low', examScore: 90, flagged: false, status: 'completed' },
      { student: studentIdMap['student1@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 90 * 60000), createdAt: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 90 * 60000), riskScore: 42, riskLevel: 'medium', examScore: 78, flagged: false, status: 'completed' },
      { student: studentIdMap['student2@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 240 * 60000), createdAt: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 240 * 60000), riskScore: 35, riskLevel: 'low', examScore: 85, flagged: false, status: 'completed' },

      // Apr 16 - 2 exams
      { student: studentIdMap['student3@test.com'], exam: examId, startTime: new Date('2026-04-16T10:00:00Z'), createdAt: new Date('2026-04-16T10:00:00Z'), riskScore: 22, riskLevel: 'low', examScore: 92, flagged: false, status: 'completed' },
      { student: studentIdMap['student4@test.com'], exam: examId, startTime: new Date('2026-04-16T12:00:00Z'), createdAt: new Date('2026-04-16T12:00:00Z'), riskScore: 38, riskLevel: 'low', examScore: 80, flagged: false, status: 'completed' },
    ];

    const result = await mongoose.connection.collection('sessions').insertMany(testSessions);
    console.log(`✅ Inserted ${result.insertedIds.length} proper test sessions\n`);

    console.log('📊 Test Data Summary:');
    console.log('   Apr 10: 4 exams, avg risk 41 → cumulative: 4');
    console.log('   Apr 12: 5 exams, avg risk 55 → cumulative: 9');
    console.log('   Apr 14: 3 exams, avg risk 35 → cumulative: 12');
    console.log('   Apr 16: 2 exams, avg risk 30 → cumulative: 14');
    console.log('\n✅ Refresh http://localhost:3000/admin/analytics!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
