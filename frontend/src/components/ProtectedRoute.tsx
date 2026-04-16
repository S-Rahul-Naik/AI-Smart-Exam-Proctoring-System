import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  element: JSX.Element;
  requiredRole?: 'student' | 'admin';
}

export function ProtectedRoute({ element, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin inline-block mb-4">
            <i className="ri-loader-4-line text-4xl text-teal-400" />
          </div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={userRole === 'admin' ? '/admin/dashboard' : '/home'} replace />;
  }

  return element;
}

export default ProtectedRoute;
