import mongoose from 'mongoose';
import Exam from './src/models/Exam.js';
import Question from './src/models/Question.js';

(async () => {
  try {
    await mongoose.connect('mongodb://localhost');
    console.log('✓ Connected to MongoDB\n');

    const exams = await Exam.find();
    console.log('📚 Exams in database:');
    exams.forEach(e => {
      console.log(`  - _id: ${e._id}`);
      console.log(`    title: ${e.title}`);
      console.log(`    courseCode: ${e.courseCode}`);
      console.log(`    code: ${e.code}`);
    });

    console.log('\n📝 Questions in database:');
    for (const exam of exams) {
      const questions = await Question.find({ exam: exam._id });
      console.log(`  For exam ${exam._id} (${exam.courseCode}): ${questions.length} questions`);
      questions.forEach(q => {
        console.log(`    - Q${q.number}: ${q.question.substring(0, 50)}`);
      });
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
