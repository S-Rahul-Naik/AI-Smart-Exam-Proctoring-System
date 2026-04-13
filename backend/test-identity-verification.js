#!/usr/bin/env node

/**
 * Identity Verification Endpoints Test Suite
 * Tests exam start verification and continuous face matching endpoints
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test.identity@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPassword123!';

// Test credentials
let testToken = null;
let testStudentId = null;
let testEnrollmentPhotoUrl = null;

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  errors: [],
};

/**
 * Utility: Make API call with auth
 */
async function apiCall(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {},
    };

    if (testToken) {
      config.headers['Authorization'] = `Bearer ${testToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      status: error.response?.status,
    };
  }
}

/**
 * Utility: Log test result
 */
function logResult(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} | ${testName}`);
  if (details) {
    console.log(`       ${details}`);
  }

  if (passed) {
    results.passed++;
  } else {
    results.failed++;
    results.errors.push({ test: testName, details });
  }
}

/**
 * Test 1: Student Registration
 */
async function testStudentRegistration() {
  console.log('\n📝 TEST 1: Student Registration');

  const registerData = {
    email: TEST_EMAIL,
    firstName: 'Identity',
    lastName: 'Tester',
    password: TEST_PASSWORD,
    confirmPassword: TEST_PASSWORD,
  };

  const result = await apiCall('POST', '/students/register', registerData);

  if (result.success) {
    testStudentId = result.data.student._id;
    logResult('Student Registration', true, `ID: ${testStudentId}`);
  } else {
    // Might already exist
    logResult('Student Registration', result.status === 409, `Email may already exist: ${result.error}`);
  }
}

/**
 * Test 2: Student Login
 */
async function testStudentLogin() {
  console.log('\n🔐 TEST 2: Student Login');

  const loginData = {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  };

  const result = await apiCall('POST', '/students/login', loginData);

  if (result.success && result.data.token) {
    testToken = result.data.token;
    testStudentId = result.data.student._id;
    logResult('Student Login', true, `Token received: ${testToken.substring(0, 20)}...`);
  } else {
    logResult('Student Login', false, result.error);
  }
}

/**
 * Test 3: Get Student Profile
 */
async function testGetProfile() {
  console.log('\n👤 TEST 3: Get Student Profile');

  const result = await apiCall('GET', '/students/profile');

  if (result.success && result.data.student) {
    logResult('Get Profile', true, `Email: ${result.data.student.email}`);
  } else {
    logResult('Get Profile', false, result.error);
  }
}

/**
 * Test 4: Get Enrollment Photos
 */
async function testGetEnrollmentPhotos() {
  console.log('\n📸 TEST 4: Get Enrollment Photos');

  const result = await apiCall('GET', '/students/enrollment-photos');

  if (result.success && result.data.photos) {
    const photos = result.data.photos;
    testEnrollmentPhotoUrl = photos.loginPhotoUrl || photos.signupPhotoUrl;

    logResult(
      'Get Enrollment Photos',
      Boolean(testEnrollmentPhotoUrl),
      `Found: ${testEnrollmentPhotoUrl ? 'login/signup photo' : 'no photos'}`
    );
  } else {
    logResult('Get Enrollment Photos', false, result.error);
  }
}

/**
 * Test 5: Compare Photo for Exam Start
 * Tests mandatory face verification at exam start
 */
async function testComparePhotoForExam() {
  console.log('\n🎯 TEST 5: Compare Photo for Exam Start');

  if (!testEnrollmentPhotoUrl) {
    logResult(
      'Compare Photo for Exam',
      false,
      'No enrollment photo available. Run test with uploaded enrollment photo.'
    );
    return;
  }

  // Create a mock base64 image (small valid JPEG)
  const mockJpegBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';

  const compareData = {
    capturedFrame: mockJpegBase64,
  };

  const result = await apiCall('POST', '/students/compare-photo-exam', compareData);

  if (result.success) {
    const matchConfidence = result.data.matchConfidence || 0;
    const verified = result.data.verified;

    logResult(
      'Compare Photo for Exam',
      true,
      `Match: ${matchConfidence}%, Verified: ${verified}`
    );
  } else {
    logResult(
      'Compare Photo for Exam',
      false,
      result.error || 'Face comparison failed'
    );
  }
}

/**
 * Test 6: Match Face for Exam (Continuous)
 * Tests continuous face matching every 30 seconds
 */
async function testMatchFaceForExam() {
  console.log('\n🔄 TEST 6: Match Face for Exam (Continuous)');

  if (!testEnrollmentPhotoUrl) {
    logResult(
      'Match Face for Exam',
      false,
      'No enrollment photo available. Run test with uploaded enrollment photo.'
    );
    return;
  }

  // Create a mock base64 image (small valid JPEG)
  const mockJpegBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';

  const matchData = {
    livePhoto: mockJpegBase64,
    enrollmentPhotoUrl: testEnrollmentPhotoUrl,
  };

  const result = await apiCall('POST', '/students/match-face-exam', matchData);

  if (result.success) {
    const matchConfidence = result.data.matchConfidence || 0;
    const isSamePerson = result.data.isSamePerson;
    const faceCount = result.data.faceCount || 1;

    logResult(
      'Match Face for Exam',
      true,
      `Match: ${matchConfidence}%, Same Person: ${isSamePerson}, Faces: ${faceCount}`
    );
  } else {
    logResult(
      'Match Face for Exam',
      false,
      result.error || 'Face matching failed'
    );
  }
}

/**
 * Test 7: Continuous Matching Simulation
 * Simulates multiple continuous matching calls
 */
async function testContinuousMatchingSimulation() {
  console.log('\n⏱️  TEST 7: Continuous Matching Simulation (3 iterations)');

  if (!testEnrollmentPhotoUrl) {
    logResult(
      'Continuous Matching Simulation',
      false,
      'No enrollment photo available'
    );
    return;
  }

  const mockJpegBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';

  let successCount = 0;

  for (let i = 0; i < 3; i++) {
    const matchData = {
      livePhoto: mockJpegBase64,
      enrollmentPhotoUrl: testEnrollmentPhotoUrl,
    };

    const result = await apiCall('POST', '/students/match-face-exam', matchData);
    if (result.success) {
      successCount++;
    }

    // Small delay between iterations (to simulate 30-second intervals)
    if (i < 2) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  logResult(
    'Continuous Matching Simulation',
    successCount === 3,
    `${successCount}/3 matching cycles successful`
  );
}

/**
 * Test 8: Error Handling - Missing Enrollment Photo
 */
async function testErrorHandling() {
  console.log('\n⚠️  TEST 8: Error Handling - Missing Required Fields');

  // Test 1: Missing capturedFrame
  const result1 = await apiCall('POST', '/students/compare-photo-exam', {});
  logResult(
    'Error Handling - Missing Frame',
    result1.status === 400,
    `Status: ${result1.status}`
  );

  // Test 2: Missing livePhoto
  const result2 = await apiCall('POST', '/students/match-face-exam', {
    enrollmentPhotoUrl: 'https://example.com/photo.jpg',
  });
  logResult(
    'Error Handling - Missing Live Photo',
    result2.status === 400,
    `Status: ${result2.status}`
  );
}

/**
 * Test 9: Authentication Required
 */
async function testAuthenticationRequired() {
  console.log('\n🔒 TEST 9: Authentication Required');

  // Save current token and clear it
  const savedToken = testToken;
  testToken = null;

  const result = await apiCall('GET', '/students/enrollment-photos');

  logResult(
    'Authentication Required',
    result.status === 401,
    `Status: ${result.status}`
  );

  // Restore token
  testToken = savedToken;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Identity Verification Test Suite');
  console.log('=' .repeat(60));
  console.log(`API URL: ${API_URL}`);
  console.log('=' .repeat(60));

  try {
    // Run all tests in sequence
    await testStudentRegistration();
    await testStudentLogin();
    await testGetProfile();
    await testGetEnrollmentPhotos();
    await testComparePhotoForExam();
    await testMatchFaceForExam();
    await testContinuousMatchingSimulation();
    await testErrorHandling();
    await testAuthenticationRequired();

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

    if (results.errors.length > 0) {
      console.log('\n⚠️  Failed Tests:');
      results.errors.forEach(err => {
        console.log(`  - ${err.test}: ${err.details}`);
      });
    }

    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test suite error:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
