/**
 * Images per danger category, listed in src/assets/categories/manifest.json.
 *
 * Images are only linked, never copied into the repository: each entry needs "url", the https
 * address of the image file at its source (the image is loaded from that server, which receives the
 * viewer's IP address). Each entry also needs a licence notice following the TULLU rule (title,
 * author, licence, link to the licence, source page). Entries without them are not shown.
 */

const CATEGORY_PREFIX = "categoryDescriptions.";

// Licences that do not require a link to a licence text.
const NO_LICENCE_LINK = new Set(["public domain", "cc0", "cc0 1.0", "pd", "gemeinfrei"]);

export function isHttpsUrl(value) {
  try {
    return new URL(String(value)).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * True if an entry carries the information needed for a licence notice.
 */
export function hasLicenceNotice(image) {
  if (!image?.author || !image?.license || !isHttpsUrl(image.sourceUrl)) return false;
  const licence = String(image.license).trim().toLowerCase();
  return NO_LICENCE_LINK.has(licence) || isHttpsUrl(image.licenseUrl);
}

export function getCategoryImages(descriptionKey, manifest) {
  if (!descriptionKey?.startsWith(CATEGORY_PREFIX) || !manifest) return [];

  const category = descriptionKey.slice(CATEGORY_PREFIX.length);
  if (!Object.hasOwn(manifest, category) || !Array.isArray(manifest[category])) return [];

  return manifest[category].filter((image) => isHttpsUrl(image?.url) && hasLicenceNotice(image));
}
