import { Navigate } from 'react-router-dom';

export default function RootPage() {
  // Always redirect to home page (landing page)
  return <Navigate to="/home" replace />;
}
