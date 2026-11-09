# Refugee Migration Routes Analyzer

An educational web app for upper secondary schools (Gymnasium) in Switzerland. Students draw a possible
refugee route into Europe on a map. The app then checks the route against **dangers that are hidden
on the map** and gives feedback from the perspective of people on the move. Built with the
**ArcGIS Maps SDK for JavaScript**, React and Esri Calcite.

**Live app:** https://schlaef.github.io/migration-routes/ (deployed from `main`)

---

## 🎯 Educational Idea

Refugees do not have a map of the dangers ahead: border fences, pushbacks, detention camps or deadly
sea crossings are not marked anywhere. The app recreates this lack of information:

1. **Choose a starting point** (e.g. Syria, Afghanistan, Sudan, Senegal) and **draw a route** towards Europe.
2. If students need support, they can switch on **help layers in stages** (see below).
3. **Analyze the route:** the app builds a corridor around the route (default 30 km) and intersects it with an
   **invisible obstacle layer** (sea, desert, mountains, borders, detention, exploitation, …).
4. The **feedback** describes the dangers met on the way, shows images and videos per danger category and
   asks reflection questions.
5. Finally, students **compare their route with the journeys in a film and a novel**.

### Suggested sequence in class

| Step | Students | App |
|------|----------|-----|
| 0 | Form a hypothesis: draw their own route | Starting point chooser, drawing tool |
| 1 | Orientation, if needed | Help stage 1: border crossing points, European Union |
| 2 | More input, if needed | Help stage 2: real routes documented by IOM (unlocked after stage 1, filterable by region) |
| 3 | Analysis and reflection | Analysis panel: perspective, obstacles, categories with images/videos |
| 4 | Comparison with fiction and first-hand accounts | Tab "Film & literature": *Io Capitano* and *Nel mare ci sono i coccodrilli* |

The report records which help stage was used, so teachers can take it into account.

---

## ✨ Features

**For students**
- **Starting point chooser** for 17 countries of origin or transit in Africa, the Middle East and Central Asia.
- **Route drawing** with the ArcGIS `SketchViewModel` (the behaviour of the standard Sketch component, without
  its toolbar): click to add points, double-click to finish. Vertices are shown as control points, and the map
  can still be panned and zoomed while drawing. Clicking a finished route lets students move its vertices or
  delete it. Several routes are possible.
- **Scaffolded help** while drawing:
  - Stage 1: *Border crossing points* (UNHCR) and *European Union*, each with an explanation and a source link.
  - Stage 2: *Known refugee routes (IOM 2026)*, unlocked once a stage 1 layer has been used. The region
    (central, eastern, western Mediterranean) is pre-selected from the starting point.
- **Analysis panel** with route length, number of obstacles and countries crossed, and four tabs:
  - **Refugee perspective:** narratives about the realities of the journey and reflection questions.
  - **Obstacles:** the obstacles found in the corridor; hovering over one highlights it on the map.
  - **Categories:** what each danger means for people on the move, a note on **the phone as a resource**
    (where it helps and where it fails, addressing the prejudice "they all have a phone"), **images** and **videos**
    (videos load from YouTube only after a click, via `youtube-nocookie.com`, with a content warning).
  - **Film & literature:** shows the route of *Io Capitano* (Matteo Garrone, 2023) or *Nel mare ci sono i
    coccodrilli* (Fabio Geda, 2010) on the map with numbered stations, compares its dangers with the student's
    route and asks questions about the work. Each work has a trailer with a guiding question (click to load).
- **Four languages:** German, French, Italian and English (language menu in the analysis panel). Switching
  the language updates all controls, including the ArcGIS map components.

**For teachers**
- **Links with parameters** to prepare an assignment (see [Teaching parameters](#teaching-parameters)).
- **Settings dialog** (gear icon) for WebMap, corridor width and obstacle fields; saved in the browser.
- **Fallback data:** if the obstacle layer cannot be found, the app uses 14 built-in sample obstacles, so it
  stays usable without the WebMap.

---

## 🗺️ The WebMap

Default WebMap: [`5688732d6f59462c842d450b5c9bb584`](https://www.arcgis.com/home/item.html?id=5688732d6f59462c842d450b5c9bb584)
("Migrationsrouten"). The app finds layers by their **title**, so keep these titles when editing the WebMap:

| Layer title | Purpose | Notes |
|-------------|---------|-------|
| `Routenschwierigkeiten` | Hidden obstacles (polygons) | Fields: `ObstacleType` (category), `Name`, `Weight` (1–10), `Description`. The app always keeps it hidden. |
| `Political Boundaries - Countries` | Counting countries crossed | Shown as "unavailable" if missing. |
| `Border crossing points` | Help stage 1 | |
| `European Union` | Help stage 1 | |
| `IOM_routes_2026` | Help stage 2 | Hosted feature layer with field `MedRegion` (`central`, `eastern`, `western`), see [IOM route data](#-iom-route-data). |

All help layers are hidden when the app starts, even if they are saved as visible in the WebMap.

**Obstacle categories.** `ObstacleType` values are matched by German and English keywords,
e.g. `Meer`/`sea`, `Wüste`/`desert`, `Gebirge`/`mountain`, `Grenze`/`border`, `Haft`/`detention`,
`Ausbeutung`/`exploitation`, `Gesundheit`/`health`, `Gelände`/`terrain`. Each category has its own description,
images and videos. Unknown values fall back to a general description.

---

## 👩‍🏫 Teaching Parameters

Append these to the app URL to prepare a link for a class:

| Parameter | Values | Effect |
|-----------|--------|--------|
| `lang` | `de`, `fr`, `it`, `en` | Interface language (e.g. for foreign-language classes) |
| `hilfen` / `help` | `0`, `1`, `2` (default `2`) | Help while drawing: none, stage 1 only, or stages 1 and 2 |
| `werke` / `works` | `on` / `off` | Show the "Film & literature" tab |
| `videos` | `on` / `off` | Show videos in the categories tab (e.g. where YouTube is blocked) |
| `buffer` | number, e.g. `50` | Corridor width around the route |
| `unit` | `kilometers`, `miles`, `meters`, `nautical-miles` | Unit of the corridor width |

Examples:
- Italian class, without real routes: `https://schlaef.github.io/migration-routes/?lang=it&hilfen=1`
- Assessment without any help and without videos: `?hilfen=0&videos=off`

---

## ⚙️ Configuration

Defaults are in `src/config.js`. They can be overridden in the **Settings dialog** (stored in `localStorage`)
and by **URL parameters** (highest priority).

| Setting | Default | URL parameter | In settings dialog |
|---------|---------|---------------|:-:|
| `webmapId` | `5688732d6f59462c842d450b5c9bb584` | `webmap` | ✓ |
| `bufferDistance` | `30` | `buffer` | ✓ |
| `bufferUnit` | `kilometers` | `unit` | ✓ |
| `obstacleLayerTitle` | `Routenschwierigkeiten` | `layer` | ✓ |
| `weightField` | `Weight` | `weightField` | ✓ |
| `descriptionField` | `Description` | `descField` | ✓ |
| `titleField` | `Title` (falls back to `Name`) | `titleField` | |
| `categoryField` | `ObstacleType` | `categoryField` | |
| `helpLevel` | `2` | `hilfen` / `help` | |
| `showWorkRoutes` | `true` | `werke` / `works` | |
| `showVideos` | `true` | `videos` | |
| `portalUrl` | `https://www.arcgis.com` | `portalUrl` | |

---

## 🖼️ Maintaining Content

| Content | Where | How |
|---------|-------|-----|
| Images per category | `src/assets/categories/<category>/` + `manifest.json` | See [`src/assets/categories/README.md`](src/assets/categories/README.md). Use the page describing the image as source and check the licence. |
| Videos per category | `src/assets/categories/videos.json` | YouTube ID, optional start/end time, type (documentary, report, film, literature adaptation), guiding question, source, content warning. Only embed videos published by the rights holder. See the same README. |
| Film & literature routes | `src/work-routes.js` (stations, coordinates, categories, videos) + `workRoutes` in `src/locales/*/translation.json` (texts) | Station coordinates are approximate; the line connects the stations directly. Each work can have videos (e.g. a trailer, shown with the work) and each station its own clips; video titles and guiding questions are in the locale files under `workRoutes.<work>.videos.<key>`. |
| Starting points | `src/starting-points.js` + `startingPoints` in the locale files | |
| Texts and translations | `src/locales/{de,fr,it,en}/translation.json` | Tests check that all four languages have the same keys, placeholders and markup. |

---

## 🧭 IOM Route Data

Help stage 2 shows known routes around the Mediterranean from the
[IOM Displacement Tracking Matrix (DTM)](https://dtm.iom.int/). IOM publishes them as six GeoJSON files.
Their server sends no CORS headers and can be slow, so the routes are hosted as a feature layer in ArcGIS Online.
To update them:

```bash
python3 scripts/download_iom_routes.py --simplify 0.005 --precision 5
```

The script (Python standard library only) downloads the six files (central/eastern/western Mediterranean ×
land/sea), merges them into `iom_routes_2026.geojson` with readable field names and adds `MedRegion`, `Mode`
(`land`/`sea`), source and download date. `--simplify 0.005` (~500 m) reduces the file from ~12.5 MB to
~0.25 MB without a visible difference at classroom scale.

Then in ArcGIS Online: **Content → New item**, upload the file, **Add and create a hosted feature layer**, credit
"IOM Displacement Tracking Matrix (DTM)" with the download date, check IOM's terms of use, share publicly and
replace the layer titled `IOM_routes_2026` in the WebMap.

---

## 🚧 Pushback Zones (border obstacles)

Testimonies of pushbacks from the [Border Violence Monitoring Network](https://borderviolence.eu/our-data) are
points: a route across the Balkans would otherwise touch hundreds of them. The script turns them into **one
obstacle zone per border** (e.g. "Pushbacks Kroatien → Bosnien und Herzegowina"), so each border counts once:

```bash
pip install shapely pyproj numpy
```

```bash
python3 scripts/build_pushback_zones.py --since 2022-01-01 --buffer-km 15 --min-count 5
```

It reads the point layer `pushbacks` (published from the BVMN export), keeps incidents from the start date,
merges spelling variants of country names, drops points that lie outside both countries involved (mislocated),
groups by `Pushback_From` → `Pushback_To` (sea pushbacks separately), buffers the points and dissolves each
group into one (multi)polygon. Output: `pushback_zones.geojson` with `ObstacleType` = `Grenze`, `Name`,
`Weight` (by number of testimonies: <20 → 4, 20–99 → 6, 100–299 → 7, ≥300 → 8) and a short German `Description` (max. 256 characters, the field length of the obstacle layer)
based on the data (number of testimonies and people, share of reports with violence, with belongings taken
or destroyed, with asylum requested). No personal data from the testimonies is written to the output.

Then upload the GeoJSON to ArcGIS Online and **append** it to `Routenschwierigkeiten` (map `ObstacleType`,
`Name`, `Weight`, `Description`). The raw point layer is not needed by the app: keep it out of the WebMap
and set it to private, since it contains the full testimonies.

---

## 🚀 Development

Requires Node.js 22.12+ (or 20.19+), as required by Vite 8. `nvm use` selects the version in `.nvmrc`.

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

```bash
npm run build
```

`npm run preview` or `npm start` (`server.js`) serve the production build locally.

### Deployment (GitHub Pages)

The workflow `.github/workflows/pages.yml` builds and deploys the app on every push to `main` (or manually from
the **Actions** tab). It uses the base path provided by GitHub Pages, so no build settings need changing.
Pages must be set to **Settings → Pages → Source: GitHub Actions**. After a deployment, reload without cache
(Ctrl+Shift+R) if the old version still shows.

---

## 📁 Project Structure

```
├── index.html
├── server.js                    # Static server for the production build
├── scripts/
│   ├── download_iom_routes.py   # Downloads and merges the IOM route GeoJSON files
│   └── build_pushback_zones.py  # Turns BVMN pushback points into one obstacle zone per border
├── src/
│   ├── main.jsx                 # React root, Calcite/ArcGIS component registration
│   ├── App.jsx                  # App shell and state (help stages, analysis)
│   ├── i18n.js                  # Languages (de, fr, it, en) and ?lang= detection
│   ├── config.js                # Defaults, URL parameters, saved settings
│   ├── analyzer.js              # Corridor buffer, intersection, categories, feedback
│   ├── reference-layers.js      # Help layers, stages, IOM region filter
│   ├── starting-points.js       # Starting point chooser
│   ├── route-drawing.js         # Route symbol and route count for the SketchViewModel
│   ├── work-routes.js           # Routes from film and literature, comparison
│   ├── category-images.js       # Images per category
│   ├── category-videos.js       # Videos per category (embed URLs, validation)
│   ├── sample-obstacles.js      # Fallback obstacles when the WebMap layer is missing
│   ├── assets/categories/       # Images, manifest.json, videos.json
│   ├── locales/{de,fr,it,en}/   # Translations
│   └── components/
│       ├── Header.jsx           # Top bar (analyze, clear, settings, guide)
│       ├── MapContainer.jsx     # Map, drawing, analysis, highlights, work route display
│       ├── AnalysisPanel.jsx    # Side panel with metrics and tabs
│       ├── RouteHelp.jsx        # Starting point and help stages
│       ├── CategoryVideo.jsx    # Click-to-load video with content warning
│       ├── WorkRoutes.jsx       # "Film & literature" tab
│       ├── SettingsModal.jsx    # Settings dialog
│       └── GuideModal.jsx       # Educational guide
└── tests/                       # Node test runner (npm test)
```

---

## ⚠️ Known Limitations

Open points are tracked in [`BACKLOG.md`](BACKLOG.md). The most relevant ones:
- **Obstacle data:** all obstacles currently have weight 1 and no description, and there are no border,
  detention or exploitation obstacles yet. The mountain polygons cover the whole world.
- **Film & literature:** station texts and coordinates are simplified and should be checked against the works
  before use in class.
- **Videos:** `videos.json` is still empty; videos have to be selected and added.
- `src/app.js` is an unused leftover of an earlier version.

---

## 📚 Sources

- Route data: IOM Displacement Tracking Matrix (DTM), https://dtm.iom.int/
- Border crossing points: UNHCR
- Images: see the source links in `src/assets/categories/manifest.json`

## 📜 License

Apache-2.0
