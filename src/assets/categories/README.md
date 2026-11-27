# Category Images and Videos

## Images (`manifest.json`)

Images are **only linked, never copied** into the repository. Each entry points to the image file at its
source, typically Wikimedia Commons, and must carry a complete licence notice following the **TULLU rule**
(Titel, Urheber:in, Lizenz, Link zur Lizenz, Ursprungsort). The app shows the notice directly below the
image. Entries without author, licence, licence link or source page are not shown.

Use images with a free licence (Creative Commons, public domain), e.g. from Wikimedia Commons; the
[Lizenzhinweisgenerator](https://lizenzhinweisgenerator.de/) produces the notice for Commons images.

Example entry in `sea` (replace every example value):

```json
{
  "url": "https://upload.wikimedia.org/wikipedia/commons/x/xx/Example_boat.jpg",
  "title": "Rescue of migrants in the Mediterranean",
  "author": "Jane Doe",
  "license": "CC BY-SA 4.0",
  "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.de",
  "sourceUrl": "https://commons.wikimedia.org/wiki/File:Example_boat.jpg",
  "caption": { "de": "Rettung von Migrant:innen im Mittelmeer", "en": "Rescue of migrants in the Mediterranean" },
  "changes": ""
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `url` | yes | https address of the image **file** (on Commons: the link behind "Original file"). |
| `title` | recommended | Title of the work as given at the source. |
| `author` | yes | Author exactly as named at the source (also user names or organisations). |
| `license` | yes | Licence with version, e.g. `CC BY 4.0`, `CC BY-SA 4.0`, `CC0 1.0`, `Public domain`. |
| `licenseUrl` | yes, except CC0/public domain | Link to the licence text. |
| `sourceUrl` | yes | Page where the image was found (on Commons: the file description page). |
| `caption` | no | What the image shows; plain text or per language (`{ "de": "…", "en": "…" }`). The caption should not imply that the image shows a specific mapped obstacle. |
| `alt` | no | Text alternative for screen readers (defaults to the caption). |
| `changes` | if changed | What was changed, e.g. a crop. Linked images are usually unchanged. |

Privacy: a linked image is loaded from the source server, which receives the viewer's IP address. This is
mentioned in the privacy notice of the app («Licences & sources»).

## Videos (`videos.json`)

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
