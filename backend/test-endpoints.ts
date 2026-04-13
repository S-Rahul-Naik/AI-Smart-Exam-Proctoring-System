import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testAdminEndpoints() {
  try {
    console.log('🧪 Testing Admin Endpoints...\n');

    // Test 1: Health Check
    console.log('1️⃣  Health Check');
    const healthRes = await axios.get(`${API_BASE}/health`);
    console.log('   ✓ Backend is running:', healthRes.data.status);

    // Test 2: Admin Login
    console.log('\n2️⃣  Admin Login');
    try {
      const loginRes = await axios.post(`${API_BASE}/admins/login`, {
        email: 'admin@proctor.com',
        password: 'Admin@123456'
      });
      const token = loginRes.data.token;
      console.log('   ✓ Login successful');
      console.log('   Token:', token.substring(0, 20) + '...');

      // Test 3: Get Active Sessions (without students yet)
      console.log('\n3️⃣  Get Active Sessions');
      const sessionsRes = await axios.get(`${API_BASE}/admin/sessions/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('   ✓ Active sessions:', sessionsRes.data.count);
      console.log('   Sessions:', sessionsRes.data.sessions);

      // Test 4: Get All Students
      console.log('\n4️⃣  Get All Students');
      const studentsRes = await axios.get(`${API_BASE}/admin/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('   ✓ Total students:', studentsRes.data.count);

      // Test 5: Get Analytics
      console.log('\n5️⃣  Get Analytics');
      const analyticsRes = await axios.get(`${API_BASE}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('   ✓ Analytics:', analyticsRes.data.summary);

      console.log('\n✅ All tests passed! Admin system is ready.\n');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('   ❌ Login failed: Invalid credentials');
        console.log('   Make sure seed-admin.js was run first');
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', error.response.data);
    }
  }
}

testAdminEndpoints();
