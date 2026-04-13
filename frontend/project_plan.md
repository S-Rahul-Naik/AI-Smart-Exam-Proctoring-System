# AI Smart Exam Proctoring System

## 1. Project Description
A production-grade, real-time AI-powered exam proctoring platform designed for educational institutions. The system enables multi-modal behavioral analysis, temporal risk scoring, and complete admin control over exam lifecycle. Target users: exam administrators, IT staff, and students. Core value: fraud prevention through AI-driven behavioral monitoring with explainable decisions.

## 2. Page Structure
- `/` - Home (Landing Page)
- `/login` - Login & Identity Verification
- `/admin` - Admin Dashboard → redirects to /admin/monitoring
- `/admin/monitoring` - Live Monitoring (all active students)
- `/admin/exams` - Exam Management
- `/admin/students` - Student Management
- `/admin/sessions` - Session Review & Evidence
- `/admin/results` - Results & Risk-Based Evaluation
- `/admin/analytics` - Reports & Analytics
- `/admin/notifications` - Notifications & Email System
- `/admin/ai-engine` - AI Monitoring Engine
- `/admin/settings` - Admin Settings
- `/exam/precheck` - Pre-Exam System Check
- `/exam/rules` - Exam Rules & Consent
- `/exam/monitoring` - Exam Interface (Focus Mode)
- `/exam/results` - Exam Results
- `/settings` - Settings
- `/help` - Help & Documentation

## 3. Core Features
- [x] Home landing page with product overview
- [x] Login with face verification simulation
- [x] Live admin monitoring dashboard with multi-student grid
- [x] Real-time risk scoring with temporal analysis (simulated)
- [x] Exam management (create, schedule, assign)
- [x] Student management
- [x] Session review with event timeline & evidence snapshots
- [x] Results & risk-based evaluation with admin decisions
- [x] Analytics dashboard with charts
- [x] Notification & email system
- [x] AI Monitoring Engine configuration page
- [x] Pre-exam system check (camera, lighting, face)
- [x] Exam rules & consent screen
- [x] Focus-mode exam interface with behavioral feedback
- [x] Settings & Help pages

## 4. Data Model Design (Mock - No Backend)
All data is simulated via mock files in src/mocks/

### students - Student profiles
### exams - Exam definitions
### sessions - Active/completed monitoring sessions
### alerts - Behavioral alert events
### analytics - Aggregated stats

## 5. Backend / Third-party Integration Plan
- Supabase: Not connected (Phase 1 uses mock data)
- Shopify: Not applicable
- Stripe: Not applicable
- WebSockets: Simulated with React state + intervals

## 6. Development Phase Plan

### Phase 1: Full UI Build (Current)
- Goal: Build all pages with professional design and mock data
- Deliverable: Complete navigable application with all screens

### Phase 2: Supabase Integration (Future)
- Goal: Connect real database, authentication, and edge functions
- Deliverable: Working backend with real data persistence

### Phase 3: Real AI Integration (Future)
- Goal: Connect TensorFlow.js models for actual face/gaze/object detection
- Deliverable: Working real-time AI analysis pipeline
