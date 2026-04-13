// Test images - using public GitHub avatar URLs (same person)
const testImages = {
  signupPhotoUrl: "https://avatars.githubusercontent.com/u/1?v=4",
  loginPhotoUrl: "https://avatars.githubusercontent.com/u/1?v=4", 
  currentPhotoUrl: "https://avatars.githubusercontent.com/u/1?v=4"
};

console.log('🧪 Testing Ollama Face Comparison Endpoint');
console.log('==========================================\n');
console.log('📝 Request payload:');
console.log(JSON.stringify(testImages, null, 2));
console.log('\n🔄 Sending request to http://localhost:5000/api/verify/compare-faces...\n');

try {
  const response = await fetch('http://localhost:5000/api/verify/compare-faces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testImages)
  });

  if (!response.ok) {
    console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
    const errorText = await response.text();
    console.error('Response:', errorText);
    process.exit(1);
  }

  const result = await response.json();
  
  console.log('✅ Response received!\n');
  console.log('📊 Face Comparison Result:');
  console.log('==========================');
  console.log(`Decision: ${result.decision}`);
  console.log(`Confidence: ${result.confidence}%`);
  console.log(`Reasoning: ${result.reasoning}`);
  console.log(`\nDetailed Analysis:`);
  console.log(`  - Signup vs Login (same person?): ${result.signup_login_same_person}`);
  console.log(`  - Current vs Signup (match?): ${result.current_matches_signup}`);
  console.log(`  - Current vs Login (match?): ${result.current_matches_login}`);
  console.log(`\nTimestamp: ${result.timestamp}`);
  
  if (result.decision === 'ALLOW') {
    console.log('\n✅ Status: Identity verification would PASS');
  } else {
    console.log('\n❌ Status: Identity verification would FAIL');
  }
  
} catch (error) {
  console.error('❌ Test failed with error:');
  console.error(error.message);
  process.exit(1);
}
