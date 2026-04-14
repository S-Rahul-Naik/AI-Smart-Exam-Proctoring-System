# Quick Reference: New Course Code Entry Flow

## For Students

### Step 1: Complete System Check
```
URL: http://localhost:3000/exam/precheck
- Camera access
- Face visibility  
- Lighting quality
- Camera position
- Single person
- Identity verification
```

### Step 2: Enter Course Code (NEW!)
```
URL: http://localhost:3000/exam/enter-coursecode
- Ask instructor for course code (e.g., "CS401")
- Type the code
- Click "Find My Exam"
- ✅ Exam found and stored
```

### Step 3: Read Rules & Consent
```
URL: http://localhost:3000/exam/rules
- Shows actual exam details from database
- Student reads rules
- Clicks "I agree" checkbox
- Clicks "Start Exam Now"
```

### Step 4: Take Exam
```
URL: http://localhost:3000/exam/monitoring?examId=69dec12bc34fc13aa0f00d87
- Real exam ID in URL
- 4 questions displayed from database
- Student answers all questions
- AI proctoring active
```

## For Admins

### Step 1: Create Exam
```
Admin Dashboard: http://localhost:3000/admin/exams
- Click "Create Exam"
- Enter title, course code (e.g., "CS401"), duration
- Click "Create"
```

### Step 2: Add Questions
```
- Click "Questions" on the exam card
- Click "Add Question"
- Choose type (MCQ, essay, short-answer, true-false)
- Enter question text, marks
- Add MCQ options if needed
- Click "Save Question"
- Click "Save & Close"
```

### Step 3: Share Course Code
```
- Click "Copy Course Code: CS401" button
- ✅ Code copied to clipboard
- Send to students via email, LMS, message
- Students enter this code to access exam
```

### Step 4: Monitor Exams
```
- Click "Monitor" button on active exams
- See real-time student activity
- Track risk scores
- View AI detection events
```

## Database Integration

### Exam Table
```javascript
{
  _id: ObjectId("69dec12bc34fc13aa0f00d87"),
  title: "Advanced Algorithms & Data Structures",
  courseCode: "CS401",  // ← Students enter this
  code: "CS401",
  duration: 180,
  totalQuestions: 4,
  totalMarks: 100,
  date: "2026-04-15",
  startTime: "09:00",
  // ... more fields
}
```

### Questions Table
```javascript
[
  {
    _id: ObjectId(...),
    exam: ObjectId("69dec12bc34fc13aa0f00d87"),  // Links to exam
    number: 1,
    question: "What is ur name?",
    type: "short-answer",
    marks: 1
  },
  {
    _id: ObjectId(...),
    exam: ObjectId("69dec12bc34fc13aa0f00d87"),
    number: 2,
    question: "Who Are you",
    type: "essay",
    marks: 1
  },
  // ... 2 more questions
]
```

## API Endpoints

### GET /api/exams
Fetch all exams
```bash
curl http://localhost:5000/api/exams
↓
{
  exams: [
    {
      _id: "69dec12bc34fc13aa0f00d87",
      title: "Advanced Algorithms...",
      courseCode: "CS401",
      ...
    }
  ]
}
```

### GET /api/exams/:examId/questions
Fetch questions by exam ID
```bash
curl http://localhost:5000/api/exams/69dec12bc34fc13aa0f00d87/questions
↓
{
  questions: [
    { number: 1, question: "What is ur name?", type: "short-answer", marks: 1 },
    { number: 2, question: "Who Are you", type: "essay", marks: 1 },
    { number: 3, question: "HOw are you", type: "true-false", marks: 1 },
    { number: 4, question: "What is the time complexity...", type: "mcq", marks: 1, options: [...] }
  ]
}
```

## Code Flow in Monitoring Page

```javascript
// 1. Get base exam ID from URL
const examId = searchParams.get('examId');
// examId = "69dec12bc34fc13aa0f00d87"

// 2. Fetch questions using the exam ID
const response = await examAPI.getExamQuestions(examId);
// GET /api/exams/69dec12bc34fc13aa0f00d87/questions

// 3. Render questions
setQuestions(response.data.questions || []);
// ✅ 4 questions displayed
```

## Test the Flow

```bash
# 1. Start servers (if not running)
cd backend && npm start &
cd frontend && npm run dev &

# 2. Open admin dashboard
http://localhost:3000/admin/exams
# See exam "Advanced Algorithms & Data Structures"
# See "Copy Course Code: CS401" button

# 3. Start exam process
http://localhost:3000/exam/precheck
# Complete system check

# 4. Enter course code page
http://localhost:3000/exam/enter-coursecode
# Enter "CS401"
# ✅ Should find the exam

# 5. See exam rules
http://localhost:3000/exam/rules
# Shows: Advanced Algorithms & Data Structures, CS401, 3 hours, etc.

# 6. Take exam
http://localhost:3000/exam/monitoring?examId=69dec12bc34fc13aa0f00d87
# ✅ Should see 4 questions!
```

## Error Handling

### No Exam Found
```
User enters "INVALID"
↓
Course code lookup fails
↓
Error message: "No exam found with course code 'INVALID'"
↓
User can re-enter code
```

### Empty Input
```
User clicks "Find My Exam" without entering code
↓
Error message: "Please enter a course code"
↓
Input disabled until valid code entered
```

### Database Error
```
MongoDB connection fails
↓
Graceful error: "Failed to find exam. Please try again."
↓
Check server logs and MongoDB status
```

## Architecture

```
       ADMIN                          STUDENT
       ────────────────────────────────────────
       
Creates Exam      Create Exam        
with CS401    →   (title, courseCode="CS401")
                  ↓
              MongoDB: Exam table
              { courseCode: "CS401" }
              
Adds Questions→   Questions table  
(Q1-Q4)           { exam: ObjectId(...), questions: [...] }
              
Copy Code         "CS401"        ←  Student receives
  ════════════════════════════════→  "CS401"
                                      ↓
                              Enter "CS401"
                              in course code page
                                      ↓
                              Lookup exam by courseCode
                              { _id: "69dec12...", courseCode: "CS401" }
                                      ↓
                              Store in sessionStorage
                                      ↓
                              Proceed to rules → exam
                                      ↓
                              Fetch questions using
                              real exam ID
                                      ↓
                              ✅ See 4 questions!
```
