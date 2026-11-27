/**
 * Sources and licences shown in the window «Licences & sources» (TULLU rule: title, author,
 * licence, link to the licence, source; plus changes). Labels such as licence names and
 * changes are translated via legal.licences.* and legal.changes.* in the locale files.
 */
import { normalizeVideo, buildWatchUrl } from "./category-videos.js";
import { WORK_ROUTES, getWorkRouteVideos } from "./work-routes.js";

export const CONTENT_LICENCE = {
  title: "Migrationsrouten – Lernangebot",
  author: "Projekt Migrationsrouten",
  license: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.de",
  sourceUrl: "https://github.com/schlaef/migration-routes"
};

export const CODE_LICENCE = {
  title: "Quellcode / source code",
  author: "Projekt Migrationsrouten",
  license: "Apache License 2.0",
  licenseUrl: "https://www.apache.org/licenses/LICENSE-2.0",
  sourceUrl: "https://github.com/schlaef/migration-routes"
};

const ESRI_MLA = "https://www.esri.com/en-us/legal/terms/full-master-agreement";
const item = (id) => `https://www.arcgis.com/home/item.html?id=${id}`;

// Maps and geodata used by the WebMap and the obstacle layer.
export const DATA_SOURCES = [
  {
    id: "basemap",
    title: "Weltkarte in Atlasdarstellung, World Hillshade, World Imagery",
    author: "Esri and data providers (see attribution on the map)",
    licenseKey: "esriTerms",
    licenseUrl: ESRI_MLA,
    sourceUrl: "https://www.arcgis.com"
  },
  {
    id: "countries",
    title: "Political Boundaries – Countries",
    author: "Esri; Garmin International, Inc.; U.S. Central Intelligence Agency (The World Factbook)",
    licenseKey: "esriTerms",
    licenseUrl: ESRI_MLA,
    sourceUrl: item("30b5ef2245cb47bdb05ca83df7fd93b5")
  },
  {
    id: "eu",
    title: "The European Union",
    author: "Esri, The European Union",
    licenseKey: "esriTerms",
    licenseUrl: ESRI_MLA,
    sourceUrl: item("81fa30361dcc4cb6b2780feec4dab150")
  },
  {
    id: "mountains",
    title: "World Mountain Ranges",
    author: "Roger Palmer (digitised and named), Esri",
    licenseKey: "educationalUse",
    sourceUrl: item("fe75afc587c3466db1253ff128a6ec4e"),
    changesKey: "obstacles"
  },
  {
    id: "deserts",
    title: "World Desert",
    author: "ArcGIS Online user anna.kp_macmillan",
    licenseKey: "notStated",
    sourceUrl: item("7673ff4f404849aaab3711f7fc717e3b"),
    changesKey: "obstacles"
  },
  {
    id: "crossings",
    title: "Border crossing points",
    author: "UNHCR",
    licenseKey: "providerTerms",
    sourceUrl: "https://gis.unhcr.org"
  },
  {
    id: "iom",
    title: "Migration routes (Displacement Tracking Matrix)",
    author: "International Organization for Migration (IOM), DTM",
    licenseKey: "providerTerms",
    sourceUrl: "https://dtm.iom.int",
    changesKey: "iom"
  },
  {
    id: "bvmn",
    title: "Pushback testimonies",
    author: "Border Violence Monitoring Network (BVMN)",
    licenseKey: "providerTerms",
    sourceUrl: "https://borderviolence.eu/our-data",
    changesKey: "bvmn"
  }
];

// Libraries the app is built with (licences as stated in their packages).
export const SOFTWARE = [
  { title: "ArcGIS Maps SDK for JavaScript, ArcGIS Map Components", author: "Esri", licenseKey: "esriTerms", licenseUrl: ESRI_MLA, sourceUrl: "https://developers.arcgis.com/javascript/" },
  { title: "Calcite Design System", author: "Esri", licenseKey: "esriTerms", licenseUrl: ESRI_MLA, sourceUrl: "https://developers.arcgis.com/calcite-design-system/" },
  { title: "React", author: "Meta Platforms, Inc. and affiliates", license: "MIT", licenseUrl: "https://opensource.org/license/mit", sourceUrl: "https://react.dev/" },
  { title: "i18next, react-i18next, i18next-browser-languagedetector", author: "i18next", license: "MIT", licenseUrl: "https://opensource.org/license/mit", sourceUrl: "https://www.i18next.com" },
  { title: "Vite", author: "VoidZero Inc. and Vite contributors", license: "MIT", licenseUrl: "https://opensource.org/license/mit", sourceUrl: "https://vite.dev" }
];

/**
 * All embedded videos (category videos and film/literature videos), for the source list.
 * Each entry: { video, context } where context names the category or work.
 * categoryVideos: the content of src/assets/categories/videos.json.
 */
export function getEmbeddedVideos(categoryVideos = {}) {
  const fromCategories = Object.entries(categoryVideos).flatMap(([category, entries]) =>
    (entries || []).map(normalizeVideo).filter(Boolean).map((video) => ({ video, context: { category } }))
  );
  const fromWorks = WORK_ROUTES.flatMap((route) => [
    ...getWorkRouteVideos(route).map((video) => ({ video, context: { workId: route.id } })),
    ...route.stations.flatMap((station) =>
      getWorkRouteVideos(route, station.id).map((video) => ({ video, context: { workId: route.id, stationId: station.id } }))
    )
  ]);
  return [...fromCategories, ...fromWorks].map((entry) => ({ ...entry, watchUrl: buildWatchUrl(entry.video) }));
}
