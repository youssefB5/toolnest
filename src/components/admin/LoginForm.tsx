import { useEffect, useState } from 'react';
import { Loader2, LockKeyhole } from 'lucide-react';
import { errMsg, getBrowserSupabase } from '../../lib/supabase/browser';
import { Alert, TextField } from './ui';

/**
 * Admin sign-in (Supabase Auth, email + password, optional TOTP MFA).
 * There is no sign-up form: administrators are created by the owner.
 * Basic client-side throttling complements Supabase Auth's server rate limits.
 */
export default function LoginForm() {
  const sb = getBrowserSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'password' | 'mfa' | 'forgot'>('password');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [failures, setFailures] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const aal = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal.data?.nextLevel === 'aal2' && aal.data.currentLevel !== 'aal2') return startMfa();
      location.replace('/admin/');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!sb) {
    return (
      <Shell>
        <Alert tone="error">Supabase is not configured. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY (see docs/SETUP.md), then rebuild.</Alert>
      </Shell>
    );
  }

  async function startMfa() {
    const { data } = await sb!.auth.mfa.listFactors();
    const totp = data?.totp?.find((f) => f.status === 'verified');
    if (totp) {
      setFactorId(totp.id);
      setStep('mfa');
    } else location.replace('/admin/');
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (Date.now() < lockedUntil) return setError(`Too many attempts. Try again in ${Math.ceil((lockedUntil - Date.now()) / 1000)} s.`);
    setBusy(true);
    setError(null);
    const { error } = await sb!.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      const n = failures + 1;
      setFailures(n);
      if (n >= 5) setLockedUntil(Date.now() + Math.min(300, 15 * 2 ** (n - 5)) * 1000);
      // Generic message: do not reveal whether the account exists.
      return setError(/rate limit/i.test(error.message) ? 'Too many attempts. Please wait and try again.' : 'Invalid email or password.');
    }
    setPassword('');
    const aal = await sb!.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal.data?.nextLevel === 'aal2' && aal.data.currentLevel !== 'aal2') return startMfa();
    await sb!.rpc('log_admin_event', { p_action: 'auth.login', p_details: { mfa: false } });
    location.replace('/admin/');
  }

  async function submitMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setBusy(true);
    setError(null);
    const ch = await sb!.auth.mfa.challenge({ factorId });
    if (ch.error) {
      setBusy(false);
      return setError(errMsg(ch.error));
    }
    const v = await sb!.auth.mfa.verify({ factorId, challengeId: ch.data.id, code: code.trim() });
    setBusy(false);
    if (v.error) return setError('Invalid authentication code.');
    await sb!.rpc('log_admin_event', { p_action: 'auth.login', p_details: { mfa: true } });
    location.replace('/admin/');
  }

  async function submitForgot(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    await sb!.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/admin/reset-password/` });
    setBusy(false);
    // Same message whether or not the email exists.
    setInfo('If an administrator account exists for this email, a reset link has been sent.');
  }

  return (
    <Shell>
      {params?.get('expired') && <Alert tone="info">Your session expired. Please sign in again.</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
      {info && <Alert tone="info">{info}</Alert>}
      {step === 'password' && (
        <form onSubmit={submitPassword} className="space-y-4" noValidate>
          <TextField label="Email" type="email" value={email} onChange={setEmail} required maxLength={320} />
          <TextField label="Password" type="password" value={password} onChange={setPassword} required maxLength={200} />
          <button type="submit" className="btn-primary w-full" disabled={busy || !email || !password}>
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} Sign in
          </button>
          <button type="button" className="w-full text-center text-sm text-brand-600 hover:underline" onClick={() => (setStep('forgot'), setError(null))}>
            Forgot password?
          </button>
        </form>
      )}
      {step === 'mfa' && (
        <form onSubmit={submitMfa} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Enter the 6-digit code from your authenticator app.</p>
          <TextField label="Authentication code" value={code} onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} required mono />
          <button type="submit" className="btn-primary w-full" disabled={busy || code.length !== 6}>
            Verify
          </button>
          <button type="button" className="w-full text-sm text-slate-500 hover:underline" onClick={async () => (await sb!.auth.signOut(), setStep('password'))}>
            Use another account
          </button>
        </form>
      )}
      {step === 'forgot' && (
        <form onSubmit={submitForgot} className="space-y-4">
          <TextField label="Email" type="email" value={email} onChange={setEmail} required />
          <button type="submit" className="btn-primary w-full" disabled={busy || !email}>
            Send reset link
          </button>
          <button type="button" className="w-full text-sm text-slate-500 hover:underline" onClick={() => (setStep('password'), setInfo(null))}>
            Back to sign in
          </button>
        </form>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm space-y-4 p-6">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-brand-600 p-2 text-white">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-lg font-bold">Administration</h1>
            <p className="text-xs text-slate-500">Authorized personnel only</p>
          </div>
        </div>
        {children}
        <a href="/" className="block text-center text-xs text-slate-500 hover:underline">
          ← Back to the website
        </a>
      </div>
    </main>
  );
}
