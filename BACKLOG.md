# Backlog: Fixes & Enhancements

Findings from querying the configured WebMap
[`5688732d6f59462c842d450b5c9bb584`](https://www.arcgis.com/home/item.html?id=5688732d6f59462c842d450b5c9bb584)
("Migrationsrouten", owner `sts4sch`) and its obstacle layer
`Routenschwierigkeiten` (`MigrationRoutes/FeatureServer/0`, 99 polygons), plus a
review of the codebase (state as of 2026-11-07).

Numbers are stable IDs for reference (e.g. "see #D2"); they do not imply priority.
Priority: **High** = analysis output is misleading or broken, **Medium** = noticeably
degrades the experience, **Low** = polish.

---

## A. Obstacle data (WebMap / ArcGIS Online)

These are fixed by editing the hosted feature layer, not the code.

| # | Priority | Issue | Proposed fix |
|---|----------|-------|--------------|
| D1 | High | `Weight` is `1` for all 99 obstacles, so total score, average and peak threat cannot distinguish routes. | Assign severity weights 1–10 per obstacle (e.g. open sea crossings 9–10, Sahara transit 8–9, high mountain passes 5–7). |
| D2 | High | `Description` is empty for all 99 obstacles; the report's obstacle list shows titles only. | Write a short, sourced description per obstacle (what the danger is and who is affected). |
| D3 | High | No border, detention or exploitation obstacles exist; those categories and their reflection prompts never appear. | Add polygons for e.g. Evros/Meriç border fence, Croatia–Bosnia pushbacks, Libyan detention centres, smuggling hubs (Agadez). Existing images in `src/assets/categories/border/` already support the border category. |
| D4 | Medium | The 66 `Gebirge` polygons are a worldwide copy of World Mountain Ranges (Antarctica, Australia, Siberia, Western Ghats, …), unrelated to routes into Europe. | Delete polygons outside the study area (roughly Sahel → Middle East → Europe), keep e.g. Alps, Pyrenees, Carpathians, Caucasus, Taurus, Zagros, Hindu Kush, Balkan ranges. |
| D5 | Medium | 8 `Desert` polygons, including the most route-relevant ones, have no `Name`; they appear as "Obstacle" in the report. | Fill in `Name` for all polygons (e.g. "Sahara – Niger transit corridor"). |
| D6 | Low | Only 2 `Meer` (sea) polygons. | Split into the distinct crossings (Central Mediterranean Libya/Tunisia → Italy, Aegean, Strait of Gibraltar/Alborán, Atlantic route to the Canaries, English Channel) with individual weights and descriptions. |
| D7 | Low | `ObstacleType` mixes languages (`Gebirge`, `Meer` vs. `Desert`). | Use one vocabulary consistently (or a coded-value domain), e.g. `Meer`, `Wüste`, `Gebirge`, `Grenze`, `Haft`, `Ausbeutung`. |
| D8 | Low | Layer `Migrationsrouten` (`FeatureServer/1`) is in the WebMap but has 0 features. | Remove it from the WebMap, or populate it (e.g. as a reference / teacher solution layer). |

## B. Code

| # | Priority | Issue | Proposed fix |
|---|----------|-------|--------------|
| C1 | High | `src/analyzer.js` (~lines 362–373): the `hasMaritime` / `hasTerrain` checks for tailored reflection texts only match English keywords, so the German categories `Meer` and `Gebirge` never trigger them (`Desert` does). | Reuse `getCategoryDescriptionKey()` (line 327), which already handles German names, instead of the separate keyword checks; add tests with German category names. |
| C2 | Low | `src/config.js` sets `titleField: "Title"`, but the layer's field is `Name`. It works only through the fallback chain in `extractObstacleAttributes`. | Change the default to `titleField: "Name"`. |
| C3 | Low | `src/app.js` (1,011 lines) is not imported anywhere; it appears to be a leftover of an earlier version. | Confirm unused and delete. |
| C4 | Low | Production build emits a chunk > 2 MB (mostly ArcGIS SDK). | Code-split via dynamic `import()` or configure `build.rolldownOptions.output` chunking. |

## C. Documentation

| # | Priority | Issue | Proposed fix |
|---|----------|-------|--------------|
| X1 | Medium | README lists WebMap ID `433c2a6b28f84737a4d538e14674724b`, which does not exist or is inaccessible; config uses `5688732d6f59462c842d450b5c9bb584`. | Update the configuration table in README. |
| X2 | Medium | README configuration table lists defaults `route-obstacles`, `weight`, `description`, `title`, `category`; actual defaults are `Routenschwierigkeiten`, `Weight`, `Description`, `Title`, `ObstacleType`. | Sync the table with `src/config.js`. |
| X3 | Low | README feature list and project structure omit newer features: start-point chooser, route help / helper reference layers, category images, `route-drawing.js`, `starting-points.js`, `reference-layers.js`, `i18n.js`, `locales/`. | Update the Features and Project Structure sections. |
| X4 | Low | No documentation of the expected obstacle layer schema for teachers building their own WebMap. | Add a section describing fields (`ObstacleType`, `Name`, `Weight`, `Description`), allowed categories and weight scale. |

## D. Enhancements

| # | Priority | Idea |
|---|----------|------|
| E1 | Medium | Add images for the empty categories in `src/assets/categories/` (mountain, detention, exploitation, health, terrain, general), with licence/attribution noted in `manifest.json`. |
| E2 | Low | Exportable / printable route report so students can hand in their analysis. |
| E3 | Low | Compare several sketched routes side by side (score, countries crossed, categories). |
| E4 | Low | Teacher "scenario" mode: fixed start and destination via URL parameters, with a set task. |
| E5 | Low | Data-quality check at startup (all weights equal, empty descriptions, missing names) with a notice in the Settings dialog, to help teachers who bring their own WebMap. |
