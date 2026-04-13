import http from 'http';

const testData = {
  signupPhotoUrl: "https://avatars.githubusercontent.com/u/1?v=4",
  loginPhotoUrl: "https://avatars.githubusercontent.com/u/1?v=4",
  currentPhotoUrl: "https://avatars.githubusercontent.com/u/1?v=4"
};

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/verify/compare-faces',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('🧪 Testing Ollama Face Comparison Endpoint\n');
console.log('Request URL: POST http://localhost:5000/api/verify/compare-faces');
console.log('Request Body:', JSON.stringify(testData, null, 2));
console.log('\n🔄 Sending request...\n');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Response received!\n');
    try {
      const result = JSON.parse(data);
      console.log('📊 Face Comparison Result:');
      console.log(JSON.stringify(result, null, 2));
      
      process.exit(result.decision === 'ALLOW' ? 0 : 1);
    } catch (e) {
      console.error('❌ Failed to parse response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

req.write(JSON.stringify(testData));
req.end();
