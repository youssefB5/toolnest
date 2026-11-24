/**
 * Browser-only preferences: favorites, recently used tools, recent searches.
 * Stored in localStorage, never sent anywhere. All functions are no-ops on the server.
 */
const KEYS = {
  favorites: 'tn:favorites',
  recentTools: 'tn:recent-tools',
  recentSearches: 'tn:recent-searches',
} as const;

const MAX_RECENT = 8;

function read(key: string): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 50) : [];
  } catch {
    return [];
  }
}

function write(key: string, list: string[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('tn:storage', { detail: { key } }));
  } catch {
    /* storage full or disabled: ignore */
  }
}

export const getFavorites = () => read(KEYS.favorites);
export function toggleFavorite(id: string): boolean {
  const list = getFavorites();
  const has = list.includes(id);
  write(KEYS.favorites, has ? list.filter((x) => x !== id) : [id, ...list]);
  return !has;
}
export const isFavorite = (id: string) => getFavorites().includes(id);

export const getRecentTools = () => read(KEYS.recentTools);
export function addRecentTool(id: string) {
  write(KEYS.recentTools, [id, ...getRecentTools().filter((x) => x !== id)].slice(0, MAX_RECENT));
}

export const getRecentSearches = () => read(KEYS.recentSearches);
export function addRecentSearch(q: string) {
  const s = q.trim().slice(0, 80);
  if (s.length < 2) return;
  write(KEYS.recentSearches, [s, ...getRecentSearches().filter((x) => x !== s)].slice(0, 6));
}
export const clearRecentSearches = () => write(KEYS.recentSearches, []);
