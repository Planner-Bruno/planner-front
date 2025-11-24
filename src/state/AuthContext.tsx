import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AUTH_STORAGE_KEY, API_BASE_URL } from '@/config/api';
import { resetPlannerSnapshot } from '@/storage/plannerStorage';

interface UserProfile {
  email: string;
  name?: string;
}

interface AuthContextValue {
  bootstrapping: boolean;
  token: string | null;
  user: UserProfile | null;
  error: string | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string, name?: string): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { token: string; user: UserProfile };
          setToken(parsed.token);
          setUser(parsed.user);
        }
      } catch (storageError) {
        console.warn('Erro ao carregar auth', storageError);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, []);

  const authenticate = useCallback(async (path: '/auth/login' | '/auth/register', payload: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail ?? 'Não foi possível concluir a solicitação');
      }
      setToken(data.token);
      setUser(data.user);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: data.token, user: data.user }));
    } catch (requestError) {
      const normalizedError = (() => {
        if (requestError instanceof TypeError && requestError.message === 'Network request failed') {
          return new Error(`Não foi possível acessar ${API_BASE_URL}. Verifique se o backend está disponível para o seu dispositivo e se o IP está correto.`);
        }
        if (requestError instanceof Error) {
          return requestError;
        }
        return new Error('Erro inesperado ao comunicar com o servidor');
      })();
      setError(normalizedError.message);
      throw normalizedError;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((email: string, password: string) => authenticate('/auth/login', { email, password }), [authenticate]);

  const register = useCallback(
    (email: string, password: string, name?: string) => authenticate('/auth/register', { email, password, name }),
    [authenticate]
  );

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    await resetPlannerSnapshot();
  }, []);

  const value: AuthContextValue = {
    bootstrapping,
    token,
    user,
    error,
    loading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return ctx;
};
