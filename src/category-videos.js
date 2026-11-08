const CATEGORY_PREFIX = "categoryDescriptions.";
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
export const VIDEO_KINDS = ["documentary", "film", "literature", "report"];

function toSeconds(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? Math.floor(value) : undefined;

  const text = String(value).trim();
  if (/^\d+$/.test(text)) return Number(text);

  // Accept "m:ss" or "h:mm:ss"
  if (!/^\d+(:[0-5]\d){1,2}$/.test(text)) return undefined;
  return text.split(":").reduce((total, part) => total * 60 + Number(part), 0);
}

/**
 * Returns the text for the active language. Text can be a plain string
 * (shown in every language) or an object such as { de: "...", en: "..." }.
 */
export function localizeText(text, language = "en") {
  if (text === undefined || text === null) return "";
  if (typeof text !== "object") return String(text);

  const base = String(language).toLowerCase().split("-")[0];
  return text[language] ?? text[base] ?? text.en ?? text.de ?? Object.values(text)[0] ?? "";
}

/**
 * Builds a privacy-enhanced YouTube embed URL (youtube-nocookie.com).
 */
export function buildEmbedUrl(video) {
  const params = new URLSearchParams({ rel: "0", autoplay: "1" });
  if (video.start !== undefined) params.set("start", String(video.start));
  if (video.end !== undefined) params.set("end", String(video.end));
  return `https://www.youtube-nocookie.com/embed/${video.videoId}?${params}`;
}

/**
 * Builds a link that opens the same clip on YouTube itself.
 */
export function buildWatchUrl(video) {
  const params = new URLSearchParams({ v: video.videoId });
  if (video.start !== undefined) params.set("t", `${video.start}s`);
  return `https://www.youtube.com/watch?${params}`;
}

/**
 * Normalizes one manifest entry. Returns null for entries that cannot be embedded.
 */
export function normalizeVideo(entry) {
  if (!entry || entry.provider && entry.provider !== "youtube") return null;
  if (!YOUTUBE_ID.test(String(entry.videoId ?? ""))) return null;

  const start = toSeconds(entry.start);
  let end = toSeconds(entry.end);
  if (start !== undefined && end !== undefined && end <= start) end = undefined;

  return {
    ...entry,
    provider: "youtube",
    videoId: String(entry.videoId),
    start,
    end,
    kind: VIDEO_KINDS.includes(entry.kind) ? entry.kind : "documentary",
    contentWarning: entry.contentWarning !== false
  };
}

/**
 * Returns the embeddable videos for a category description key
 * (e.g. "categoryDescriptions.sea").
 */
export function getCategoryVideos(descriptionKey, manifest) {
  if (!descriptionKey?.startsWith(CATEGORY_PREFIX) || !manifest) return [];

  const category = descriptionKey.slice(CATEGORY_PREFIX.length);
  if (!Object.hasOwn(manifest, category) || !Array.isArray(manifest[category])) return [];

  return manifest[category].map(normalizeVideo).filter(Boolean);
}
