import http from 'http';

// Simple solid color test images (as base64)
// These are 1x1 pixel JPEGs to keep them small
const redPixel = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';

const testData = {
  signupPhotoUrl: "data:image/jpeg;base64," + redPixel,
  loginPhotoUrl: "data:image/jpeg;base64," + redPixel,
  currentPhotoUrl: "data:image/jpeg;base64," + redPixel
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

console.log('🧪 Testing Ollama Face Comparison (with base64 images)\n');
console.log('Request URL: POST http://localhost:5000/api/verify/compare-faces');
console.log('Request Body: 3 identical base64 JPEG images');
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
      
      console.log('\n' + (result.decision === 'ALLOW' ? '✅' : '❌') + ' Decision: ' + result.decision);
      
      process.exit(0);
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
