import { useEffect, useId, useRef, useState } from 'react';
import { Dialog, Tabs } from '../../components/ui';
import { useAuth, useToast } from '../../app/providers';
import { api, ApiRequestError } from '../../lib/api/client';

export type AuthMode = 'signin' | 'register';

export function AuthDialog({ open, onOpenChange, initialMode = 'signin' }: { open: boolean; onOpenChange: (open: boolean) => void; initialMode?: AuthMode }) {
  const { signIn } = useAuth();
  const { pushToast } = useToast();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);
  const emailId = useId();
  const nameId = useId();
  const passwordId = useId();
  const descriptionId = useId();
  const formId = useId();

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setError(null);
    setErrorField(null);
    setSaving(false);
  }, [open, initialMode]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setErrorField(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      setErrorField('email');
      return;
    }
    if (mode === 'register' && (displayName.trim().length < 2 || displayName.trim().length > 32)) {
      setError('Display name must be 2-32 characters.');
      setErrorField('displayName');
      return;
    }
    if (mode === 'register' && (password.length < 8 || password.length > 128 || password.trim().length === 0)) {
      setError('Password must be 8-128 characters.');
      setErrorField('password');
      return;
    }
    if (mode === 'signin' && password.length === 0) {
      setError('Enter your password.');
      setErrorField('password');
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSaving(true);
    try {
      const response = mode === 'register'
        ? await api.register(email.trim(), displayName.trim(), password)
        : await api.login(email.trim(), password);
      signIn(response);
      pushToast(mode === 'register' ? 'ACCOUNT CREATED' : 'SIGNED IN', response.data.displayName);
      setPassword('');
      setError(null);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate.');
      setErrorField(err instanceof ApiRequestError ? err.field ?? null : null);
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog small auth-dialog" aria-describedby={descriptionId}>
          <div className="dialog-head">
            <span className="mono">ACCOUNT / {mode === 'register' ? 'STEP 01' : 'SIGN IN'}</span>
            <Dialog.Close className="dialog-close" aria-label="Close">×</Dialog.Close>
          </div>
          <div className="dialog-body">
            <Dialog.Title className="detail-title">{mode === 'register' ? <>MAKE IT<br />PERMANENT.</> : <>WELCOME<br />BACK.</>}</Dialog.Title>
            <Dialog.Description id={descriptionId} className="section-copy">
              {mode === 'register'
                ? 'Create an account to record progress and completions from any device. Your records live on the server, not in this browser.'
                : 'Sign in to continue your records. Your profile and completions are tied to your account.'}
            </Dialog.Description>
            <form id={formId} onSubmit={submit}>
              <Tabs.Root value={mode} onValueChange={(value) => { setMode(value as AuthMode); setError(null); setErrorField(null); }}>
                <Tabs.List className="tabs simple" aria-label="Account mode">
                  <Tabs.Trigger className="tab" value="signin">SIGN IN</Tabs.Trigger>
                  <Tabs.Trigger className="tab" value="register">CREATE ACCOUNT</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="signin">
                  <div className="field">
                    <label htmlFor={emailId}>EMAIL</label>
                    <input id={emailId} type="email" autoComplete="email" aria-invalid={errorField === 'email'} value={email} onChange={(event) => setEmail(event.target.value)} />
                    {error && errorField === 'email' ? <p className="form-error" role="alert">{error}</p> : null}
                  </div>
                  <div className="field">
                    <label htmlFor={passwordId}>PASSWORD</label>
                    <input id={passwordId} type="password" autoComplete="current-password" aria-invalid={errorField === 'password'} value={password} onChange={(event) => setPassword(event.target.value)} />
                    {error && errorField === 'password' ? <p className="form-error" role="alert">{error}</p> : null}
                  </div>
                </Tabs.Content>
                <Tabs.Content value="register">
                  <div className="field">
                    <label htmlFor={emailId}>EMAIL</label>
                    <input id={emailId} type="email" autoComplete="email" aria-invalid={errorField === 'email'} value={email} onChange={(event) => setEmail(event.target.value)} />
                    {error && errorField === 'email' ? <p className="form-error" role="alert">{error}</p> : null}
                  </div>
                  <div className="field">
                    <label htmlFor={nameId}>DISPLAY NAME</label>
                    <input id={nameId} autoComplete="nickname" maxLength={32} aria-invalid={errorField === 'displayName'} value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                    <span className="helper">{displayName.trim().length} / 32 CHARACTERS</span>
                    {error && errorField === 'displayName' ? <p className="form-error" role="alert">{error}</p> : null}
                  </div>
                  <div className="field">
                    <label htmlFor={passwordId}>PASSWORD</label>
                    <input id={passwordId} type="password" autoComplete="new-password" aria-invalid={errorField === 'password'} value={password} onChange={(event) => setPassword(event.target.value)} />
                    <span className="helper">8–128 CHARACTERS</span>
                    {error && errorField === 'password' ? <p className="form-error" role="alert">{error}</p> : null}
                  </div>
                </Tabs.Content>
              </Tabs.Root>
              <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
            </form>
            {error && !errorField ? <p className="form-error" role="alert">{error}</p> : null}
          </div>
          <div className="dialog-foot">
            <button type="submit" form={formId} className="button primary" style={{ flex: 1 }} disabled={saving}>
              {saving ? 'WORKING…' : mode === 'register' ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </button>
            <Dialog.Close className="button">CANCEL</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
