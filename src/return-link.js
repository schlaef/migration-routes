/**
 * Link back to a calling app (e.g. a learning platform such as kompetenzpfad.ch).
 *
 * The calling app opens the migration routes app with
 *   ?back=<url-encoded address>&backLabel=<button text>
 * and the header then shows a button that leads back there. Only http(s) addresses
 * are accepted, so a crafted link cannot run code (e.g. "javascript:").
 *
 * The link is remembered for the browser tab (sessionStorage), so it survives reloads,
 * but it is never written to the saved settings.
 */

const STORAGE_KEY = "migration_routes_return_link";
const URL_PARAMS = ["back", "returnUrl", "return"];
const LABEL_PARAMS = ["backLabel", "returnLabel"];
export const MAX_LABEL_LENGTH = 40;

/**
 * Returns a safe absolute http(s) URL, or null.
 */
export function sanitizeReturnUrl(value) {
  if (!value || typeof value !== "string") return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function sanitizeLabel(value) {
  const label = String(value || "").replace(/\s+/g, " ").trim();
  return label ? label.slice(0, MAX_LABEL_LENGTH) : null;
}

/**
 * Reads { url, label } from a query string, or null if no valid return URL is given.
 */
export function parseReturnLink(searchString = "") {
  const params = new URLSearchParams(searchString.startsWith("?") ? searchString.slice(1) : searchString);
  const rawUrl = URL_PARAMS.map((name) => params.get(name)).find(Boolean);
  const url = sanitizeReturnUrl(rawUrl);
  if (!url) return null;
  const label = sanitizeLabel(LABEL_PARAMS.map((name) => params.get(name)).find(Boolean));
  return { url, label, host: new URL(url).host };
}

function readStorage(storage) {
  try {
    const saved = JSON.parse(storage?.getItem(STORAGE_KEY) || "null");
    const url = sanitizeReturnUrl(saved?.url);
    return url ? { url, label: sanitizeLabel(saved.label), host: new URL(url).host } : null;
  } catch {
    return null;
  }
}

/**
 * The return link from the URL (remembered for the tab), or the one remembered earlier.
 */
export function getReturnLink(
  searchString = typeof window !== "undefined" ? window.location.search : "",
  storage = typeof window !== "undefined" ? window.sessionStorage : null
) {
  const fromUrl = parseReturnLink(searchString);
  if (fromUrl) {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify({ url: fromUrl.url, label: fromUrl.label }));
    } catch {
      // Storage may be unavailable (private mode); the link still works for this page view.
    }
    return fromUrl;
  }
  return readStorage(storage);
}
