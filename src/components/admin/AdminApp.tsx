import { createContext, lazy, Suspense, useContext, useEffect, useState, type ComponentType } from 'react';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import {
  Activity, Brush, DatabaseBackup, ExternalLink, FileText, Folder, Home, Languages, LayoutDashboard, LogOut, Megaphone, Menu,
  Navigation, Scale, Search, Settings, ShieldCheck, Users, Wrench, Tv, X,
} from 'lucide-react';
import { can, getBrowserSupabase, type AdminRole } from '../../lib/supabase/browser';
import { Alert, Spinner, ToastProvider } from './ui';

export interface AdminContext {
  sb: SupabaseClient;
  user: User;
  role: AdminRole;
}
const Ctx = createContext<AdminContext | null>(null);
export function useAdmin(): AdminContext {
  const c = useContext(Ctx);
  if (!c) throw new Error('Admin context missing');
  return c;
}

type SectionDef = { id: string; label: string; icon: ComponentType<{ className?: string }>; min: AdminRole; load: () => Promise<{ default: ComponentType }> };
const s = (name: string) => () => import('./sections').then((m) => ({ default: (m as unknown as Record<string, ComponentType>)[name] }));

export const SECTIONS: SectionDef[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, min: 'editor', load: s('Overview') },
  { id: 'tools', label: 'Tools', icon: Wrench, min: 'editor', load: () => import('./ToolsManager') },
  { id: 'categories', label: 'Categories', icon: Folder, min: 'editor', load: s('Categories') },
  { id: 'homepage', label: 'Homepage', icon: Home, min: 'editor', load: s('Homepage') },
  { id: 'pages', label: 'Pages & Content', icon: FileText, min: 'editor', load: s('Pages') },
  { id: 'seo', label: 'SEO', icon: Search, min: 'admin', load: s('Seo') },
  { id: 'navigation', label: 'Navigation', icon: Navigation, min: 'admin', load: s('NavigationSettings') },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, min: 'editor', load: s('Announcements') },
  { id: 'ads', label: 'Advertising', icon: Tv, min: 'admin', load: s('Ads') },
  { id: 'branding', label: 'Branding & Appearance', icon: Brush, min: 'admin', load: s('Branding') },
  { id: 'translations', label: 'Languages & Translations', icon: Languages, min: 'editor', load: s('Translations') },
  { id: 'legal', label: 'Legal Pages', icon: Scale, min: 'editor', load: s('LegalPages') },
  { id: 'users', label: 'Admin Users & Roles', icon: Users, min: 'editor', load: s('AdminUsers') },
  { id: 'logs', label: 'Activity Logs', icon: Activity, min: 'admin', load: s('ActivityLogs') },
  { id: 'export', label: 'Data Export & Backup', icon: DatabaseBackup, min: 'admin', load: s('ExportBackup') },
  { id: 'settings', label: 'General Settings', icon: Settings, min: 'admin', load: s('GeneralSettings') },
  { id: 'status', label: 'System Status', icon: ShieldCheck, min: 'editor', load: s('SystemStatus') },
];
const lazyCache = new Map<string, ComponentType>();
const sectionComponent = (d: SectionDef) => {
  if (!lazyCache.has(d.id)) lazyCache.set(d.id, lazy(d.load));
  return lazyCache.get(d.id)!;
};

const IDLE_MS = 30 * 60 * 1000;
/** Distinguishes a voluntary sign-out from an expired/revoked session. */
let manualLogout = false;

export default function AdminApp() {
  const sb = getBrowserSupabase();
  const [state, setState] = useState<'loading' | 'ready' | 'denied' | 'unconfigured'>(sb ? 'loading' : 'unconfigured');
  const [ctx, setCtx] = useState<AdminContext | null>(null);
  const [section, setSection] = useState(() => (typeof location !== 'undefined' ? location.hash.slice(1) : '') || 'overview');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!sb) return;
    let cancelled = false;
    (async () => {
      const { data } = await sb.auth.getSession();
      if (!data.session) return location.replace('/admin/login/');
      const aal = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal.data?.nextLevel === 'aal2' && aal.data.currentLevel !== 'aal2') return location.replace('/admin/login/');
      // Role comes from the database (RLS-protected); the UI only adapts to it.
      const { data: role, error } = await sb.rpc('current_admin_role');
      if (cancelled) return;
      if (error || !role) return setState('denied');
      setCtx({ sb, user: data.session.user, role: role as AdminRole });
      setState('ready');
    })();
    const { data: sub } = sb.auth.onAuthStateChange((evt) => {
      if (evt === 'SIGNED_OUT') location.replace(manualLogout ? '/admin/login/' : '/admin/login/?expired=1');
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [sb]);

  // Sign out automatically after inactivity.
  useEffect(() => {
    if (state !== 'ready' || !sb) return;
    let t = setTimeout(() => sb.auth.signOut(), IDLE_MS);
    const reset = () => {
      clearTimeout(t);
      t = setTimeout(() => sb.auth.signOut(), IDLE_MS);
    };
    const evs = ['pointerdown', 'keydown', 'scroll'];
    evs.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      clearTimeout(t);
      evs.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [state, sb]);

  useEffect(() => {
    const onHash = () => setSection(location.hash.slice(1) || 'overview');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (state === 'unconfigured')
    return (
      <div className="mx-auto max-w-xl p-8">
        <Alert tone="error">Supabase is not configured for this build. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY and rebuild. See docs/SETUP.md.</Alert>
      </div>
    );
  if (state === 'loading') return <Spinner label="Checking your session…" />;
  if (state === 'denied' || !ctx)
    return (
      <div className="mx-auto max-w-xl space-y-4 p-8">
        <Alert tone="error">This account is not an active administrator. Access is granted by the site owner only.</Alert>
        <button type="button" className="btn-secondary" onClick={() => sb!.auth.signOut()}>
          Sign out
        </button>
      </div>
    );

  const visible = SECTIONS.filter((x) => can(ctx.role, x.min));
  const current = visible.find((x) => x.id === section) ?? visible[0];
  const Current = sectionComponent(current);
  const logout = async () => {
    await ctx.sb.rpc('log_admin_event', { p_action: 'auth.logout', p_details: {} });
    manualLogout = true;
    await ctx.sb.auth.signOut();
  };

  return (
    <Ctx.Provider value={ctx}>
      <ToastProvider>
        <div className="flex min-h-screen">
          <aside
            className={`fixed inset-y-0 start-0 z-40 w-64 shrink-0 overflow-y-auto border-e border-slate-200 bg-white p-3 transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'}`}
            aria-label="Admin navigation"
          >
            <div className="mb-4 flex items-center justify-between px-2 py-1">
              <span className="font-bold">ToolNest Admin</span>
              <button type="button" className="btn-ghost btn-sm lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <nav>
              <ul className="space-y-0.5">
                {visible.map((x) => (
                  <li key={x.id}>
                    <a
                      href={`#${x.id}`}
                      onClick={() => setMenuOpen(false)}
                      aria-current={x.id === current.id ? 'page' : undefined}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${x.id === current.id ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-700/20 dark:text-brand-200' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                    >
                      <x.icon className="size-4" aria-hidden="true" />
                      {x.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
          <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
              <button type="button" className="btn-ghost btn-sm lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
                <Menu className="size-5" aria-hidden="true" />
              </button>
              <a href="/" target="_blank" rel="noopener" className="btn-ghost btn-sm">
                <ExternalLink className="size-4" aria-hidden="true" /> View site
              </a>
              <span className="ms-auto hidden text-sm text-slate-500 sm:inline">
                {ctx.user.email} · <strong className="capitalize">{ctx.role}</strong>
              </span>
              <button type="button" className="btn-secondary btn-sm" onClick={logout}>
                <LogOut className="size-4" aria-hidden="true" /> Sign out
              </button>
            </header>
            <main className="mx-auto max-w-6xl p-4 sm:p-6">
              <Suspense fallback={<Spinner />}>
                <Current />
              </Suspense>
            </main>
          </div>
        </div>
      </ToastProvider>
    </Ctx.Provider>
  );
}
