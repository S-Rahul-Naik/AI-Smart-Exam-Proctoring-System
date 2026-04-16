import { RouteObject, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import RootPage from '../pages/root/page';
import HomePage from '../pages/home/page';
import LoginPage from '../pages/login/page';
import SignupPage from '../pages/signup/page';
import AdminDashboardPage from '../pages/admin/dashboard/page';
import AdminExamsPage from '../pages/admin/exams/page';
import AdminStudentsPage from '../pages/admin/students/page';
import AdminSessionsPage from '../pages/admin/sessions/page';
import AdminResultsPage from '../pages/admin/results/page';
import SessionReviewPage from '../pages/admin/review/page';
import ExamJoinPage from '../pages/exam/join/page';
import PreCheckPage from '../pages/exam/precheck/page';
import EnterCourseCodePage from '../pages/exam/enter-coursecode/page';
import ExamRulesPage from '../pages/exam/rules/page';
import ExamMonitoringPage from '../pages/exam/monitoring/page';
import ExamResultsPage from '../pages/exam/results/page';
import SettingsPage from '../pages/settings/page';
import HelpPage from '../pages/help/page';
import NotFound from '../pages/NotFound';

const routes: RouteObject[] = [
  { path: '/', element: <RootPage /> },
  { path: '/home', element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/admin', element: <Navigate to="/admin/dashboard" replace /> },
  { path: '/admin/dashboard', element: <ProtectedRoute element={<AdminDashboardPage />} requiredRole="admin" /> },
  { path: '/admin/review', element: <ProtectedRoute element={<SessionReviewPage />} requiredRole="admin" /> },
  { path: '/admin/exams', element: <ProtectedRoute element={<AdminExamsPage />} requiredRole="admin" /> },
  { path: '/admin/students', element: <ProtectedRoute element={<AdminStudentsPage />} requiredRole="admin" /> },
  { path: '/admin/sessions', element: <ProtectedRoute element={<AdminSessionsPage />} requiredRole="admin" /> },
  { path: '/admin/results', element: <ProtectedRoute element={<AdminResultsPage />} requiredRole="admin" /> },
  { path: '/admin/analytics', element: <Navigate to="/admin/results" replace /> },
  { path: '/exam/join', element: <ProtectedRoute element={<ExamJoinPage />} requiredRole="student" /> },
  { path: '/exam/precheck', element: <ProtectedRoute element={<PreCheckPage />} requiredRole="student" /> },
  { path: '/exam/enter-coursecode', element: <ProtectedRoute element={<EnterCourseCodePage />} requiredRole="student" /> },
  { path: '/exam/rules', element: <ProtectedRoute element={<ExamRulesPage />} requiredRole="student" /> },
  { path: '/exam/monitoring', element: <ProtectedRoute element={<ExamMonitoringPage />} requiredRole="student" /> },
  { path: '/exam/results', element: <ProtectedRoute element={<ExamResultsPage />} requiredRole="student" /> },
  { path: '/settings', element: <ProtectedRoute element={<SettingsPage />} /> },
  { path: '/help', element: <ProtectedRoute element={<HelpPage />} /> },
  { path: '*', element: <NotFound /> },
];

export default routes;
