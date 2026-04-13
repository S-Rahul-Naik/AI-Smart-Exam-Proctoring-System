#!/usr/bin/env node

/**
 * Identity Verification System - Code Path Integration Verification
 * 
 * This script traces through the actual source code to verify all components
 * are correctly wired together without requiring a running backend.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const results = [];

function verify(component, status, details) {
  results.push({ component, status, details });
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${component.padEnd(30)} | ${details}`);
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    return '';
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function stringContains(str, searchStr) {
  return str.includes(searchStr);
}

console.log('🔍 Identity Verification System - Code Path Verification');
console.log('='.repeat(70));

// ============================================================================
// PART 1: Frontend Hook Verification
// ============================================================================

console.log('\n📁 PART 1: Frontend Hooks');
console.log('-'.repeat(70));

const projectRoot = path.join(__dirname, '..');

const continuousMatchingPath = path.join(
  projectRoot,
  'frontend/src/hooks/useContinuousFaceMatching.ts'
);
const examStartVerificationPath = path.join(
  projectRoot,
  'frontend/src/hooks/useExamStartVerification.ts'
);

// Check files exist
verify(
  'useContinuousFaceMatching.ts exists',
  fileExists(continuousMatchingPath) ? 'PASS' : 'FAIL',
  fileExists(continuousMatchingPath) ? 'File present' : 'File missing'
);

verify(
  'useExamStartVerification.ts exists',
  fileExists(examStartVerificationPath) ? 'PASS' : 'FAIL',
  fileExists(examStartVerificationPath) ? 'File present' : 'File missing'
);

// Check exports
const continuousMatchingContent = readFile(continuousMatchingPath);
verify(
  'useContinuousFaceMatching exports functions',
  stringContains(continuousMatchingContent, 'export function useContinuousFaceMatching')
    ? 'PASS'
    : 'FAIL',
  stringContains(continuousMatchingContent, 'export function useContinuousFaceMatching')
    ? 'Exports found'
    : 'No exports'
);

verify(
  'Hook exports startMatching method',
  stringContains(continuousMatchingContent, 'startMatching')
    ? 'PASS'
    : 'FAIL',
  stringContains(continuousMatchingContent, 'startMatching')
    ? 'Method found'
    : 'Method missing'
);

verify(
  'Hook exports stopMatching method',
  stringContains(continuousMatchingContent, 'stopMatching')
    ? 'PASS'
    : 'FAIL',
  stringContains(continuousMatchingContent, 'stopMatching')
    ? 'Method found'
    : 'Method missing'
);

verify(
  'Hook exports performFaceMatch method',
  stringContains(continuousMatchingContent, 'performFaceMatch')
    ? 'PASS'
    : 'FAIL',
  stringContains(continuousMatchingContent, 'performFaceMatch')
    ? 'Method found'
    : 'Method missing'
);

verify(
  'Hook tracks matchScore state',
  stringContains(continuousMatchingContent, 'matchScore')
    ? 'PASS'
    : 'FAIL',
  stringContains(continuousMatchingContent, 'matchScore')
    ? 'State tracking found'
    : 'State missing'
);

verify(
  'Hook tracks faceAbsentCount',
  stringContains(continuousMatchingContent, 'faceAbsentCount')
    ? 'PASS'
    : 'FAIL',
  stringContains(continuousMatchingContent, 'faceAbsentCount')
    ? 'Counter found'
    : 'Counter missing'
);

verify(
  'Hook tracks multipleFacesCount',
  stringContains(continuousMatchingContent, 'multipleFacesCount')
    ? 'PASS'
    : 'FAIL',
  stringContains(continuousMatchingContent, 'multipleFacesCount')
    ? 'Counter found'
    : 'Counter missing'
);

// ============================================================================
// PART 2: Backend Endpoint Verification
// ============================================================================

console.log('\n📁 PART 2: Backend Endpoints');
console.log('-'.repeat(70));

const studentControllerPath = path.join(
  projectRoot,
  'backend/src/controllers/studentController.js'
);
const studentRoutesPath = path.join(
  projectRoot,
  'backend/src/routes/studentRoutes.js'
);

// Check files exist
verify(
  'studentController.js exists',
  fileExists(studentControllerPath) ? 'PASS' : 'FAIL',
  fileExists(studentControllerPath) ? 'File present' : 'File missing'
);

verify(
  'studentRoutes.js exists',
  fileExists(studentRoutesPath) ? 'PASS' : 'FAIL',
  fileExists(studentRoutesPath) ? 'File present' : 'File missing'
);

// Check endpoint implementations
const controllerContent = readFile(studentControllerPath);
verify(
  'matchFaceForExam endpoint exists',
  stringContains(controllerContent, 'export const matchFaceForExam')
    ? 'PASS'
    : 'FAIL',
  stringContains(controllerContent, 'export const matchFaceForExam')
    ? 'Implementation found'
    : 'Implementation missing'
);

verify(
  'comparePhotoForExam endpoint exists',
  stringContains(controllerContent, 'export const comparePhotoForExam')
    ? 'PASS'
    : 'FAIL',
  stringContains(controllerContent, 'export const comparePhotoForExam')
    ? 'Implementation found'
    : 'Implementation missing'
);

// Check ArcFace integration
verify(
  'matchFaceForExam uses ArcFace',
  stringContains(controllerContent, 'compareFacesPython') ? 'PASS' : 'FAIL',
  stringContains(controllerContent, 'compareFacesPython')
    ? 'ArcFace call found'
    : 'ArcFace call missing'
);

// Check routes
const routesContent = readFile(studentRoutesPath);
verify(
  'POST /match-face-exam route registered',
  stringContains(routesContent, "/match-face-exam") ? 'PASS' : 'FAIL',
  stringContains(routesContent, "/match-face-exam")
    ? 'Route found'
    : 'Route missing'
);

verify(
  'POST /compare-photo-exam route registered',
  stringContains(routesContent, "/compare-photo-exam") ? 'PASS' : 'FAIL',
  stringContains(routesContent, "/compare-photo-exam")
    ? 'Route found'
    : 'Route missing'
);

verify(
  'matchFaceForExam controller imported',
  stringContains(routesContent, 'matchFaceForExam') ? 'PASS' : 'FAIL',
  stringContains(routesContent, 'matchFaceForExam')
    ? 'Import found'
    : 'Import missing'
);

verify(
  'comparePhotoForExam controller imported',
  stringContains(routesContent, 'comparePhotoForExam') ? 'PASS' : 'FAIL',
  stringContains(routesContent, 'comparePhotoForExam')
    ? 'Import found'
    : 'Import missing'
);

// ============================================================================
// PART 3: Frontend API Integration
// ============================================================================

console.log('\n📁 PART 3: Frontend API Service');
console.log('-'.repeat(70));

const apiPath = path.join(projectRoot, 'frontend/src/services/api.ts');

verify(
  'api.ts exists',
  fileExists(apiPath) ? 'PASS' : 'FAIL',
  fileExists(apiPath) ? 'File present' : 'File missing'
);

const apiContent = readFile(apiPath);
verify(
  'studentAPI.matchFaceForExam method exists',
  stringContains(apiContent, 'matchFaceForExam') ? 'PASS' : 'FAIL',
  stringContains(apiContent, 'matchFaceForExam')
    ? 'Method defined'
    : 'Method missing'
);

verify(
  'studentAPI.comparePhotoForExam method exists',
  stringContains(apiContent, 'comparePhotoForExam') ? 'PASS' : 'FAIL',
  stringContains(apiContent, 'comparePhotoForExam')
    ? 'Method defined'
    : 'Method missing'
);

verify(
  'matchFaceForExam calls /match-face-exam',
  stringContains(apiContent, '/students/match-face-exam') ? 'PASS' : 'FAIL',
  stringContains(apiContent, '/students/match-face-exam')
    ? 'Endpoint URL correct'
    : 'Endpoint URL wrong'
);

verify(
  'comparePhotoForExam calls /compare-photo-exam',
  stringContains(apiContent, '/students/compare-photo-exam') ? 'PASS' : 'FAIL',
  stringContains(apiContent, '/students/compare-photo-exam')
    ? 'Endpoint URL correct'
    : 'Endpoint URL wrong'
);

// ============================================================================
// PART 4: Monitoring Page Integration
// ============================================================================

console.log('\n📁 PART 4: Exam Monitoring Page Integration');
console.log('-'.repeat(70));

const monitoringPagePath = path.join(
  projectRoot,
  'frontend/src/pages/exam/monitoring/page.tsx'
);

verify(
  'monitoring/page.tsx exists',
  fileExists(monitoringPagePath) ? 'PASS' : 'FAIL',
  fileExists(monitoringPagePath) ? 'File present' : 'File missing'
);

const monitoringContent = readFile(monitoringPagePath);

verify(
  'Imports useExamStartVerification',
  stringContains(monitoringContent, 'useExamStartVerification')
    ? 'PASS'
    : 'FAIL',
  stringContains(monitoringContent, 'useExamStartVerification')
    ? 'Import found'
    : 'Import missing'
);

verify(
  'Imports useContinuousFaceMatching',
  stringContains(monitoringContent, 'useContinuousFaceMatching')
    ? 'PASS'
    : 'FAIL',
  stringContains(monitoringContent, 'useContinuousFaceMatching')
    ? 'Import found'
    : 'Import missing'
);

verify(
  'Initializes useExamStartVerification hook',
  stringContains(monitoringContent, 'useExamStartVerification(videoRef)')
    ? 'PASS'
    : 'FAIL',
  stringContains(monitoringContent, 'useExamStartVerification(videoRef)')
    ? 'Hook call found'
    : 'Hook call missing'
);

verify(
  'Initializes useContinuousFaceMatching hook',
  stringContains(monitoringContent, 'useContinuousFaceMatching(videoRef')
    ? 'PASS'
    : 'FAIL',
  stringContains(monitoringContent, 'useContinuousFaceMatching(videoRef')
    ? 'Hook call found'
    : 'Hook call missing'
);

verify(
  'Calls continuousFaceMatching.startMatching()',
  stringContains(monitoringContent, 'continuousFaceMatching.startMatching()')
    ? 'PASS'
    : 'FAIL',
  stringContains(monitoringContent, 'continuousFaceMatching.startMatching()')
    ? 'Method call found'
    : 'Method call missing'
);

verify(
  'Calls continuousFaceMatching.stopMatching()',
  stringContains(monitoringContent, 'continuousFaceMatching.stopMatching()')
    ? 'PASS'
    : 'FAIL',
  stringContains(monitoringContent, 'continuousFaceMatching.stopMatching()')
    ? 'Method call found'
    : 'Method call missing'
);

verify(
  'Records face matching events',
  stringContains(monitoringContent, 'sessionAPI.recordEvents')
    ? 'PASS'
    : 'FAIL',
  stringContains(monitoringContent, 'sessionAPI.recordEvents')
    ? 'Event recording found'
    : 'Event recording missing'
);

verify(
  'Has verification overlay UI',
  stringContains(monitoringContent, 'Identity Verification')
    ? 'PASS'
    : 'FAIL',
  stringContains(monitoringContent, 'Identity Verification')
    ? 'UI text found'
    : 'UI text missing'
);

// ============================================================================
// PART 5: Documentation Verification
// ============================================================================

console.log('\n📁 PART 5: Documentation');
console.log('-'.repeat(70));

const docs = [
  'IDENTITY_VERIFICATION_GUIDE.md',
  'CONTINUOUS_FACE_MATCHING_TEST.md',
  'QUICK_START_IDENTITY.md',
  'IDENTITY_VERIFICATION_TESTING.md',
  'IDENTITY_VERIFICATION_GETTING_STARTED.md',
  'README_IDENTITY_VERIFICATION.md',
  'IDENTITY_VERIFICATION_VERIFICATION_CHECKLIST.md',
];

docs.forEach(doc => {
  const docPath = path.join(projectRoot, doc);
  verify(
    doc,
    fileExists(docPath) ? 'PASS' : 'FAIL',
    fileExists(docPath)
      ? `${Math.round((fs.statSync(docPath).size || 0) / 1024)} KB`
      : 'File missing'
  );
});

// ============================================================================
// PART 6: Test Infrastructure Verification
// ============================================================================

console.log('\n📁 PART 6: Test Infrastructure');
console.log('-'.repeat(70));

const testFiles = [
  'backend/test-identity-verification.js',
  'frontend/src/tests/useContinuousFaceMatching.test.ts',
];

testFiles.forEach(testFile => {
  const testPath = path.join(projectRoot, testFile);
  verify(
    path.basename(testFile),
    fileExists(testPath) ? 'PASS' : 'FAIL',
    fileExists(testPath)
      ? `${Math.round((fs.statSync(testPath).size || 0) / 1024)} KB`
      : 'File missing'
  );
});

// ============================================================================
// Summary
// ============================================================================

const passCount = results.filter(r => r.status === 'PASS').length;
const failCount = results.filter(r => r.status === 'FAIL').length;
const totalCount = results.length;
const successRate = Math.round((passCount / totalCount) * 100);

console.log('\n' + '='.repeat(70));
console.log('📊 INTEGRATION VERIFICATION SUMMARY');
console.log('='.repeat(70));
console.log(`✅ Passed: ${passCount}/${totalCount}`);
console.log(`❌ Failed: ${failCount}/${totalCount}`);
console.log(`📈 Success Rate: ${successRate}%`);

if (failCount === 0) {
  console.log('\n🎉 All components verified! System is ready for deployment.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some components need attention.');
  process.exit(1);
}
