/**
 * Loads the Google AdSense script once, only when called (after consent),
 * and only with a syntactically valid publisher ID configured by an admin.
 */
let loaded = false;

export function initAds(client: string) {
  if (loaded || !/^ca-pub-\d{10,20}$/.test(client)) return;
  const slots = Array.from(document.querySelectorAll<HTMLElement>('ins[data-tn-ad]'));
  if (!slots.length) return;
  loaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  document.head.appendChild(s);
  const push = (el: HTMLElement) => {
    if (el.dataset.pushed) return;
    el.dataset.pushed = '1';
    const w = window as unknown as { adsbygoogle?: unknown[] };
    (w.adsbygoogle = w.adsbygoogle || []).push({});
  };
  const io =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            for (const e of entries)
              if (e.isIntersecting) {
                push(e.target as HTMLElement);
                io?.unobserve(e.target);
              }
          },
          { rootMargin: '200px' },
        )
      : null;
  for (const el of slots) {
    if (el.dataset.lazy === 'true' && io) io.observe(el);
    else push(el);
  }
}

/** When consent is not required, ads are initialized directly. */
export function autoInitAds() {
  const first = document.querySelector<HTMLElement>('ins[data-tn-ad]');
  if (first && first.dataset.requireConsent === 'false') initAds(first.getAttribute('data-ad-client') || '');
}
