import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser } from '../types.js';
import { apiLogin, apiSignup, apiGoogleLogin, apiForgotPassword, apiResetPassword, apiGetMe } from '../api.js';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (email?: string, name?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; resetToken?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'agentic_auth_token';
const USER_KEY = 'agentic_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Validate session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        try {
          const res = await apiGetMe();
          setUser(res.user);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiLogin(email, password);
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiSignup(name, email, password);
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (customEmail?: string, customName?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const email = customEmail || 'google.user@example.com';
      const name = customName || 'Google User';
      const googleId = `google_${Date.now()}`;

      const res = await apiGoogleLogin({ googleId, email, name });
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setError(null);
    try {
      const res = await apiForgotPassword(email);
      return res;
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset.');
      throw err;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setError(null);
    try {
      const res = await apiResetPassword(token, newPassword);
      return res;
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setError(null);
  };

  const clearError = () => setError(null);

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await apiGetMe();
      setUser(res.user);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } catch {
      // Handled silently
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        error,
        login,
        signup,
        loginWithGoogle,
        forgotPassword,
        resetPassword,
        logout,
        clearError,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
