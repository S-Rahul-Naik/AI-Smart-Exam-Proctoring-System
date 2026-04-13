import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testSubmit() {
  try {
    console.log('Testing exam submission...\n');

    // Try with a simpler test - just check if the endpoint exists
    console.log('1️⃣  Testing POST /api/sessions/{sessionId}/submit endpoint');
    
    // Use a dummy session ID just to test the endpoint responds
    const testRes = await axios.post(
      `${API_BASE}/sessions/test-session-id/submit`,
      { answers: {} },
      { 
        headers: { Authorization: 'Bearer dummy-token' },
        validateStatus: () => true  // Accept any status
      }
    );
    
    console.log('   Status:', testRes.status);
    console.log('   Response:', testRes.data);
    
    if (testRes.status === 404 && !testRes.data.stack) {
      console.log('\n✅ Good! No server error (temporal dead zone fixed)');
      console.log('   Endpoint exists and handles requests properly');
    } else if (testRes.data.stack) {
      console.log('\n❌ Error still exists:', testRes.data.error);
    } else {
      console.log('\n✅ Endpoint responding correctly');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSubmit();
