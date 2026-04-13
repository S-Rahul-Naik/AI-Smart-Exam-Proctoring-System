#!/usr/bin/env node

/**
 * ProctorAI Installation Verification Script
 * Run: npm install -g && proctor-verify
 */

const fs = require('fs');
const path = require('path');

const CHECKS = [
  {
    name: 'Backend Structure',
    paths: [
      'backend/package.json',
      'backend/src/index.js',
      'backend/src/app.js',
      'backend/.env.example',
    ],
  },
  {
    name: 'Frontend Structure',
    paths: [
      'frontend/package.json',
      'frontend/src/App.tsx',
      'frontend/src/services/api.ts',
      'frontend/src/hooks/useAuth.ts',
    ],
  },
  {
    name: 'Configuration Files',
    paths: [
      'SETUP_GUIDE.md',
      'INTEGRATION_COMPLETE.md',
      'backend/.env.example',
      'frontend/.env',
    ],
  },
  {
    name: 'Documentation',
    paths: [
      'backend/README.md',
      'SETUP_GUIDE.md',
    ],
  },
];

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║     ProctorAI - Installation Verification v1.0         ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

let allPassed = true;

CHECKS.forEach(check => {
  console.log(`┌─ ${check.name}`);
  
  let checkPassed = true;
  check.paths.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    const exists = fs.existsSync(fullPath);
    const status = exists ? '✓' : '✗';
    const color = exists ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(`│  ${color}${status}${reset}  ${filePath}`);
    if (!exists) checkPassed = false;
  });
  
  console.log(`└─ ${checkPassed ? '✓ PASS' : '✗ FAIL'}\n`);
  if (!checkPassed) allPassed = false;
});

if (allPassed) {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  ✓ All checks passed! Ready to start.                 ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log('Next steps:\n');
  console.log('1. Configure credentials in backend/.env');
  console.log('2. Terminal 1: cd backend && npm run dev');
  console.log('3. Terminal 2: cd frontend && npm run dev');
  console.log('4. Open http://localhost:5173\n');
  
  process.exit(0);
} else {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  ✗ Some checks failed. Please verify files.          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  process.exit(1);
}
