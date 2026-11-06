# Category Images

Place each image in its category folder and add an entry to that category's array in `manifest.json`. The `filename` is relative to the category folder. For example, an entry in `sea` might look like this (replace every example value):

```json
{
  "filename": "crossing.jpg",
  "sourceUrl": "https://example.com/image-page",
  "caption": "A boat at sea."
}
```

Use the page describing the original image as `sourceUrl`, not just the image file URL. A link is shown when a source URL is provided. Verify that the license permits the intended use and that any required attribution is included in the caption. The caption should describe the actual image and its context without implying it depicts a specific mapped obstacle.

Each image can have its own entry; categories without images remain empty. Captions are shown as written in every language.

The analysis panel displays images for recognized categories. Supported file types are JPG, JPEG, PNG, WebP, AVIF, and GIF. Images missing from their category folder are skipped.