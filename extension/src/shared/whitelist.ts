/**
 * Determine whether the current page should bypass blocking based on the
 * user's whitelist. Entries can be:
 *   - bare domains: example.com (matches example.com and any subdomain)
 *   - host + path prefix: vimeo.com/portfolios
 *   - explicit subdomains: docs.example.com
 */

export function isWhitelisted(href: string, entries: string[]): boolean {
  if (!entries || entries.length === 0) return false;
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  const pathname = url.pathname.toLowerCase();

  for (const raw of entries) {
    const entry = raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
    if (!entry) continue;

    const slash = entry.indexOf('/');
    const entryHost = slash === -1 ? entry : entry.slice(0, slash);
    const entryPath = slash === -1 ? '' : entry.slice(slash);

    const hostMatches = host === entryHost || host.endsWith('.' + entryHost);
    if (!hostMatches) continue;
    if (entryPath && !pathname.startsWith(entryPath)) continue;
    return true;
  }
  return false;
}
