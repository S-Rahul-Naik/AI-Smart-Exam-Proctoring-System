import 'dotenv/config';
import app from './app.js';
import connectDB from './config/mongodb.js';
import { downloadFaceApiModels } from './utils/downloadModels.js';

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Download face-api models
    console.log('🤖 Initializing ML models...');
    await downloadFaceApiModels();
    
    // Connect to MongoDB
    await connectDB();
    console.log('✓ Database connected');

    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ API: http://localhost:${PORT}/api`);
      console.log(`✓ Models: http://localhost:${PORT}/models/face-api`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
