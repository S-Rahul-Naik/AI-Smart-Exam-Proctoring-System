import mongoose from 'mongoose';

// Get student schema structure from model
const studentSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  usn: String,
  program: String,
  year: Number,
});

const Student = mongoose.model('Student', studentSchema);

const sessionSchema = new mongoose.Schema({
  exam: mongoose.Schema.Types.ObjectId,
  student: mongoose.Schema.Types.ObjectId,
  startTime: Date,
  createdAt: Date,
  riskScore: Number,
  riskLevel: String,
  examScore: Number,
  flagged: Boolean,
  status: String,
}, { collection: 'sessions' });

const Session = mongoose.model('Session', sessionSchema);

(async () => {
  try {
    await mongoose.connect('mongodb://localhost');
    console.log('✅ Connected to MongoDB\n');

    // Check existing students
    const existingStudents = await Student.find({
      email: { $in: ['student1@test.com', 'student2@test.com', 'student3@test.com', 'student4@test.com', 'student5@test.com'] }
    });

    let studentIds = {};

    if (existingStudents.length < 5) {
      console.log(`⚠️  Only ${existingStudents.length} test students exist. Creating missing ones...`);

      const newStudents = [];
      const existingEmails = new Set(existingStudents.map(s => s.email));
      
      const studentConfig = [
        { email: 'student1@test.com', firstName: 'Alex', lastName: 'Johnson', usn: 'USN001', program: 'CS', year: 3 },
        { email: 'student2@test.com', firstName: 'Beth', lastName: 'Smith', usn: 'USN002', program: 'CS', year: 2 },
        { email: 'student3@test.com', firstName: 'Charlie', lastName: 'Brown', usn: 'USN003', program: 'IT', year: 3 },
        { email: 'student4@test.com', firstName: 'Diana', lastName: 'Davis', usn: 'USN004', program: 'CS', year: 1 },
        { email: 'student5@test.com', firstName: 'Eve', lastName: 'Wilson', usn: 'USN005', program: 'IT', year: 2 },
      ];

      for (const config of studentConfig) {
        if (!existingEmails.has(config.email)) {
          newStudents.push(config);
        }
      }

      if (newStudents.length > 0) {
        const created = await Student.insertMany(newStudents);
        console.log(`✅ Created ${created.length} new test students`);
        
        // Combine existing and newly created
        const allStudents = [...existingStudents, ...created];
        allStudents.forEach(s => {
          studentIds[s.email] = s._id;
        });
      } else {
        existingStudents.forEach(s => {
          studentIds[s.email] = s._id;
        });
      }
    } else {
      existingStudents.forEach(s => {
        studentIds[s.email] = s._id;
      });
      console.log(`✅ Found all 5 test students`);
    }

    console.log('\n📊 Student IDs:');
    Object.entries(studentIds).forEach(([email, id]) => {
      console.log(`   ${email}: ${id}`);
    });

    // Get exam ID
    const existingExam = await mongoose.connection.collection('exams').findOne({ code: 'CS401' });
    const examId = existingExam ? existingExam._id : new mongoose.Types.ObjectId();
    console.log(`\n📝 Using exam ID: ${examId}`);

    // Delete old test sessions
    const deleteResult = await Session.deleteMany({
      student: { $in: Object.values(studentIds) }
    });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} old test sessions\n`);

    // Create test sessions with proper student ObjectId references
    const baseDate = new Date('2026-04-10');
    const testSessions = [
      // Apr 10 - 4 exams, mixed risk (avg: 41)
      { student: studentIds['student1@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 0), createdAt: new Date(baseDate.getTime() + 0), riskScore: 25, riskLevel: 'low', examScore: 85, flagged: false, status: 'completed' },
      { student: studentIds['student2@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 90 * 60000), createdAt: new Date(baseDate.getTime() + 90 * 60000), riskScore: 45, riskLevel: 'medium', examScore: 72, flagged: false, status: 'completed' },
      { student: studentIds['student3@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 300 * 60000), createdAt: new Date(baseDate.getTime() + 300 * 60000), riskScore: 65, riskLevel: 'high', examScore: 60, flagged: true, status: 'flagged' },
      { student: studentIds['student4@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 345 * 60000), createdAt: new Date(baseDate.getTime() + 345 * 60000), riskScore: 30, riskLevel: 'low', examScore: 88, flagged: false, status: 'completed' },

      // Apr 12 - 5 exams, higher risk trend  
      { student: studentIds['student5@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 15 * 60000), createdAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 15 * 60000), riskScore: 35, riskLevel: 'low', examScore: 82, flagged: false, status: 'completed' },
      { student: studentIds['student1@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 60 * 60000), createdAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 60 * 60000), riskScore: 55, riskLevel: 'medium', examScore: 68, flagged: false, status: 'completed' },
      { student: studentIds['student2@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 210 * 60000), createdAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 210 * 60000), riskScore: 72, riskLevel: 'high', examScore: 55, flagged: true, status: 'flagged' },
      { student: studentIds['student3@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 300 * 60000), createdAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 300 * 60000), riskScore: 48, riskLevel: 'medium', examScore: 75, flagged: false, status: 'completed' },
      { student: studentIds['student4@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 390 * 60000), createdAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 390 * 60000), riskScore: 62, riskLevel: 'high', examScore: 65, flagged: true, status: 'flagged' },

      // Apr 14 - 3 exams, risk decreasing
      { student: studentIds['student5@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 45 * 60000), createdAt: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 45 * 60000), riskScore: 28, riskLevel: 'low', examScore: 90, flagged: false, status: 'completed' },
      { student: studentIds['student1@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 90 * 60000), createdAt: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 90 * 60000), riskScore: 42, riskLevel: 'medium', examScore: 78, flagged: false, status: 'completed' },
      { student: studentIds['student2@test.com'], exam: examId, startTime: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 240 * 60000), createdAt: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 240 * 60000), riskScore: 35, riskLevel: 'low', examScore: 85, flagged: false, status: 'completed' },

      // Apr 16 - 2 exams (today), low risk
      { student: studentIds['student3@test.com'], exam: examId, startTime: new Date('2026-04-16T10:00:00Z'), createdAt: new Date('2026-04-16T10:00:00Z'), riskScore: 22, riskLevel: 'low', examScore: 92, flagged: false, status: 'completed' },
      { student: studentIds['student4@test.com'], exam: examId, startTime: new Date('2026-04-16T12:00:00Z'), createdAt: new Date('2026-04-16T12:00:00Z'), riskScore: 38, riskLevel: 'low', examScore: 80, flagged: false, status: 'completed' },
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
