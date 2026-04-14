import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Student from '../src/models/Student.js';
import Exam from '../src/models/Exam.js';
import Session from '../src/models/Session.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/proctor_ai';

// Test student data - with default password
const testStudents = [
  { firstName: 'Aisha', lastName: 'Rahman', email: 'aisha.rahman@university.edu', studentId: 'STU-2024-001', program: 'Computer Science', password: 'TestPass123' },
  { firstName: 'Marcus', lastName: 'Chen', email: 'marcus.chen@university.edu', studentId: 'STU-2024-002', program: 'Data Science', password: 'TestPass123' },
  { firstName: 'Elena', lastName: 'Vasquez', email: 'elena.vasquez@university.edu', studentId: 'STU-2024-003', program: 'AI & ML', password: 'TestPass123' },
  { firstName: 'James', lastName: 'Okafor', email: 'james.okafor@university.edu', studentId: 'STU-2024-004', program: 'Software Engineering', password: 'TestPass123' },
  { firstName: 'Priya', lastName: 'Nair', email: 'priya.nair@university.edu', studentId: 'STU-2024-005', program: 'Cybersecurity', password: 'TestPass123' },
  { firstName: 'Liam', lastName: 'Kowalski', email: 'liam.kowalski@university.edu', studentId: 'STU-2024-006', program: 'Computer Science', password: 'TestPass123' },
  { firstName: 'Yuki', lastName: 'Tanaka', email: 'yuki.tanaka@university.edu', studentId: 'STU-2024-007', program: 'Data Science', password: 'TestPass123' },
  { firstName: 'Omar', lastName: 'Al-Farsi', email: 'omar.alfarsi@university.edu', studentId: 'STU-2024-008', program: 'AI & ML', password: 'TestPass123' },
  { firstName: 'Sofia', lastName: 'Petrov', email: 'sofia.petrov@university.edu', studentId: 'STU-2024-009', program: 'Software Engineering', password: 'TestPass123' },
  { firstName: 'David', lastName: 'Nguyen', email: 'david.nguyen@university.edu', studentId: 'STU-2024-010', program: 'Cybersecurity', password: 'TestPass123' },
  { firstName: 'Hannah', lastName: 'Schmidt', email: 'hannah.schmidt@university.edu', studentId: 'STU-2024-011', program: 'Computer Science', password: 'TestPass123' },
  { firstName: 'Raj', lastName: 'Patel', email: 'raj.patel@university.edu', studentId: 'STU-2024-012', program: 'Data Science', password: 'TestPass123' },
  { firstName: 'Isabella', lastName: 'Rossi', email: 'isabella.rossi@university.edu', studentId: 'STU-2024-013', program: 'AI & ML', password: 'TestPass123' },
  { firstName: 'Ahmed', lastName: 'Hassan', email: 'ahmed.hassan@university.edu', studentId: 'STU-2024-014', program: 'Cybersecurity', password: 'TestPass123' },
  { firstName: 'Chloe', lastName: 'Martin', email: 'chloe.martin@university.edu', studentId: 'STU-2024-015', program: 'Software Engineering', password: 'TestPass123' },
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing test data...');
    await Student.deleteMany({ email: { $regex: '@university.edu' } });
    await Session.deleteMany({ student: { $exists: true } });
    await Exam.deleteMany({ code: { $regex: 'CS|DS|AI|SE|CS' } });
    console.log('✅ Cleared old test data');

    // Insert test students
    console.log('👥 Creating test students...');
    const studentsToCreate = testStudents.map(student => ({
      ...student,
      password: bcrypt.hashSync(student.password, 10), // Hash the password
    }));
    const createdStudents = await Student.insertMany(studentsToCreate);
    console.log(`✅ Created ${createdStudents.length} test students`);

    // Create test exams
    console.log('📋 Creating test exams...');
    const now = new Date();
    const testExams = [
      {
        title: 'Advanced Algorithms & Data Structures',
        code: 'CS401',
        subject: 'Computer Science',
        description: 'Final examination covering graph theory, dynamic programming, and complexity analysis.',
        duration: 180,
        totalQuestions: 50,
        totalMarks: 100,
        passingMarks: 50,
        startTime: new Date(now.getTime() - 30 * 60 * 1000), // Started 30 mins ago
        endTime: new Date(now.getTime() + 150 * 60 * 1000), // Ends in 150 mins
        status: 'active',
      },
      {
        title: 'Machine Learning Fundamentals',
        code: 'AI302',
        subject: 'Artificial Intelligence',
        description: 'Midterm covering supervised learning, neural networks, and model evaluation.',
        duration: 120,
        totalQuestions: 40,
        totalMarks: 80,
        passingMarks: 40,
        startTime: new Date(now.getTime() + 48 * 60 * 60 * 1000), // In 2 days
        endTime: new Date(now.getTime() + 48 * 60 * 60 * 1000 + 120 * 60 * 1000),
        status: 'published',
      },
      {
        title: 'Database Systems & SQL',
        code: 'CS385',
        subject: 'Computer Science',
        description: 'Final exam on relational databases, query optimization, and transactions.',
        duration: 150,
        totalQuestions: 45,
        totalMarks: 100,
        passingMarks: 50,
        startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Last week
        endTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 150 * 60 * 1000),
        status: 'completed',
      },
    ];

    const createdExams = await Exam.insertMany(testExams);
    console.log(`✅ Created ${createdExams.length} test exams`);

    // Create sample sessions for the first exam (Advanced Algorithms)
    console.log('📝 Creating sample sessions...');
    const sessionPromises = createdStudents.slice(0, 10).map((student, index) => {
      const isHighRisk = index < 2; // First 2 students high risk
      const sessionData = {
        exam: createdExams[0]._id, // Advanced Algorithms exam
        student: student._id,
        startTime: new Date(Date.now() - 30 * 60 * 1000), // Started 30 mins ago
        status: 'in_progress',
        riskScore: isHighRisk ? 75 + Math.random() * 15 : 20 + Math.random() * 20,
        riskLevel: isHighRisk ? 'high' : 'low',
        events: generateSampleEvents(isHighRisk),
        totalEvents: isHighRisk ? 5 : 2,
        eventCounts: {
          faceAbsent: isHighRisk ? 2 : 0,
          gazeDeviation: isHighRisk ? 2 : 1,
          multipleFaces: 0,
          phoneDetected: isHighRisk ? 1 : 0,
          tabSwitch: 0,
          fullscreenExit: 0,
          rightClick: 0,
          devtoolsOpen: 0,
          copyPaste: 0,
          unusualMovement: 0,
          headphoneDetected: 0,
          lowLight: 0,
          faceBlur: 0,
          extremeGazeAngle: 0,
          rapidHeadMovement: 0,
          backgroundChange: 0,
        },
        suspiciousActivities: isHighRisk ? [
          {
            category: 'behavior',
            indicator: 'Repeated gaze deviation',
            severity: 'high',
            detectedAt: new Date(),
            confidence: 85,
          },
          {
            category: 'environment',
            indicator: 'Phone detected in frame',
            severity: 'critical',
            detectedAt: new Date(),
            confidence: 92,
          },
        ] : [],
        flagged: isHighRisk,
        adminReview: {
          reviewed: false,
          decision: 'pending',
          riskAssessment: isHighRisk ? 'high_risk' : 'low_risk',
        },
      };

      // Only add flagReason and flagSeverity if flagged
      if (isHighRisk) {
        sessionData.flagReason = 'High risk behavior detected';
        sessionData.flagSeverity = 'high';
      }

      return Session.create(sessionData);
    });

    const sessions = await Promise.all(sessionPromises);
    console.log(`✅ Created ${sessions.length} test sessions`);

    console.log('✅ Database seeding complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Created ${createdStudents.length} test students`);
    console.log(`   - Created ${createdExams.length} test exams`);
    console.log(`   - Created ${sessions.length} test sessions (2 high-risk, 8 low-risk)`);
    console.log('\n🎯 Next steps:');
    console.log('   1. Go to Admin Monitoring page');
    console.log('   2. Verify 8-10 active sessions appear');
    console.log('   3. Check that high-risk students show alerts');
    console.log('   4. Verify real student names appear in alerts');
    console.log('\n📝 Test Credentials:');
    console.log('   Email: aisha.rahman@university.edu');
    console.log('   Password: TestPass123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

function generateSampleEvents(isHighRisk) {
  const baseEvents = [
    {
      type: 'gaze_deviation',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      weight: 10,
      severity: 'medium',
    },
  ];

  if (isHighRisk) {
    baseEvents.push(
      {
        type: 'face_absent',
        timestamp: new Date(Date.now() - 12 * 60 * 1000),
        weight: 15,
        severity: 'high',
      },
      {
        type: 'phone_detected',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        weight: 25,
        severity: 'critical',
        confidence: 92,
        deviceDetected: 'phone',
      },
      {
        type: 'gaze_deviation',
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        weight: 10,
        severity: 'medium',
      },
      {
        type: 'face_absent',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        weight: 15,
        severity: 'high',
      }
    );
  }

  return baseEvents;
}

seedDatabase();
