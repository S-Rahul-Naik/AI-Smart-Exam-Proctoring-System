# Generate Test Exam Data for Analytics Dashboard

The chart is empty because you need exam session data spread across multiple dates with varied risk levels.

## Quick Fix: Generate Test Data via Backend API

### Step 1: Access MongoDB directly or via backend endpoint

If you have a test/seed endpoint, use it. Otherwise, follow Step 2-3.

### Step 2: Add Test Exam Sessions (MongoDB)

Run this in MongoDB compass or mongo shell in your backend database:

```javascript
db.sessions.insertMany([
  // Apr 10 - 4 exams, mixed risk
  {
    student: "student1@test.com",
    exam: ObjectId("507f1f77bcf86cd799439011"),
    date: new Date("2026-04-10T09:00:00Z"),
    riskScore: 25,
    riskLevel: "low",
    examScore: 85,
    flagged: false
  },
  {
    student: "student2@test.com",
    exam: ObjectId("507f1f77bcf86cd799439011"),
    date: new Date("2026-04-10T10:30:00Z"),
    riskScore: 45,
    riskLevel: "medium",
    examScore: 72,
    flagged: false
  },
  {
    student: "student3@test.com",
    exam: ObjectId("507f1f77bcf86cd799439011"),
    date: new Date("2026-04-10T14:00:00Z"),
    riskScore: 65,
    riskLevel: "high",
    examScore: 60,
    flagged: true
  },
  {
    student: "student4@test.com",
    exam: ObjectId("507f1f77bcf86cd799439011"),
    date: new Date("2026-04-10T15:45:00Z"),
    riskScore: 30,
    riskLevel: "low",
    examScore: 88,
    flagged: false
  },
  // Apr 12 - 5 exams, higher risk trend
  {
    student: "student5@test.com",
    exam: ObjectId("507f1f77bcf86cd799439012"),
    date: new Date("2026-04-12T09:15:00Z"),
    riskScore: 35,
    riskLevel: "low",
    examScore: 82,
    flagged: false
  },
  {
    student: "student1@test.com",
    exam: ObjectId("507f1f77bcf86cd799439012"),
    date: new Date("2026-04-12T11:00:00Z"),
    riskScore: 55,
    riskLevel: "medium",
    examScore: 68,
    flagged: false
  },
  {
    student: "student2@test.com",
    exam: ObjectId("507f1f77bcf86cd799439012"),
    date: new Date("2026-04-12T13:30:00Z"),
    riskScore: 72,
    riskLevel: "high",
    examScore: 55,
    flagged: true
  },
  {
    student: "student3@test.com",
    exam: ObjectId("507f1f77bcf86cd799439012"),
    date: new Date("2026-04-12T15:00:00Z"),
    riskScore: 48,
    riskLevel: "medium",
    examScore: 75,
    flagged: false
  },
  {
    student: "student4@test.com",
    exam: ObjectId("507f1f77bcf86cd799439012"),
    date: new Date("2026-04-12T16:30:00Z"),
    riskScore: 62,
    riskLevel: "high",
    examScore: 65,
    flagged: true
  },
  // Apr 14 - 3 exams, risk decreasing
  {
    student: "student5@test.com",
    exam: ObjectId("507f1f77bcf86cd799439013"),
    date: new Date("2026-04-14T09:45:00Z"),
    riskScore: 28,
    riskLevel: "low",
    examScore: 90,
    flagged: false
  },
  {
    student: "student1@test.com",
    exam: ObjectId("507f1f77bcf86cd799439013"),
    date: new Date("2026-04-14T11:30:00Z"),
    riskScore: 42,
    riskLevel: "medium",
    examScore: 78,
    flagged: false
  },
  {
    student: "student2@test.com",
    exam: ObjectId("507f1f77bcf86cd799439013"),
    date: new Date("2026-04-14T14:00:00Z"),
    riskScore: 35,
    riskLevel: "low",
    examScore: 85,
    flagged: false
  },
  // Apr 16 - 2 exams (today), low risk
  {
    student: "student3@test.com",
    exam: ObjectId("507f1f77bcf86cd799439014"),
    date: new Date("2026-04-16T10:00:00Z"),
    riskScore: 22,
    riskLevel: "low",
    examScore: 92,
    flagged: false
  },
  {
    student: "student4@test.com",
    exam: ObjectId("507f1f77bcf86cd799439014"),
    date: new Date("2026-04-16T12:00:00Z"),
    riskScore: 38,
    riskLevel: "low",
    examScore: 80,
    flagged: false
  }
])
```

### Step 3: Refresh Analytics Dashboard

- Go to `http://localhost:3000/admin/analytics`
- Refresh the page (F5 or Ctrl+R)
- The chart will now show:
  - ✅ Cumulative exams growing from 4 → 9 → 12 → 14
  - ✅ Average risk trending: ~41 → ~55 → ~35 → ~30 (showing improvement)
  - ✅ Date labels: Apr 10, Apr 12, Apr 14, Apr 16
  - ✅ Visual bars showing progression

## What You're Looking At

**Cumulative Exams** (teal bars): Running total grows each day
- Apr 10: 4 exams total
- Apr 12: 9 exams total  
- Apr 14: 12 exams total
- Apr 16: 14 exams total

**Average Risk Score** (amber bars): Risk level of exams at that point
- Shows trend over time (improving or worsening risk management)
- Height = average risk (0-100 scale)

## Real Data Flow

Once you have students taking exams:
1. Each exam creates a `Session` document in MongoDB
2. Risk scores calculated from behavioral violations
3. Dashboard queries all sessions and displays cumulative trend
4. Chart automatically updates every page refresh

## For Production

Remove test data before going live:
```javascript
db.sessions.deleteMany({ 
  student: { $in: ["student1@test.com", "student2@test.com", "student3@test.com", "student4@test.com", "student5@test.com"] }
})
```
