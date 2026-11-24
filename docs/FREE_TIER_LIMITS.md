# Free-tier limits (verify current values — providers change them)

Figures below were valid at the time of writing; always check the official pricing pages.

## Cloudflare Workers Free

| Item | Limit |
| --- | --- |
| Requests | 100,000 / day (Worker invocations; static asset requests are free and unlimited) |
| CPU time | 10 ms per request (SSR here is light: one cached DB call per minute per isolate) |
| Worker size | 3 MB compressed |
| Static assets | 20,000 files, 25 MiB per file |
| Builds (Workers Builds) | limited build minutes per month on Free |

**When exceeded:** requests beyond the daily quota fail with an error page until the daily reset (00:00 UTC). Mitigations already in place: HTML `Cache-Control` (`s-maxage=120`), per-isolate data cache (60 s), static assets served without invoking the Worker.

## Supabase Free

| Item | Limit |
| --- | --- |
| Database | 500 MB |
| Egress | ~5 GB / month |
| Auth | 50,000 monthly active users (only admins sign in here) |
| Projects | 2 active free projects |
| **Inactivity** | Projects are **paused after ~7 days without activity**; restore from the dashboard |
| Backups | No downloadable daily backups on Free — use `supabase db dump` |

**When paused or unreachable:** the public site keeps working. `getSiteData` times out after 2.5 s, serves the last cached copy, or falls back to the built-in registry (all 60 tools published with default texts). The admin dashboard is unavailable until the project is restored. Regular admin logins or a scheduled ping keep the project active.

## Browser-side processing

Processing uses the visitor's device: large PDFs or images can exhaust memory on low-end phones. The default 50 MB per-file limit is configurable (Admin → General settings).

## Nothing paid is required

No paid APIs, plugins or subscriptions. A custom domain is optional (and may help for AdSense).
