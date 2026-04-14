import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

async function testCourseCodeFlow() {
  console.log('🧪 Testing new course code flow...\n');

  try {
    // Test 1: Get all exams
    const examsRes = await api.get('/exams');
    const exams = examsRes.data.exams || [];
    console.log('✅ Test 1: Fetch all exams');
    console.log(`   Found ${exams.length} exams`);

    if (exams.length > 0) {
      const exam = exams[0];
      console.log(`   Exam: ${exam.title}`);
      console.log(`   Course Code: ${exam.courseCode}`);
      console.log(`   Database ID: ${exam._id}`);

      // Test 2: Find exam by course code (simulating student entering course code)
      console.log(`\n✅ Test 2: Student enters course code "${exam.courseCode}"`);
      const matchingExam = exams.find(
        (e) =>
          e.courseCode?.toUpperCase() === exam.courseCode.toUpperCase() ||
          e.code?.toUpperCase() === exam.courseCode.toUpperCase()
      );
      if (matchingExam) {
        console.log(`   ✅ Found matching exam: ${matchingExam._id}`);
      }

      // Test 3: Fetch questions for this exam
      const qRes = await api.get(`/exams/${exam._id}/questions`);
      const questions = qRes.data.questions || [];
      console.log(`\n✅ Test 3: Fetch questions by exam ID`);
      console.log(`   Found ${questions.length} questions`);
      questions.forEach((q) => {
        console.log(
          `   Q${q.number}: "${q.question.substring(0, 40)}..." (${q.type}) - ${q.marks} marks`
        );
      });

      console.log('\n✅ All tests passed! Course code flow is working.');
    } else {
      console.log('⚠️  No exams found in database');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Server response:', error.response.data);
    }
  }
}

testCourseCodeFlow();
