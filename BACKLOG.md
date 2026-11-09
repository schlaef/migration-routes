# Backlog: Fixes & Enhancements

Open points for the app and its WebMap
[`5688732d6f59462c842d450b5c9bb584`](https://www.arcgis.com/home/item.html?id=5688732d6f59462c842d450b5c9bb584)
("Migrationsrouten") with the obstacle layer `Routenschwierigkeiten`
(`MigrationRoutes/FeatureServer/0`, 99 polygons). Last checked: 2026-11-09.
Completed items are removed; see the git history for what was done.

Numbers are stable IDs for reference (e.g. "see #D2"); they do not imply priority.
Priority: **High** = analysis output is misleading or broken, **Medium** = noticeably
degrades the experience, **Low** = polish.

---

## A. Obstacle data (WebMap / ArcGIS Online)

These are fixed by editing the hosted feature layer, not the code. Possible data sources for new
categories are listed in [section F](#f-data-sources-for-new-obstacle-categories).

| # | Priority | Issue | Proposed fix |
|---|----------|-------|--------------|
| D1 | High | `Weight` is `1` for all 99 obstacles, so the analysis cannot distinguish routes. | Assign severity weights 1–10 per obstacle (e.g. open sea crossings 9–10, Sahara transit 8–9, high mountain passes 5–7). |
| D2 | High | `Description` is empty for all 99 obstacles; the obstacle list shows titles only. | Write a short, sourced description per obstacle (what the danger is and who is affected). |
| D3 | High | Only `Gebirge`, `Desert` and `Meer` exist. No border, detention, exploitation, health or terrain obstacles, so those categories, their images and reflection prompts never appear. | **Border:** pushback zones per border can be generated with `scripts/build_pushback_zones.py` (BVMN data) and appended. Still missing: border fences (Evros/Meriç, Hungary–Serbia), Libyan detention centres, smuggling hubs (Agadez), border rivers (Evros, Drina, Una). See section F. |
| D4 | Medium | The 66 `Gebirge` polygons are a worldwide copy of World Mountain Ranges (Antarctica, Australia, Siberia, …), unrelated to routes into Europe. | Delete polygons outside the study area (roughly Sahel → Middle East → Europe); keep e.g. Alps, Pyrenees, Carpathians, Caucasus, Taurus, Zagros, Hindu Kush, Balkan ranges. |
| D5 | Medium | 8 `Desert` polygons, including the most route-relevant ones, have no `Name`; they appear as "Obstacle". | Fill in `Name` for all polygons (e.g. "Sahara – Niger transit corridor"). |
| D6 | Low | Only 2 `Meer` (sea) polygons. | Split into the distinct crossings (Central Mediterranean, Aegean, Strait of Gibraltar/Alborán, Atlantic route to the Canaries, English Channel) with individual weights and descriptions. |
| D7 | Low | `ObstacleType` mixes languages (`Gebirge`, `Meer` vs. `Desert`). | Use one vocabulary consistently (or a coded-value domain), e.g. `Meer`, `Wüste`, `Gebirge`, `Grenze`, `Haft`, `Ausbeutung`. |
| D9 | High | The raw `pushbacks` point layer (BVMN export) is in the WebMap, saved as visible, and public. The app shows it on the map from the start (revealing obstacles) and its pop-ups show full testimonies, nationalities and ages. It is not used by the analysis. | Remove it from the WebMap and set the item to private; use the zones from `scripts/build_pushback_zones.py` instead. |
| D8 | Low | Layer `Migrationsrouten` (`FeatureServer/1`) is in the WebMap but has 0 features. | Remove it from the WebMap, or use it (e.g. as a teacher solution layer). |

## B. Code

| # | Priority | Issue | Proposed fix |
|---|----------|-------|--------------|
| C1 | High | `src/analyzer.js` (~lines 362–375): the `hasMaritime` / `hasBorder` / `hasDetention` / `hasTerrain` checks for the narrative texts only match English keywords, so the German categories `Meer` and `Gebirge` never trigger them (`Desert` does). | Reuse `getCategoryDescriptionKey()`, which already handles German names; add tests with German category names. |
| C2 | Low | `src/config.js` sets `titleField: "Title"`, but the layer's field is `Name`. It works only through a fallback. | Change the default to `titleField: "Name"`. |
| C3 | Low | `src/app.js` (1,011 lines) is not imported anywhere; a leftover of an earlier version. | Delete it. |
| C4 | Low | Production build emits a chunk > 2 MB (mostly ArcGIS SDK). | Code-split via dynamic `import()` or configure chunking. |

## C. Content and review

| # | Priority | Issue | Proposed fix |
|---|----------|-------|--------------|
| K1 | Medium | `src/assets/categories/videos.json` is empty, so the categories show no videos yet. | Select documentary clips per category (e.g. smugglers' prices for the sea crossing), published by the rights holder (SRF, ARTE, DW, …), with start/end time and guiding question. |
| K2 | Medium | Station texts and coordinates of the film and literature routes were written from memory and kept general. | Have a teacher check them against *Io Capitano* and *Nel mare ci sono i coccodrilli*; also check the French titles. |
| K3 | Medium | Italian and French translations have not been proofread by native speakers. | Review by the language teachers. |
| K4 | Low | The trailer of *Nel mare ci sono i coccodrilli* was uploaded by a trailer channel (MovieDigger), not the rights holder; it may disappear. | Replace with an official upload if available (`src/work-routes.js`). |
| K5 | Low | Images exist only for sea, desert and border. | Add images for mountain, detention, exploitation, health and terrain, with source and licence in `manifest.json`. |
| K6 | Low | Some existing German texts use "ß" (e.g. "anschließend"), unusual for Swiss schools. | Replace with "ss" in `src/locales/de/translation.json`. |

## D. Enhancements

| # | Priority | Idea |
|---|----------|------|
| E1 | Low | Compare several sketched routes side by side (countries crossed, categories, obstacles). |
| E2 | Low | Teacher "scenario" mode: fixed start and destination via URL parameters, with a set task. |
| E3 | Low | Data-quality check at startup (all weights equal, empty descriptions, missing names) with a notice in the settings dialog, for teachers who bring their own WebMap. |
| E4 | Low | Category notes pointing to matching scenes in the works, e.g. "This danger is also shown in *Io Capitano* (station Sahara)" with a link to the "Film & literature" tab, without embedding the video twice. |

## E. The mobile phone as a resource

Input from a lecturer: prejudices such as "they're rich, they all have a phone" ignore that the phone
is the most important tool on the journey. People share warnings about dangers, controls and routes,
call home to ask for money, and use it for geolocation. The phone fits the app's core idea: it is
how people on the move make the invisible obstacles partly visible, but not reliably and not everywhere.

P1 ("the phone here" per category) is done. Recommended next: **P4** (little effort, addresses the
prejudice directly). **P2** is the
strongest didactically but needs credible, place-based content (possibly a project with a lecturer
or a class). Avoid game mechanics such as battery or credit points: the app was deliberately made
less gamified, and scoring survival would trivialise the topic.

| # | Priority | Idea | Notes |
|---|----------|------|-------|
| P2 | Medium | **Help stage "Messages on the phone":** a fictional chat feed with place-based messages from other migrants ("The river at the border has been too high since yesterday, wait!", "Police checks at the petrol station before the village", "The driver in Agadez now wants twice as much"). Not all messages are true: some are outdated, some come from smugglers. After the analysis, students see which messages matched real obstacles. | Best as a separate WebMap layer (text, location, reliability: true / outdated / false, sender) so content can be maintained without code changes. |
| P3 | Low | **"Here you have to call home" moments** in the report, e.g. "📱 Here you have to call home and ask for money" (smugglers, ransom) or "📱 Here it pays to know someone who has taken this route", plus a count of how often the phone was decisive on the route. | Needs a field such as `PhoneRole` in the obstacle layer, or a rule per category. |
| P4 | Medium | **Before/after question about the prejudice:** before drawing, "Many say: 'They all have a phone, so they can't be poor.' What do you think?"; after the analysis, the same question next to the first answer, plus "What would you have needed the phone for on your route?" | Answers stay in the browser only (no grading). Good starting point for a class discussion. |
| P5 | Low | **Phone question for the works:** "What role do phones and contacts play in the story? How would the journey have gone with or without a phone?" (*Nel mare ci sono i coccodrilli* is set in the 2000s: then vs. now). | A teacher should judge how prominent phones are in the film and the book. |

Sources for texts: UNHCR report "Connecting Refugees" (2016), Alarm Phone (alarmphone.org), InfoMigrants
(infomigrants.net). Take figures only after checking the original source.

## F. Data sources for new obstacle categories

Candidate sources for D3. Check each licence and how exact the locations are before publishing; most
point datasets need to be turned into polygons (e.g. buffers) for the obstacle layer.

| Category | Source | What it offers | Notes |
|----------|--------|----------------|-------|
| Deaths on all routes (sea, desert, border) | [IOM Missing Migrants Project](https://missingmigrants.iom.int/data), also on [HDX](https://data.humdata.org/dataset/iom-missing-migrants-project-data) | Incidents of deaths and disappearances with coordinates, CSV, updated weekly | Coordinates are often estimates. Good for weighting existing obstacles or locating dangerous stretches. |
| Border (pushbacks) | [Border Violence Monitoring Network](https://borderviolence.eu/our-data) | Open database of pushback testimonies (Balkans, Greece, …) | Locations of testimonies; check whether data can be exported and under which terms. |
| Border (fences, walls) | [Princeton: international border walls dataset](https://dss.princeton.edu/catalog/resource7658), [EPRS briefing on EU border fences (2022)](https://www.europarl.europa.eu/RegData/etudes/BRIE/2022/733692/EPRS_BRI%282022%29733692_EN.pdf), OpenStreetMap (`barrier=fence` along borders) | Geolocated border walls; list of 19 EU/Schengen border fences | No ready-made European dataset found; the EPRS list can serve as a checklist for digitising. |
| Detention | [Global Detention Project](https://www.globaldetentionproject.org/detention-centres/map-view), [Migreurop "Map of camps"](https://www.migreurop.org/article2747.html?lang=en), [GDP: immigration detention in Libya](https://www.globaldetentionproject.org/immigration-detention-in-libya) | Detention centres in Europe, North Africa and beyond (map and list) | Export not confirmed; Migreurop maps are mostly 2016 or older. |
| Exploitation / violence | [UCDP Georeferenced Event Dataset](https://ucdp.uu.se/downloads/ged/ged261.pdf) (free download), ACLED (registration and licence terms) | Geolocated conflict events, e.g. Libya, Sahel | UCDP asks for citation; licence not confirmed. Good for areas controlled by armed groups. |
| Terrain (rivers), health / cold | HydroSHEDS (HydroRIVERS), Natural Earth, ArcGIS Living Atlas (rivers, temperature, land cover) | Border rivers (Evros, Drina, Una), winter temperatures | For the "terrain" and "health" categories, e.g. cold on the Balkan route. |
| Mixed humanitarian data | [Humanitarian Data Exchange (HDX)](https://data.humdata.org/) | Camps, border crossings, IOM data per country | Search per country (Libya, Niger, Greece, Bosnia, …). |
