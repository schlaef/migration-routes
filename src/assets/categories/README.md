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
# Category Videos

Videos (documentary excerpts, film clips, literature adaptations) are listed per category in `videos.json`. They appear in the analysis panel's **Categories** tab below the images. Nothing is loaded from YouTube until a student clicks the play button; the embed uses the privacy-enhanced domain `youtube-nocookie.com`.

Example entry in `sea` (replace every example value):

```json
{
  "videoId": "AbCdEfGhIjK",
  "start": "12:05",
  "end": "14:30",
  "kind": "documentary",
  "title": { "de": "Was Schlepper für eine Überfahrt verlangen", "en": "What smugglers charge for a crossing" },
  "note": { "de": "Welche Rolle spielen die Schlepper, und was erfährst du über die Kosten?", "en": "What role do the smugglers play, and what do you learn about the cost?" },
  "source": "SRF Dok, 2024",
  "sourceUrl": "https://example.com/page-about-the-documentary",
  "contentWarning": true
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `videoId` | yes | The 11-character YouTube ID (the part after `v=` in the URL), not the full URL. |
| `start`, `end` | no | Clip range in seconds (`725`) or as `m:ss` / `h:mm:ss`. |
| `kind` | no | `documentary` (default), `report`, `film` or `literature`. Shown as a label so students can tell documentary and fiction apart. |
| `title`, `note`, `caption`, `source` | no | Plain text (same in every language) or an object per language (`{ "de": "...", "en": "..." }`). `note` is shown as a guiding question. |
| `sourceUrl` | no | Page describing the video or work. |
| `contentWarning` | no | Shows a warning about distressing content before loading (default `true`). `contentWarningText` overrides the default text. |

Only embed videos published by the rights holder (official trailers and clips from the distributor, broadcaster channels such as SRF, ARTE or DW). Do not upload clips yourself. Teachers can hide all videos with the URL parameter `?videos=off`, e.g. where YouTube is blocked at school.
