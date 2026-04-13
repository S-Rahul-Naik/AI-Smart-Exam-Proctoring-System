# AI Smart Exam Proctoring System - Backend

## Overview
Node.js + Express backend for the AI Smart Exam Proctoring System with MongoDB and Cloudinary integration.

## Features
- ✅ Student authentication & profile management
- ✅ Exam CRUD operations
- ✅ Real-time session monitoring
- ✅ Event recording with MongoDB storage
- ✅ Snapshot upload to Cloudinary
- ✅ Alert system with risk scoring
- ✅ Admin review workflow
- ✅ JWT-based authentication
- ✅ Role-based access control

## Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express 4.x
- **Database**: MongoDB (Atlas or Local)
- **Storage**: Cloudinary
- **Authentication**: JWT
- **Cache/Real-time**: Redis
- **Validation**: Express Validator
- **Security**: Helmet, CORS

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database & service configs
│   │   ├── mongodb.js
│   │   ├── cloudinary.js
│   │   └── redis.js
│   ├── models/          # MongoDB schemas
│   │   ├── Student.js
│   │   ├── Exam.js
│   │   ├── Session.js
│   │   ├── Admin.js
│   │   └── Alert.js
│   ├── controllers/     # Business logic
│   │   ├── studentController.js
│   │   ├── examController.js
│   │   ├── sessionController.js
│   │   └── alertController.js
│   ├── routes/          # API endpoints
│   │   ├── studentRoutes.js
│   │   ├── examRoutes.js
│   │   ├── sessionRoutes.js
│   │   └── alertRoutes.js
│   ├── middleware/      # Auth, validation, error handling
│   │   ├── auth.js
│   │   ├── upload.js
│   │   └── errorHandler.js
│   ├── services/        # AI & external integrations
│   │   └── aiService.js
│   ├── utils/           # Helpers & utilities
│   │   └── helpers.js
│   ├── app.js           # Express app
│   └── index.js         # Entry point
├── package.json
├── .env.example
└── README.md
```

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create `.env` file
```bash
cp .env.example .env
```

Configure the following:
- `MONGODB_URI`: MongoDB connection string
- `CLOUDINARY_*`: Cloudinary credentials
- `JWT_SECRET`: Secret for JWT tokens
- `FRONTEND_URL`: Frontend URL for CORS

### 3. Start Development Server
```bash
npm run dev
```

Server runs on `http://localhost:5000`

### 4. Start Production Server
```bash
npm start
```

## API Endpoints

### Students
- `POST /api/students/register` - Register student
- `POST /api/students/login` - Login
- `GET /api/students/profile` - Get profile
- `PUT /api/students/profile` - Update profile
- `POST /api/students/verify-face` - Verify face

### Exams
- `POST /api/exams` - Create exam (admin)
- `GET /api/exams` - List exams
- `GET /api/exams/:id` - Get exam details
- `PUT /api/exams/:id` - Update exam (admin)
- `PATCH /api/exams/:id/publish` - Publish exam (admin)
- `DELETE /api/exams/:id` - Delete exam (admin)

### Sessions
- `POST /api/sessions/initialize` - Initialize session
- `POST /api/sessions/:sessionId/start` - Start session
- `POST /api/sessions/:sessionId/submit` - Submit answers
- `POST /api/sessions/:sessionId/events` - Record events
- `POST /api/sessions/:sessionId/snapshot` - Upload snapshot
- `GET /api/sessions/:sessionId` - Get session details
- `POST /api/sessions/:sessionId/review` - Admin review

### Alerts
- `POST /api/alerts` - Create alert
- `GET /api/alerts` - List alerts (admin)
- `PATCH /api/alerts/:alertId/acknowledge` - Acknowledge alert
- `PATCH /api/alerts/:alertId/resolve` - Resolve alert

## Authentication

All protected routes require JWT token in header:
```
Authorization: Bearer <token>
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | development, production |
| `MONGODB_URI` | MongoDB connection |
| `JWT_SECRET` | JWT signing secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `FRONTEND_URL` | Frontend URL for CORS |
| `REDIS_URL` | Redis connection |

## Running Tests

```bash
npm test
```

## Deployment

### Docker
```bash
docker build -t proctor-backend .
docker run -p 5000:5000 proctor-backend
```

### Heroku
```bash
heroku login
heroku create proctor-backend
git push heroku main
```

### AWS/DigitalOcean
Deploy using PM2 process manager:
```bash
npm install -g pm2
pm2 start src/index.js --name proctor-backend
pm2 logs
```

## Performance Optimization

- ✅ Indexed MongoDB queries
- ✅ Redis caching for frequently accessed data
- ✅ Cloudinary CDN for snapshot delivery
- ✅ Request compression with gzip
- ✅ Connection pooling with MongoDB

## Security

- ✅ Helmet for HTTP headers
- ✅ CORS configured for frontend
- ✅ JWT token expiry (7 days default)
- ✅ Password hashing with bcrypt
- ✅ Input validation with express-validator
- ✅ Rate limiting (recommended: npm install express-rate-limit)

## Monitoring & Logging

Consider adding:
- Winston for structured logging
- Sentry for error tracking
- New Relic for performance monitoring
- DataDog for infrastructure monitoring

## Next Steps

1. **Integrate with Frontend**: Update frontend API calls to match these endpoints
2. **Real-time Updates**: Add Socket.IO for live monitoring
3. **Background Jobs**: Add Bull/Agenda for scheduled tasks (email notifications, cleanup)
4. **Payment Integration**: Add Stripe for exam access control
5. **Advanced Analytics**: Add aggregation pipelines for stats

## Support

For issues or questions, contact the development team or create an issue in the repository.
