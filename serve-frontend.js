/**
 * Simple Express server to serve the production frontend build
 * This verifies the frontend can be deployed and accessed
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

const buildPath = path.join(__dirname, 'frontend', 'out');

// Serve static files from production build
app.use(express.static(buildPath));

// Serve index.html for all routes (SPA)
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
    console.log(`✅ Production build is ready for deployment`);
  } else {
    console.log(`❌ Build directory not found`);
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
