# Database Seed Script Documentation

## Overview
The seed script (`scripts/seedDatabase.js`) populates your MongoDB database with realistic test data for development and testing purposes. It creates:
- 15 test students with hashed passwords
- 3 test exams with varying statuses
- 10 test exam sessions (2 high-risk, 8 low-risk)

## Running the Seed Script

### Using npm (Recommended)
```bash
cd backend
npm run seed
```

### Direct Node execution
```bash
cd backend
node scripts/seedDatabase.js
```

## What Gets Created

### Test Students (15 total)
Each student has:
- First & Last Name (realistic names from diverse backgrounds)
- Email: `[firstname.lastname]@university.edu`
- Student ID: `STU-2024-001` through `STU-2024-015`
- Program/Major (Computer Science, Data Science, AI & ML, Cybersecurity, Software Engineering)
- Password: `TestPass123` (hashed with bcrypt)

**Available Test Credentials:**
```
Email: aisha.rahman@university.edu
Email: marcus.chen@university.edu
Email: elena.vasquez@university.edu
Email: james.okafor@university.edu
Email: priya.nair@university.edu
...and 10 more

Password: TestPass123 (all students)
```

### Test Exams (3 total)

1. **Advanced Algorithms & Data Structures** (Active)
   - Code: CS401, Duration: 180 min, 50 questions, 100 marks
   - Status: `active` (currently running)
   - Started: 30 minutes ago
   - 10 students currently taking it (2 high-risk, 8 normal)

2. **Machine Learning Fundamentals** (Published)
   - Code: AI302, Duration: 120 min, 40 questions, 80 marks
   - Status: `published` (scheduled for future)
   - Starts: 2 days from now

3. **Database Systems & SQL** (Completed)
   - Code: CS385, Duration: 150 min, 45 questions, 100 marks
   - Status: `completed` (finished last week)

### Test Sessions (10 total)
All sessions are for the "Advanced Algorithms" exam:

**High-Risk Sessions (2 students):**
- Risk Score: 75-90 (flagged as high risk)
- Events: Multiple violations including phone detection, face absence, gaze deviation
- Status: In Progress

**Normal Sessions (8 students):**
- Risk Score: 20-40 (low risk)
- Events: Minimal violations (1-2 minor events)
- Status: In Progress

## Database State After Seeding

### Collections Modified
- `students` - 15 documents added
- `exams` - 3 documents added
- `sessions` - 10 documents added

### Data Relationships
```
Exam (Advanced Algorithms)
  ├─ Session 1 → Student 1 (Aisha Rahman) - HIGH RISK
  ├─ Session 2 → Student 2 (Marcus Chen) - HIGH RISK
  ├─ Session 3 → Student 3 (Elena Vasquez) - NORMAL
  ├─ Session 4 → Student 4 (James Okafor) - NORMAL
  ├─ Session 5 → Student 5 (Priya Nair) - NORMAL
  ├─ Session 6 → Student 6 (Liam Kowalski) - NORMAL
  ├─ Session 7 → Student 7 (Yuki Tanaka) - NORMAL
  ├─ Session 8 → Student 8 (Omar Al-Farsi) - NORMAL
  ├─ Session 9 → Student 9 (Sofia Petrov) - NORMAL
  └─ Session 10 → Student 10 (David Nguyen) - NORMAL
```

## Verifying the Seed Worked

### 1. Check Admin Monitoring Page
- Navigate to `http://localhost:3000/admin/monitoring`
- Should see **"16 Active Sessions"** (the 10 seeded + others if running)
- Should display:
  - ✅ **2 High-Risk students** in the risk leaderboard
  - ✅ **8 Low-Risk students**
  - ✅ Real student names (not "s001", "s002", etc.)
  - ✅ Session cards with exam details and risk scores
  - ✅ Live event timeline showing violations

### 2. Check Student Names
The real student names should appear:
- In the Risk Leaderboard (right panel)
- In alert notifications (real first + last names)
- In session cards

### 3. Verify Risk Alerts
- Click "Alerts" badge to see notifications
- Should show alerts for high-risk students with format:
  - `"[Student Name] crossed HIGH risk — score reached [X]/100"`

### 4. Monitor Session Details
- Click on a session card to view:
  - Student name
  - Exam details
  - Risk score and events
  - Timestamps
  - Suspicious activities (for high-risk sessions)

## Re-seeding the Database

To clear old test data and create fresh seed data:

```bash
npm run seed
```

The script automatically:
1. Connects to MongoDB
2. **Clears** existing test data (email matching `@university.edu`)
3. **Creates** 15 new students
4. **Creates** 3 new exams
5. **Creates** 10 new sessions

⚠️ **Note:** Only deletes test data matching the pattern. Production data is safe.

## Customizing the Seed Data

### Edit Student Data
Open `scripts/seedDatabase.js` and modify the `testStudents` array:
```javascript
const testStudents = [
  { firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@university.edu', ... },
  // Add more students here
];
```

### Edit Exam Data
Modify the `testExams` array in the seedDatabase function:
```javascript
const testExams = [
  {
    title: 'Your Exam Title',
    code: 'YOURCODE',
    subject: 'Subject',
    // ... more fields
  },
];
```

### Edit Session Risk Distribution
In the session creation loop, adjust:
```javascript
const isHighRisk = index < 2; // Change 2 to create more/fewer high-risk sessions
```

## Troubleshooting

### Connection Error
```
❌ Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure MongoDB is running
```bash
# Windows - check mongod is running
# Or start MongoDB if using Docker
docker-compose up -d
```

### Validation Errors
```
❌ Error: Student validation failed: password: Path `password` is required.
```
**Solution:** The seed script should handle this. If it persists, check the Student model schema.

### Duplicate Key Error
```
❌ E11000 duplicate key error
```
**Solution:** Run `npm run seed` again - it clears old data before inserting new data.

## Performance Impact

Seeding takes approximately:
- 2-3 seconds for network operations
- Variable based on MongoDB performance
- No significant impact on system

## Cleanup

To remove all test data without re-seeding:

```bash
node -e "
import('mongoose').then(m => 
  m.default.connect('mongodb://localhost:27017/proctor_ai').then(() =>
    import('./src/models/Student.js').then(S =>
      S.default.deleteMany({ email: { \$regex: '@university.edu' } }).then(r => {
        console.log('Deleted ' + r.deletedCount + ' students');
        process.exit(0);
      })
    )
  )
)
"
```

## Next Steps

After seeding:

1. ✅ **Admin Dashboard** - View live sessions and monitor students
2. ✅ **Student Login** - Test the exam flow with seed credentials
3. ✅ **Monitoring** - Verify real-time updates work correctly
4. ✅ **Session Review** - Check session replay and analytics

## Support

If seed data doesn't appear:
1. Check MongoDB connection (`mongodb://localhost:27017/proctor_ai`)
2. Verify `MONGO_URI` in `.env` file
3. Check browser console for API errors
4. Run `npm start` to ensure backend is running
5. Hard refresh browser (Ctrl+Shift+R)
