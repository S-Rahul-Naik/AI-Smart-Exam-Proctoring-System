// Test script to verify admin login works
const adminCreds = {
  email: 'admin@proctor.com',
  password: 'Admin@123456'
};

console.log('Testing Admin Login...');
console.log('Credentials:', adminCreds);
console.log('\nExpected endpoint: POST http://localhost:5000/api/admins/login');
console.log('\nTo test, you can:');
console.log('1. Login to the admin dashboard at http://localhost:3000/login');
console.log('2. Select "Admin" from the role dropdown');
console.log('3. Enter email: admin@proctor.com');
console.log('4. Enter password: Admin@123456');
console.log('\nOr use curl:');
console.log('curl -X POST http://localhost:5000/api/admins/login -H "Content-Type: application/json" -d \'{"email":"admin@proctor.com","password":"Admin@123456"}\'');
