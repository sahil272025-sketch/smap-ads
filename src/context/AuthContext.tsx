import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, MetaConnectionState, GoogleConfigStatus } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  metaConnection: MetaConnectionState | null;
  googleConfig: GoogleConfigStatus | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  handleGoogleCredential: (idToken: string) => Promise<void>;
  loginWithEmail: (credentials: { email: string; password: string }) => Promise<void>;
  registerWithEmail: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [metaConnection, setMetaConnection] = useState<MetaConnectionState | null>(null);
  const [googleConfig, setGoogleConfig] = useState<GoogleConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      // First, fetch Google config status
      try {
        const config = await api.getGoogleConfig();
        setGoogleConfig(config);
      } catch (e) {
        console.error('Failed to load Google config', e);
      }

      const data = await api.getMe();
      setUser(data.user);
      setMetaConnection(data.metaConnection);
    } catch {
      setUser(null);
      setMetaConnection(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Listen for popup postMessage from Google OAuth callback if window.opener is used
  useEffect(() => {
    const handleAuthMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      const isTrustedOrigin = 
        origin === window.location.origin ||
        origin.endsWith('.run.app') ||
        origin.includes('.ai.studio') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1');

      if (!isTrustedOrigin) return;

      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        if (event.data.token) {
          api.setToken(event.data.token);
        }
        if (event.data.user) {
          setUser(event.data.user);
        }
        await refreshUser();
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  const loginWithGoogle = async (): Promise<void> => {
    // Disabled: OAuth Popup flow has been removed in favor of official Google Identity Services (GIS)
    console.warn('OAuth Popup flow is disabled. Use the official Continue with Google button.');
  };

  const handleGoogleCredential = async (idToken: string): Promise<void> => {
    const res = await api.verifyGoogleIdToken(idToken);
    api.setToken(res.token);
    setUser(res.user);
    await refreshUser();
  };

  const loginWithEmail = async (credentials: { email: string; password: string }): Promise<void> => {
    const res = await api.loginWithEmail(credentials);
    api.setToken(res.token);
    setUser(res.user);
    await refreshUser();
  };

  const registerWithEmail = async (data: { name: string; email: string; password: string; phone?: string }): Promise<void> => {
    const res = await api.registerWithEmail(data);
    api.setToken(res.token);
    setUser(res.user);
    await refreshUser();
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      api.setToken(null);
      setUser(null);
      setMetaConnection(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        metaConnection,
        googleConfig,
        isLoading,
        loginWithGoogle,
        handleGoogleCredential,
        loginWithEmail,
        registerWithEmail,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
