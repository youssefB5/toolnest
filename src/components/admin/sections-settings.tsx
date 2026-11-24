import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DEFAULT_AD_SLOTS, DEFAULT_ADS, DEFAULT_BRANDING, DEFAULT_GENERAL, DEFAULT_SEO } from '../../lib/site/defaults';
import type { AdsSettings, Branding, GeneralSettings, NavItem, SeoSettings } from '../../lib/site/types';
import { isSafeHref } from '../../lib/security/url';
import { errMsg } from '../../lib/supabase/browser';
import { useAdmin } from './AdminApp';
import { SeoPreview } from './SeoPreview';
import { Alert, PageHeader, Panel, SelectField, Spinner, TextAreaField, TextField, Toggle, useConfirm, useToast } from './ui';

type Key = 'branding' | 'seo' | 'general' | 'ads' | 'navigation';

/** Load/save one row of site_settings, merged over defaults. */
export function useSetting<T>(key: Key, defaults: T) {
  const { sb } = useAdmin();
  const toast = useToast();
  const [value, setValue] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    sb.from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast('error', errMsg(error));
        const v = data?.value as T | undefined;
        setValue(Array.isArray(defaults) ? ((v as T) ?? defaults) : ({ ...defaults, ...(v ?? {}) } as T));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const save = useCallback(
    async (v: T) => {
      setSaving(true);
      const { error } = await sb.from('site_settings').upsert({ key, value: v });
      setSaving(false);
      if (error) {
        toast('error', errMsg(error));
        return false;
      }
      toast('success', 'Settings saved. The public site updates within about 2 minutes (cache).');
      return true;
    },
    [sb, key, toast],
  );
  return { value, setValue, save, saving };
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/* ------------------------------- SEO -------------------------------- */
export function Seo() {
  const { value: v, setValue, save, saving } = useSetting<SeoSettings>('seo', DEFAULT_SEO);
  const { confirm, dialog } = useConfirm();
  if (!v) return <Spinner />;
  const set = <K extends keyof SeoSettings>(k: K) => (x: SeoSettings[K]) => setValue({ ...v, [k]: x });
  const onSave = async () => {
    if (!v.titleTemplate.includes('%s')) return alert('The title template must contain %s.');
    if (!v.allowIndexing && !(await confirm('Disable search engine indexing for the WHOLE site?', 'Every public page will send “noindex” and robots.txt will block all crawlers. Your pages will drop out of Google. Only do this for a staging site.', { danger: true, confirmLabel: 'Yes, block indexing' }))) return;
    save(v);
  };
  return (
    <>
      {dialog}
      <PageHeader title="SEO management" description="Site-wide metadata. Per-tool SEO fields are edited in Tools; category SEO in Categories. Admin, API and auth routes are always noindex." />
      <div className="space-y-6">
        <Panel title="Defaults">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Default title" value={v.defaultTitle} onChange={set('defaultTitle')} maxLength={70} counter />
            <TextField label="Title template" value={v.titleTemplate} onChange={set('titleTemplate')} hint="%s is replaced by the page title, e.g. “%s | ToolNest”." />
          </div>
          <div className="mt-4">
            <TextAreaField label="Default meta description" value={v.defaultDescription} onChange={set('defaultDescription')} maxLength={170} counter rows={2} />
          </div>
        </Panel>
        <Panel title="Homepage (English)">
          <TextField label="Homepage title" value={v.homeTitle} onChange={set('homeTitle')} maxLength={70} counter />
          <div className="mt-4">
            <TextAreaField label="Homepage meta description" value={v.homeDescription} onChange={set('homeDescription')} maxLength={170} counter rows={2} />
          </div>
          <div className="mt-4">
            <SeoPreview title={v.homeTitle} description={v.homeDescription} path="/" />
          </div>
        </Panel>
        <Panel title="Social sharing (Open Graph / X)">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Default Open Graph image URL" value={v.ogImageUrl ?? ''} onChange={(x) => set('ogImageUrl')(x || null)} hint="1200×630 px, absolute https:// URL or a /path on this site." />
            <TextField label="X / Twitter handle" value={v.twitterHandle} onChange={set('twitterHandle')} placeholder="@toolnest" />
          </div>
          {v.ogImageUrl && !isSafeHref(v.ogImageUrl) && <Alert tone="error">The image URL is not a valid http(s) URL or site path.</Alert>}
        </Panel>
        <Panel title="Robots, sitemap & verification">
          <div className="space-y-3">
            <Toggle label="Allow search engines to index the public site" checked={v.allowIndexing} onChange={set('allowIndexing')} hint="Turning this off requires confirmation." />
            <Toggle label="Include category pages in sitemap.xml" checked={v.sitemapIncludeCategories} onChange={set('sitemapIncludeCategories')} />
            <Toggle label="Include content pages in sitemap.xml" checked={v.sitemapIncludePages} onChange={set('sitemapIncludePages')} />
            <TextField label="Google Search Console verification token" value={v.googleSiteVerification} onChange={(x) => set('googleSiteVerification')(x.replace(/[^A-Za-z0-9_-]/g, ''))} hint="Only the content value of the HTML-tag method (see docs/SEO_GUIDE.md)." />
            <p className="text-sm text-slate-500">
              Canonical URLs are generated automatically from PUBLIC_SITE_URL. Sitemap: <a className="text-brand-600 underline" href="/sitemap.xml" target="_blank" rel="noopener">/sitemap.xml</a> · Robots: <a className="text-brand-600 underline" href="/robots.txt" target="_blank" rel="noopener">/robots.txt</a>
            </p>
          </div>
        </Panel>
        <button type="button" className="btn-primary" onClick={onSave} disabled={saving}>Save SEO settings</button>
      </div>
    </>
  );
}

/* ---------------------------- Navigation ---------------------------- */
export function NavigationSettings() {
  const { value: items, setValue, save, saving } = useSetting<NavItem[]>('navigation', []);
  if (!items) return <Spinner />;
  const invalid = items.some((i) => !i.label.trim() || !isSafeHref(i.href));
  return (
    <>
      <PageHeader title="Navigation" description="Extra links shown in the header menu, after All tools / Popular / Categories (max 12)." />
      <Panel>
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="grid items-end gap-2 sm:grid-cols-[1fr_2fr_auto]">
              <TextField label="Label" value={it.label} onChange={(v) => setValue(items.map((x, j) => (j === i ? { ...x, label: v } : x)))} maxLength={30} />
              <TextField label="Link (/path or https://…)" value={it.href} onChange={(v) => setValue(items.map((x, j) => (j === i ? { ...x, href: v } : x)))} />
              <button type="button" className="btn-ghost mb-0.5 text-red-600" onClick={() => setValue(items.filter((_, j) => j !== i))} aria-label={`Remove ${it.label}`}>
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        {invalid && <div className="mt-3"><Alert tone="error">Each link needs a label and a safe URL (relative path, http or https).</Alert></div>}
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn-secondary" disabled={items.length >= 12} onClick={() => setValue([...items, { label: '', href: '/' }])}>
            <Plus className="size-4" aria-hidden="true" /> Add link
          </button>
          <button type="button" className="btn-primary" disabled={saving || invalid} onClick={() => save(items)}>Save navigation</button>
        </div>
      </Panel>
    </>
  );
}

/* ---------------------------- Advertising --------------------------- */
interface SlotRow {
  id: string;
  is_enabled: boolean;
  ad_slot_id: string | null;
  show_desktop: boolean;
  show_mobile: boolean;
  min_height: number;
  lazy_load: boolean;
  label: string;
}
export function Ads() {
  const { sb } = useAdmin();
  const toast = useToast();
  const { value: ads, setValue, save, saving } = useSetting<AdsSettings>('ads', DEFAULT_ADS);
  const [slots, setSlots] = useState<SlotRow[] | null>(null);
  const { confirm, dialog } = useConfirm();
  useEffect(() => {
    sb.from('advertisement_slots').select('*').then(({ data }) => {
      const rows = (data as SlotRow[]) ?? [];
      setSlots(DEFAULT_AD_SLOTS.map((d) => rows.find((r) => r.id === d.id) ?? { id: d.id, is_enabled: false, ad_slot_id: null, show_desktop: true, show_mobile: true, min_height: d.minHeight, lazy_load: true, label: 'Advertisement' }));
    });
  }, [sb]);
  if (!ads || !slots) return <Spinner />;
  const validClient = /^ca-pub-\d{10,20}$/.test(ads.adsenseClient);
  const saveAll = async () => {
    if (ads.enabled && !validClient) return toast('error', 'Enter your approved AdSense publisher ID (ca-pub-…) before enabling ads.');
    if (ads.enabled && !(await confirm('Enable advertising?', 'Ads will load on enabled placements after visitors consent. Update your Privacy and Cookie policies before enabling ads.', { confirmLabel: 'Enable ads' }))) return;
    const ok = await save(ads);
    if (!ok) return;
    for (const s of slots) {
      if (s.ad_slot_id && !/^\d{4,20}$/.test(s.ad_slot_id)) return toast('error', `Slot ${s.id}: the ad slot ID must contain digits only.`);
      const { error } = await sb.from('advertisement_slots').upsert({ ...s, ad_slot_id: s.ad_slot_id || null });
      if (error) return toast('error', errMsg(error));
    }
  };
  const setSlot = (i: number, p: Partial<SlotRow>) => setSlots(slots.map((s, j) => (j === i ? { ...s, ...p } : s)));
  return (
    <>
      {dialog}
      <PageHeader title="Advertisement management" description="Advertising is disabled by default. No ads, publisher IDs or custom scripts are added automatically." />
      <div className="space-y-6">
        <Alert tone="info">
          AdSense approval is decided by Google and is never guaranteed. Only real ad units from an approved account are rendered; reserved space prevents layout shifts. Deceptive placements, forced redirects or click incentives are not supported.
        </Alert>
        <Panel title="Global">
          <div className="space-y-3">
            <Toggle label="Enable advertising" checked={ads.enabled} onChange={(v) => setValue({ ...ads, enabled: v, provider: v ? 'adsense' : ads.provider })} />
            <TextField label="Google AdSense publisher ID" value={ads.adsenseClient} onChange={(v) => setValue({ ...ads, adsenseClient: v.trim() })} placeholder="ca-pub-0000000000000000" mono hint={ads.adsenseClient && !validClient ? 'Format: ca-pub- followed by digits.' : 'Leave empty until your AdSense account is approved.'} />
            <Toggle label="Require visitor consent before loading ads" checked={ads.requireConsent} onChange={(v) => setValue({ ...ads, requireConsent: v })} hint="Strongly recommended (GDPR/ePrivacy). For EEA/UK traffic Google requires a certified consent platform for personalized ads." />
          </div>
        </Panel>
        <Panel title="Placements">
          <div className="space-y-4">
            {slots.map((s, i) => (
              <div key={s.id} className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-4 dark:border-slate-800">
                <div className="sm:col-span-4 flex items-center justify-between">
                  <strong className="capitalize">{s.id} placement</strong>
                  <Toggle label="Enabled" checked={s.is_enabled} onChange={(v) => setSlot(i, { is_enabled: v })} />
                </div>
                <TextField label="Ad slot ID" value={s.ad_slot_id ?? ''} onChange={(v) => setSlot(i, { ad_slot_id: v.replace(/\D/g, '') })} mono />
                <TextField label="Reserved height (px)" type="number" value={String(s.min_height)} onChange={(v) => setSlot(i, { min_height: Math.min(600, Math.max(50, Number(v) || 50)) })} />
                <TextField label="Label" value={s.label} onChange={(v) => setSlot(i, { label: v })} maxLength={40} />
                <div className="space-y-2">
                  <Toggle label="Desktop" checked={s.show_desktop} onChange={(v) => setSlot(i, { show_desktop: v })} />
                  <Toggle label="Mobile" checked={s.show_mobile} onChange={(v) => setSlot(i, { show_mobile: v })} />
                  <Toggle label="Lazy load" checked={s.lazy_load} onChange={(v) => setSlot(i, { lazy_load: v })} />
                </div>
                <p className="text-xs text-slate-500 sm:col-span-4">
                  Status: {ads.enabled && validClient && s.is_enabled && s.ad_slot_id ? <span className="font-semibold text-emerald-600">will display</span> : <span>not displayed</span>}
                </p>
              </div>
            ))}
          </div>
        </Panel>
        <button type="button" className="btn-primary" onClick={saveAll} disabled={saving}>Save advertising settings</button>
      </div>
    </>
  );
}

/* ------------------------------ Branding ---------------------------- */
export function Branding() {
  const { value: b, setValue, save, saving } = useSetting<Branding>('branding', DEFAULT_BRANDING);
  if (!b) return <Spinner />;
  const set = <K extends keyof Branding>(k: K) => (x: Branding[K]) => setValue({ ...b, [k]: x });
  const errors = [
    !b.siteName.trim() && 'Website name is required.',
    !HEX.test(b.primaryColor) && 'Primary color must be #RRGGBB.',
    !HEX.test(b.accentColor) && 'Accent color must be #RRGGBB.',
    b.logoUrl && !isSafeHref(b.logoUrl) && 'Logo URL is not valid.',
    b.faviconUrl && !isSafeHref(b.faviconUrl) && 'Favicon URL is not valid.',
    b.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.contactEmail) && 'Contact email is not valid.',
    b.social.some((s) => !s.label.trim() || !/^https:\/\//.test(s.url)) && 'Social links need a label and an https:// URL.',
  ].filter(Boolean) as string[];
  return (
    <>
      <PageHeader title="Branding & appearance" />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Panel title="Identity">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Website name" value={b.siteName} onChange={set('siteName')} maxLength={40} required />
              <TextField label="Tagline" value={b.tagline} onChange={set('tagline')} maxLength={120} />
              <TextField label="Logo URL (square image)" value={b.logoUrl ?? ''} onChange={(v) => set('logoUrl')(v || null)} hint="Upload the file to /public or a trusted https host. Empty = built-in logo." />
              <TextField label="Favicon URL" value={b.faviconUrl ?? ''} onChange={(v) => set('faviconUrl')(v || null)} />
              <TextField label="Footer copyright holder" value={b.footerCopyright} onChange={set('footerCopyright')} maxLength={80} />
              <TextField label="Contact email (shown on the Contact page)" value={b.contactEmail} onChange={set('contactEmail')} type="email" />
            </div>
          </Panel>
          <Panel title="Colors & theme">
            <div className="grid gap-4 sm:grid-cols-3">
              {(['primaryColor', 'accentColor'] as const).map((k) => (
                <div key={k}>
                  <label className="label" htmlFor={`c-${k}`}>{k === 'primaryColor' ? 'Primary color' : 'Accent color'}</label>
                  <div className="flex gap-2">
                    <input id={`c-${k}`} type="color" value={HEX.test(b[k]) ? b[k] : '#000000'} onChange={(e) => set(k)(e.target.value)} className="h-10 w-14 rounded border" />
                    <input className="input font-mono" aria-label={`${k} hex`} value={b[k]} onChange={(e) => set(k)(e.target.value)} />
                  </div>
                </div>
              ))}
              <SelectField label="Default theme" value={b.defaultTheme} onChange={set('defaultTheme')} options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
            </div>
          </Panel>
          <Panel title="Social links">
            {b.social.map((s, i) => (
              <div key={i} className="mb-2 grid items-end gap-2 sm:grid-cols-[1fr_2fr_auto]">
                <TextField label="Label" value={s.label} onChange={(v) => set('social')(b.social.map((x, j) => (j === i ? { ...x, label: v } : x)))} />
                <TextField label="URL (https://)" value={s.url} onChange={(v) => set('social')(b.social.map((x, j) => (j === i ? { ...x, url: v } : x)))} />
                <button type="button" className="btn-ghost mb-0.5 text-red-600" aria-label="Remove link" onClick={() => set('social')(b.social.filter((_, j) => j !== i))}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            ))}
            <button type="button" className="btn-secondary btn-sm" disabled={b.social.length >= 8} onClick={() => set('social')([...b.social, { label: '', url: 'https://' }])}>
              <Plus className="size-4" aria-hidden="true" /> Add social link
            </button>
          </Panel>
          {errors.length > 0 && <Alert tone="error">{errors.join(' ')}</Alert>}
          <button type="button" className="btn-primary" disabled={saving || errors.length > 0} onClick={() => save(b)}>Save branding</button>
        </div>
        <aside aria-label="Live preview" className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">Instant preview</p>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950" style={{ ['--brand' as string]: b.primaryColor, ['--accent' as string]: b.accentColor }}>
            <div className="flex items-center gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
              {b.logoUrl && isSafeHref(b.logoUrl) ? <img src={b.logoUrl} alt="" className="size-7 rounded" /> : <span className="size-7 rounded-lg" style={{ background: b.primaryColor }} />}
              <strong>{b.siteName || 'Site name'}</strong>
            </div>
            <div className="p-4" style={{ background: `linear-gradient(to bottom, color-mix(in oklab, ${b.primaryColor} 10%, white), transparent)` }}>
              <p className="text-lg font-bold">Free online tools</p>
              <p className="text-sm text-slate-600">{b.tagline}</p>
              <button type="button" className="mt-3 rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ background: b.primaryColor }}>Primary button</button>
              <span className="ms-2 rounded-full px-2 py-0.5 text-xs text-white" style={{ background: b.accentColor }}>Accent</span>
            </div>
            <div className="border-t border-slate-200 p-3 text-xs text-slate-500 dark:border-slate-800">© {new Date().getFullYear()} {b.footerCopyright || b.siteName}</div>
          </div>
        </aside>
      </div>
    </>
  );
}

/* --------------------------- General settings ----------------------- */
export function GeneralSettings() {
  const { value: g, setValue, save, saving } = useSetting<GeneralSettings>('general', DEFAULT_GENERAL);
  if (!g) return <Spinner />;
  return (
    <>
      <PageHeader title="General settings" />
      <Panel>
        <div className="space-y-4">
          <TextField label="Maximum file size per upload (MB)" type="number" value={String(g.maxUploadMb)} onChange={(v) => setValue({ ...g, maxUploadMb: Math.min(500, Math.max(1, Math.round(Number(v) || 1))) })} hint="Files are processed on the visitor's device; very large limits may exhaust memory on phones. Default 50 MB." />
          <TextAreaField label="Site-wide notice banner (empty = hidden)" value={g.maintenanceBanner} onChange={(v) => setValue({ ...g, maintenanceBanner: v })} rows={2} maxLength={300} counter />
          <Toggle label="Show “Recently added” on the homepage" checked={g.showRecentlyAdded} onChange={(v) => setValue({ ...g, showRecentlyAdded: v })} />
          <button type="button" className="btn-primary" disabled={saving} onClick={() => save(g)}>Save</button>
        </div>
      </Panel>
    </>
  );
}
