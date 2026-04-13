import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { studentAPI, adminAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: 'student' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  userRole: 'student' | 'admin' | null;
  login: (email: string, password: string, role: 'student' | 'admin') => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'student' | 'admin' | null>(null);

  // Initialize auth from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('user_role') as 'student' | 'admin' | null;

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setUserRole(storedRole || 'student');
      } catch (error) {
        console.error('Failed to restore auth:', error);
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role: 'student' | 'admin') => {
    try {
      setLoading(true);
      const api = role === 'admin' ? adminAPI.login : studentAPI.login;
      const response = await api({ email, password });

      const { token: newToken, student, admin } = response.data;
      const userData = student || admin;

      setToken(newToken);
      setUser({ ...userData, role });
      setUserRole(role);

      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('user', JSON.stringify({ ...userData, role }));
      localStorage.setItem('user_role', role);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    try {
      setLoading(true);
      const response = await studentAPI.register(data);

      const { token: newToken, student } = response.data;

      setToken(newToken);
      setUser({ ...student, role: 'student' });
      setUserRole('student');

      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('user', JSON.stringify({ ...student, role: 'student' }));
      localStorage.setItem('user_role', 'student');
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setUserRole(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        userRole,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
