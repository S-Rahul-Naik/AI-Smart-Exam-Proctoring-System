/**
 * Simple Express server to serve the production frontend build
 * This verifies the frontend can be deployed and accessed
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

const buildPath = path.join(__dirname, 'frontend', 'out');

// Security: Don't allow directory listing
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  next();
});

// Serve static files from production build (no directory listing)
app.use(express.static(buildPath, {
  index: 'index.html',
  etag: false
}));

// Serve index.html for all routes (SPA - React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ Frontend server running on http://localhost:${PORT}`);
  console.log(`📁 Serving: ${buildPath}`);
  
  // Verify the build directory exists and has files
  const fs = require('fs');
  if (fs.existsSync(buildPath)) {
    const files = fs.readdirSync(buildPath);
    console.log(`📦 Build files: ${files.length} items`);
    
    // Verify index.html exists
    if (fs.existsSync(path.join(buildPath, 'index.html'))) {
      console.log(`✅ React app ready for access at http://localhost:${PORT}/`);
    } else {
      console.error(`❌ ERROR: index.html not found in ${buildPath}`);
      console.error(`   Please run 'npm run build' in the frontend folder first`);
      process.exit(1);
    }
  } else {
    console.error(`❌ ERROR: Build directory not found at ${buildPath}`);
    console.error(`   Please run 'npm run build' in the frontend folder first`);
    process.exit(1);
  }
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
