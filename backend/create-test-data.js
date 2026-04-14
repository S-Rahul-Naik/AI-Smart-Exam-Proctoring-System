import mongoose from 'mongoose';
import Exam from './src/models/Exam.js';
import Question from './src/models/Question.js';

(async () => {
  try {
    await mongoose.connect('mongodb://localhost');
    console.log('✓ Connected to MongoDB\n');

    // Create test exam
    console.log('📝 Creating test exam...');
    const exam = new Exam({
      title: 'Advanced Algorithms & Data Structures',
      description: 'Test your knowledge of DSA concepts',
      courseCode: 'CS401',
      code: 'CS401',
      duration: 180,
      totalMarks: 100,
      date: '2026-04-15',
      startTime: '09:00',
      endTime: '12:00',
    });
    await exam.save();
    console.log(`✓ Exam created with ID: ${exam._id}\n`);

    // Create test questions
    const questionsData = [
      {
        number: 1,
        question: 'What is ur name?',
        type: 'short-answer',
        marks: 1,
        difficulty: 'medium',
      },
      {
        number: 2,
        question: 'Who Are you',
        type: 'essay',
        marks: 1,
        difficulty: 'medium',
      },
      {
        number: 3,
        question: 'HOw are you',
        type: 'true-false',
        marks: 1,
        difficulty: 'medium',
      },
      {
        number: 4,
        question: 'What is the time complexity of Binary Search?',
        type: 'mcq',
        marks: 1,
        difficulty: 'medium',
        options: [
          { text: 'O(n)', isCorrect: false },
          { text: 'O(log n)', isCorrect: true },
          { text: 'O(n²)', isCorrect: false },
          { text: 'O(1)', isCorrect: false },
        ],
      },
    ];

    console.log('📚 Creating questions...');
    for (const q of questionsData) {
      const question = new Question({
        exam: exam._id,
        ...q,
      });
      await question.save();
      console.log(`✓ Q${q.number}: ${q.question.substring(0, 40)}`);
    }

    console.log('\n✅ Test data created successfully!');
    console.log(`\n🔍 Exam Details:`);
    console.log(`   Exam ID: ${exam._id}`);
    console.log(`   Course Code: CS401`);
    console.log(`   Questions: 4`);

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
