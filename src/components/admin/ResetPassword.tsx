import { useEffect, useState } from 'react';
import { errMsg, getBrowserSupabase } from '../../lib/supabase/browser';
import { Alert, TextField } from './ui';

export default function ResetPassword() {
  const sb = getBrowserSupabase();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [msg, setMsg] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);
  useEffect(() => {
    if (!sb) return;
    const { data } = sb.auth.onAuthStateChange((evt) => {
      if (evt === 'PASSWORD_RECOVERY' || evt === 'SIGNED_IN') setReady(true);
    });
    sb.auth.getSession().then(({ data }) => data.session && setReady(true));
    return () => data.subscription.unsubscribe();
  }, [sb]);
  const strongEnough = pw.length >= 12 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!strongEnough) return setMsg({ tone: 'error', text: 'Use at least 12 characters with upper- and lowercase letters and a digit.' });
    if (pw !== pw2) return setMsg({ tone: 'error', text: 'Passwords do not match.' });
    const { error } = await sb!.auth.updateUser({ password: pw });
    if (error) return setMsg({ tone: 'error', text: errMsg(error) });
    await sb!.auth.signOut();
    setMsg({ tone: 'info', text: 'Password updated. You can now sign in.' });
    setTimeout(() => location.replace('/admin/login/'), 1500);
  }
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm space-y-4 p-6">
        <h1 className="text-lg font-bold">Choose a new password</h1>
        {!sb && <Alert tone="error">Supabase is not configured.</Alert>}
        {sb && !ready && <Alert tone="info">Open this page from the link in the password reset email. The link may have expired.</Alert>}
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        {ready && (
          <form onSubmit={submit} className="space-y-4">
            <TextField label="New password" type="password" value={pw} onChange={setPw} hint="At least 12 characters, mixed case and a digit." />
            <TextField label="Confirm password" type="password" value={pw2} onChange={setPw2} />
            <button type="submit" className="btn-primary w-full">
              Update password
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
