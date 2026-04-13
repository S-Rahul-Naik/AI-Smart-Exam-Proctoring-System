// Test script to verify exam submission works
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testSubmitExam() {
  try {
    console.log('🧪 Testing Exam Submission Fix...\n');

    // First, create a session by logging in and initializing
    console.log('1️⃣  Logging in student...');
    const loginRes = await axios.post(`${API_BASE}/students/login`, {
      email: 'smoke.frontend@martpilot.test',
      password: 'password123'
    });
    
    const token = loginRes.data.token;
    console.log('   ✓ Login successful, token received');

    // Initialize session
    console.log('\n2️⃣  Initializing exam session...');
    const initRes = await axios.post(
      `${API_BASE}/sessions/initialize`,
      { examId: 'exam-001' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    const sessionId = initRes.data.session._id;
    console.log('   ✓ Session created:', sessionId);
    console.log('   Status:', initRes.data.session.status);

    // Submit exam
    console.log('\n3️⃣  Submitting exam...');
    const submitRes = await axios.post(
      `${API_BASE}/sessions/${sessionId}/submit`,
      { answers: { 1: 'A', 2: 'B', 3: 'C' } },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('   ✓ Exam submitted successfully!');
    console.log('   Status:', submitRes.data.session.status);
    console.log('   Duration:', submitRes.data.session.duration, 'ms');
    console.log('   End Time:', submitRes.data.session.endTime);

    console.log('\n✅ ALL TESTS PASSED! Exam submission is working.\n');
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.error || error.message);
    if (error.response?.data?.stack) {
      console.error('Stack:', error.response.data.stack);
    }
  }
}

testSubmitExam();
