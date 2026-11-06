export function getCategoryImages(descriptionKey, manifest, imageUrls) {
  const prefix = "categoryDescriptions.";
  if (!descriptionKey?.startsWith(prefix)) return [];

  const category = descriptionKey.slice(prefix.length);
  if (!Object.hasOwn(manifest, category)) return [];

  return manifest[category]
    .map((image) => ({
      ...image,
      url: imageUrls[`../assets/categories/${category}/${image.filename}`]
    }))
    .filter((image) => image.url);
}