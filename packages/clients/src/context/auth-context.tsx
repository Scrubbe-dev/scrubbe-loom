'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';

interface AuthContextType {
  user: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Record<string , string> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await apiClient.get('/auth/me');
        if (!!res) {
          const data = await res.data;
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  async function login(email: string, password: string) {
    const res = await apiClient.post('/auth/login', { email, password });

    if (res) {
      const data = await res.data;
      setUser(data.user);
      router.push('/');
    } else {
      throw new Error('Login failed');
    }
  }

  async function logout() {
    await apiClient.post('/auth/logout');
    setUser(null);
    router.push('/auth/login');
  }

  const value = { user, isLoading, login, logout };

  return <AuthContext.Provider value={value as any}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}