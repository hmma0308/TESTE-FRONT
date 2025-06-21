import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import apiClient from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: { username: string; email: string; password: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const decodeToken = (token: string): User | null => {
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64);
    const decodedPayload = JSON.parse(decodedJson);
    return {
      id: decodedPayload.id,
      name: decodedPayload.username || 'Usuário',
      email: decodedPayload.email || ''
    };
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('simulainvest_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initializeAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('simulainvest_token');
    if (storedToken) {
      setToken(storedToken);
      const decodedUser = decodeToken(storedToken);
      if (decodedUser) {
        setUser(decodedUser);
      } else {
        localStorage.removeItem('simulainvest_token');
        setToken(null);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/login', { username, password });
      const { token: newToken, message } = response.data;

      if (newToken) {
        localStorage.setItem('simulainvest_token', newToken);
        setToken(newToken);
        const decodedUser = decodeToken(newToken);
        setUser(decodedUser);
      } else {
        throw new Error(message || 'Login falhou, token não recebido.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login falhou.';
      setUser(null);
      setToken(null);
      localStorage.removeItem('simulainvest_token');
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { username: string; email: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/register', {
        username: userData.username,
        email: userData.email,
        password: userData.password,
      });
      console.log(response.data.message);
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registro falhou.';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsLoading(true);
    setUser(null);
    setToken(null);
    localStorage.removeItem('simulainvest_token');
    delete apiClient.defaults.headers.common['Authorization'];
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}