import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import studentRoutes from './routes/studentRoutes.js';
import examRoutes from './routes/examRoutes.js';
import questionsRoutes from './routes/questionsRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import verifyRoutes from './routes/verifyRoutes.js';
import detectionRoutes from './routes/detectionRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Security & Body Parser
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://localhost:8000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static ML models (face-api) with explicit CORS
app.use('/models', cors(), express.static(path.join(__dirname, '../public/models')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// API Routes
app.use('/api/students', studentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/exams', questionsRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/admin', adminRoutes); // Alias for /api/admin endpoints
app.use('/api/verify', verifyRoutes);
app.use('/api/detect', detectionRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
