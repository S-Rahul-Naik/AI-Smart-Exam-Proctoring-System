import mongoose from 'mongoose';
import Admin from './src/models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/proctor';

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@proctor.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = new Admin({
      email: 'admin@proctor.com',
      firstName: 'Admin',
      lastName: 'User',
      password: 'Admin@123456', // Will be hashed by pre-save hook
      role: 'admin',
      permissions: ['view_all_exams', 'view_all_students', 'view_all_sessions', 'manage_alerts'],
      status: 'active',
    });

    await admin.save();
    console.log('✓ Admin user created successfully');
    console.log('  Email: admin@proctor.com');
    console.log('  Password: Admin@123456');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
