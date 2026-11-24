/** Compute a CSP source hash ('sha256-…') for inline content rendered at request time. */
export async function cspSha256(content: string): Promise<`sha256-${string}`> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
  let bin = '';
  for (const b of new Uint8Array(buf)) bin += String.fromCharCode(b);
  return `sha256-${btoa(bin)}`;
}

/** Inline script that applies the saved/system theme before first paint (avoids a flash). */
export const THEME_INIT_SCRIPT =
  "(function(){try{var d=document.documentElement;var s=localStorage.getItem('tn:theme')||d.getAttribute('data-default-theme')||'system';var k=s==='dark'||(s==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);d.classList.toggle('dark',k);}catch(e){}})();";
