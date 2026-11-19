import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AccountSession } from '@shared/types';
import { Toast } from '../components/ui';
import { api, ApiRequestError } from '../lib/api/client';
import { clearLegacyGuest, clearSession, loadSession, saveSession, type StoredSession } from '../lib/auth/session';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  session: StoredSession | null;
  status: AuthStatus;
  signIn: (session: AccountSession) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() => loadSession());
  const [status, setStatus] = useState<AuthStatus>(() => (loadSession() ? 'loading' : 'anonymous'));

  useEffect(() => {
    clearLegacyGuest();
    const stored = loadSession();
    if (!stored) {
      setStatus('anonymous');
      return;
    }
    if (Date.parse(stored.expiresAt) <= Date.now()) {
      clearSession();
      setSession(null);
      setStatus('anonymous');
      return;
    }
    let cancelled = false;
    api.me(stored.token)
      .then((payload) => {
        if (cancelled) return;
        const next = { token: stored.token, expiresAt: payload.expiresAt, player: payload.data.player };
        saveSession(next);
        setSession(next);
        setStatus('authenticated');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiRequestError && error.status === 401) {
          clearSession();
          setSession(null);
          setStatus('anonymous');
          return;
        }
        setSession(stored);
        setStatus('authenticated');
      });
    return () => { cancelled = true; };
  }, []);

  const signIn = useCallback((account: AccountSession) => {
    const next = { token: account.token, expiresAt: account.expiresAt, player: account.data };
    saveSession(next);
    setSession(next);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(() => {
    const token = session?.token;
    clearSession();
    setSession(null);
    setStatus('anonymous');
    if (token) api.logout(token).catch(() => undefined);
  }, [session?.token]);

  const value = useMemo(() => ({ session, status, signIn, signOut }), [session, status, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

interface ToastMessage { id: number; title: string; body: string; }
interface ToastContextValue { pushToast: (title: string, body: string) => void; }
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const pushToast = useCallback((title: string, body: string) => {
    setMessages((current) => [...current, { id: Date.now() + Math.random(), title, body }]);
  }, []);
  const remove = useCallback((id: number) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);
  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      <Toast.Provider swipeDirection="right">
        {children}
        {messages.map((message) => (
          <Toast.Root
            key={message.id}
            className="toast"
            duration={5000}
            onOpenChange={(open) => { if (!open) remove(message.id); }}
          >
            <Toast.Title><strong>{message.title}</strong></Toast.Title>
            <Toast.Description><span>{message.body}</span></Toast.Description>
          </Toast.Root>
        ))}
        <Toast.Viewport style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 50, display: 'grid', gap: 12 }} />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}
