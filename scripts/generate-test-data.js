#!/usr/bin/env node

/**
 * Generate Test Exam Session Data for Analytics Dashboard
 * 
 * Usage: node generate-test-data.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/proctor';

// Schema definitions (simplified)
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

// Test data generator
async function generateTestData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if test data already exists
    const existingCount = await Session.countDocuments({
      student: { $in: ['student1@test.com', 'student2@test.com', 'student3@test.com', 'student4@test.com', 'student5@test.com'] }
    });

    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} test records already exist. Deleting...`);
      await Session.deleteMany({
        student: { $in: ['student1@test.com', 'student2@test.com', 'student3@test.com', 'student4@test.com', 'student5@test.com'] }
      });
      console.log('✅ Deleted existing test records');
    }

    // Generate test exam data
    const baseDate = new Date('2026-04-10');
    const testSessions = [
      // Apr 10 - 4 exams, mixed risk (avg: 41)
      { student: 'student1@test.com', exam: new mongoose.Types.ObjectId(), date: new Date(baseDate.getTime() + 0), riskScore: 25, riskLevel: 'low', examScore: 85, flagged: false },
      { student: 'student2@test.com', exam: new mongoose.Types.ObjectId(), date: new Date(baseDate.getTime() + 90 * 60000), riskScore: 45, riskLevel: 'medium', examScore: 72, flagged: false },
      { student: 'student3@test.com', exam: new mongoose.Types.ObjectId(), date: new Date(baseDate.getTime() + 300 * 60000), riskScore: 65, riskLevel: 'high', examScore: 60, flagged: true },
      { student: 'student4@test.com', exam: new mongoose.Types.ObjectId(), date: new Date(baseDate.getTime() + 345 * 60000), riskScore: 30, riskLevel: 'low', examScore: 88, flagged: false },

      // Apr 12 - 5 exams, higher risk (cumulative avg: 55)
      { student: 'student5@test.com', exam: new mongoose.Types.ObjectId(), date: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 15 * 60000), riskScore: 35, riskLevel: 'low', examScore: 82, flagged: false },
      { student: 'student1@test.com', exam: new mongoose.Types.ObjectId(), date: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 60 * 60000), riskScore: 55, riskLevel: 'medium', examScore: 68, flagged: false },
      { student: 'student2@test.com', exam: new mongoose.Types.ObjectId(), date: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 210 * 60000), riskScore: 72, riskLevel: 'high', examScore: 55, flagged: true },
      { student: 'student3@test.com', exam: new mongoose.Types.ObjectId(), date: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 300 * 60000), riskScore: 48, riskLevel: 'medium', examScore: 75, flagged: false },
      { student: 'student4@test.com', exam: new mongoose.Types.ObjectId(), date: new Date(baseDate.getTime() + 2 * 24 * 60 * 60000 + 390 * 60000), riskScore: 62, riskLevel: 'high', examScore: 65, flagged: true },

      // Apr 14 - 3 exams, risk decreasing (cumulative avg: 46)
      { student: 'student5@test.com', exam: new mongoose.Types.ObjectId(), date: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 45 * 60000), riskScore: 28, riskLevel: 'low', examScore: 90, flagged: false },
      { student: 'student1@test.com', exam: new mongoose.Types.ObjectId(), date: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 90 * 60000), riskScore: 42, riskLevel: 'medium', examScore: 78, flagged: false },
      { student: 'student2@test.com', exam: new mongoose.Types.ObjectId(), date: new Date(baseDate.getTime() + 4 * 24 * 60 * 60000 + 240 * 60000), riskScore: 35, riskLevel: 'low', examScore: 85, flagged: false },

      // Apr 16 - 2 exams (today), low risk (cumulative avg: 43)
      { student: 'student3@test.com', exam: new mongoose.Types.ObjectId(), date: new Date(baseDate.getTime() + 6 * 24 * 60 * 60000 + 0), riskScore: 22, riskLevel: 'low', examScore: 92, flagged: false },
      { student: 'student4@test.com', exam: new mongoose.Types.ObjectId(), date: new Date(baseDate.getTime() + 6 * 24 * 60 * 60000 + 120 * 60000), riskScore: 38, riskLevel: 'low', examScore: 80, flagged: false },
    ];

    await Session.insertMany(testSessions);
    console.log(`✅ Inserted ${testSessions.length} test exam sessions`);
    console.log('\n📊 Test Data Summary:');
    console.log('   Apr 10: 4 exams, avg risk 41');
    console.log('   Apr 12: 5 exams, avg risk 55 (cumulative)');
    console.log('   Apr 14: 3 exams, avg risk 35 (cumulative)');
    console.log('   Apr 16: 2 exams, avg risk 30 (cumulative)');
    console.log('\n✅ Refresh http://localhost:3000/admin/analytics to see the chart!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

generateTestData();
