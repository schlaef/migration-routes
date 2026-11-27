/**
 * WebGL2 check. The ArcGIS Maps SDK needs WebGL2 to draw the map; without it the map stays empty.
 */

/**
 * True if the browser can create a WebGL2 context.
 */
export function supportsWebGL2(doc = typeof document !== "undefined" ? document : null) {
  if (!doc?.createElement) return true; // not in a browser (tests, server): nothing to report
  try {
    const canvas = doc.createElement("canvas");
    const context = canvas.getContext("webgl2");
    return Boolean(context);
  } catch {
    return false;
  }
}

export const BROWSERS = ["chrome", "edge", "firefox", "safari"];

/**
 * Browser family from the user agent: "edge", "chrome", "firefox", "safari" or "other".
 * Order matters: Edge and Chrome mention "Safari", Edge mentions "Chrome".
 */
export function detectBrowser(userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "") {
  const ua = String(userAgent);
  if (/Edg(e|A|iOS)?\//.test(ua)) return "edge";
  if (/Firefox\/|FxiOS\//.test(ua)) return "firefox";
  if (/Chrome\/|CriOS\/|Chromium\//.test(ua)) return "chrome";
  if (/Safari\//.test(ua) && /Version\//.test(ua)) return "safari";
  return "other";
}

/**
 * Browsers in display order: the current one first.
 */
export function browsersInOrder(current) {
  return BROWSERS.includes(current) ? [current, ...BROWSERS.filter((b) => b !== current)] : [...BROWSERS];
}
