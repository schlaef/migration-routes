import { findObstacleLayer } from "./analyzer.js";

export const REFERENCE_LAYER_TITLES = {
  border: "Border crossing points",
  eu: "European Union",
  iom: "IOM_routes_2026"
};

// Scaffolding stages: stage 1 helps orientation, stage 2 shows real routes.
export const HELP_STAGES = {
  border: 1,
  eu: 1,
  iom: 2
};

export const IOM_REGIONS = ["all", "central", "eastern", "western"];

// Sublayer title prefixes in the IOM DTM GeoJSON group (e.g. "emr_land_routes").
const IOM_REGION_PREFIXES = {
  central: "cmr_",
  eastern: "emr_",
  western: "wmr_"
};

const WESTERN_STARTING_POINTS = new Set(["mali", "burkinaFaso", "senegal", "guinea", "gambia", "morocco", "algeria"]);

export const INITIAL_REFERENCE_LAYERS = { border: false, eu: false, iom: false, iomRegion: "all" };

/**
 * Suggests which IOM route region fits a starting point.
 */
export function getIomRegionForStartingPoint(point) {
  if (!point) return "all";
  if (point.region === "east") return "eastern";
  return WESTERN_STARTING_POINTS.has(point.id) ? "western" : "central";
}

/**
 * Lists the reference layers students may use for the configured help level.
 */
export function getAllowedReferenceLayers(helpLevel = 2) {
  return Object.keys(HELP_STAGES).filter((key) => HELP_STAGES[key] <= helpLevel);
}

/**
 * Stage 2 is unlocked once a stage 1 layer has been switched on at least once.
 */
export function isStageUnlocked(key, usedHelp = {}) {
  const stage = HELP_STAGES[key];
  if (!stage || stage <= 1) return true;
  return Object.entries(HELP_STAGES).some(([other, otherStage]) => otherStage < stage && usedHelp[other]);
}

/**
 * Records which help layers have been switched on at least once.
 */
export function recordHelpUse(usedHelp, key, visible) {
  if (!visible || !Object.hasOwn(HELP_STAGES, key) || usedHelp[key]) return usedHelp;
  return { ...usedHelp, [key]: true };
}

/**
 * Highest scaffolding stage used so far (0 if no help was used).
 */
export function getHighestHelpStage(usedHelp = {}) {
  return Object.keys(usedHelp)
    .filter((key) => usedHelp[key] && HELP_STAGES[key])
    .reduce((max, key) => Math.max(max, HELP_STAGES[key]), 0);
}

function getSublayers(layer) {
  const sublayers = layer?.layers;
  if (!sublayers) return [];
  return typeof sublayers.toArray === "function" ? sublayers.toArray() : Array.from(sublayers);
}

function syncIomRegion(layer, region) {
  const prefix = IOM_REGION_PREFIXES[region];
  for (const sublayer of getSublayers(layer)) {
    const title = String(sublayer.title || sublayer.id || "").toLowerCase();
    sublayer.visible = !prefix || title.startsWith(prefix);
  }
}

export function syncReferenceLayers(map, visibility) {
  return Object.fromEntries(
    Object.entries(REFERENCE_LAYER_TITLES).map(([key, title]) => {
      const layer = findObstacleLayer(map, title);
      const matches = [layer?.title, layer?.id].some(
        (value) => value?.trim().toLowerCase() === title.toLowerCase()
      );
      if (matches) {
        // Always set visibility explicitly so layers saved as visible in the WebMap stay hidden at start.
        layer.visible = Boolean(visibility[key]);
        if (key === "iom") syncIomRegion(layer, visibility.iomRegion);
      }
      return [key, matches];
    })
  );
}
