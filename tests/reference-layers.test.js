import test from "node:test";
import assert from "node:assert/strict";
import {
  INITIAL_REFERENCE_LAYERS,
  getAllowedReferenceLayers,
  getHighestHelpStage,
  getIomRegionForStartingPoint,
  isStageUnlocked,
  recordHelpUse,
  syncReferenceLayers
} from "../src/reference-layers.js";
import { STARTING_POINTS } from "../src/starting-points.js";
import { parseUrlParams, DEFAULT_CONFIG } from "../src/config.js";

function iomGroup(visible = true) {
  const sublayers = ["cmr_land_routes", "cmr_sea_routes", "emr_land_routes", "emr_sea_routes", "wmr_land_routes", "wmr_sea_routes"]
    .map((title) => ({ title, visible: true }));
  return { title: "IOM_routes_2026", type: "group", visible, layers: { toArray: () => sublayers }, sublayers };
}

test("reference layers can be toggled independently without revealing obstacles", () => {
  const border = { title: "Border crossing points", visible: false };
  const eu = { title: "European Union", visible: false };
  const obstacles = { title: "Routenschwierigkeiten", visible: false };
  const map = { allLayers: { toArray: () => [border, eu, obstacles] } };

  assert.deepEqual(syncReferenceLayers(map, { border: true, eu: false }), { border: true, eu: true, iom: false });
  assert.equal(border.visible, true);
  assert.equal(eu.visible, false);
  assert.equal(obstacles.visible, false);

  syncReferenceLayers(map, { border: false, eu: true });
  assert.equal(border.visible, false);
  assert.equal(eu.visible, true);
  assert.equal(obstacles.visible, false);
});

test("missing layers and partial title matches are reported unavailable", () => {
  const unrelated = { title: "European Union statistics", visible: false };
  const map = { allLayers: { toArray: () => [unrelated] } };

  assert.deepEqual(syncReferenceLayers(map, { border: true, eu: true }), { border: false, eu: false, iom: false });
  assert.equal(unrelated.visible, false);
});

test("IOM routes saved as visible in the WebMap are hidden at start", () => {
  const group = iomGroup(true);
  const map = { allLayers: { toArray: () => [group, ...group.sublayers] } };

  assert.equal(syncReferenceLayers(map, INITIAL_REFERENCE_LAYERS).iom, true);
  assert.equal(group.visible, false);
});

test("IOM region filter shows only the matching sublayers", () => {
  const group = iomGroup(false);
  const map = { allLayers: { toArray: () => [group, ...group.sublayers] } };

  syncReferenceLayers(map, { iom: true, iomRegion: "eastern" });
  assert.equal(group.visible, true);
  assert.deepEqual(group.sublayers.filter((l) => l.visible).map((l) => l.title), ["emr_land_routes", "emr_sea_routes"]);

  syncReferenceLayers(map, { iom: true, iomRegion: "all" });
  assert.equal(group.sublayers.every((l) => l.visible), true);
});

test("starting points suggest a matching IOM region", () => {
  const byId = Object.fromEntries(STARTING_POINTS.map((p) => [p.id, p]));
  assert.equal(getIomRegionForStartingPoint(byId.afghanistan), "eastern");
  assert.equal(getIomRegionForStartingPoint(byId.syria), "eastern");
  assert.equal(getIomRegionForStartingPoint(byId.mali), "western");
  assert.equal(getIomRegionForStartingPoint(byId.niger), "central");
  assert.equal(getIomRegionForStartingPoint(byId.eritrea), "central");
  assert.equal(getIomRegionForStartingPoint(undefined), "all");
});

test("help stages: IOM unlocks after a stage 1 layer was used", () => {
  assert.equal(isStageUnlocked("border", {}), true);
  assert.equal(isStageUnlocked("iom", {}), false);

  let used = recordHelpUse({}, "eu", false);
  assert.deepEqual(used, {});
  used = recordHelpUse(used, "eu", true);
  assert.equal(isStageUnlocked("iom", used), true);
  assert.equal(getHighestHelpStage(used), 1);
  assert.equal(getHighestHelpStage(recordHelpUse(used, "iom", true)), 2);
  assert.equal(getHighestHelpStage({}), 0);
});

test("help level limits which layers are offered and is configurable by URL", () => {
  assert.deepEqual(getAllowedReferenceLayers(0), []);
  assert.deepEqual(getAllowedReferenceLayers(1), ["border", "eu"]);
  assert.deepEqual(getAllowedReferenceLayers(2), ["border", "eu", "iom"]);

  assert.equal(DEFAULT_CONFIG.helpLevel, 2);
  assert.equal(parseUrlParams("?hilfen=1").helpLevel, 1);
  assert.equal(parseUrlParams("?help=0").helpLevel, 0);
  assert.equal(parseUrlParams("?hilfen=5").helpLevel, undefined);
});

test("a single merged IOM layer is filtered by its MedRegion field", () => {
  const merged = {
    title: "IOM_routes_2026",
    type: "feature",
    visible: true,
    definitionExpression: null,
    fields: [{ name: "MedRegion" }, { name: "Mode" }]
  };
  const map = { allLayers: { toArray: () => [merged] } };

  syncReferenceLayers(map, { iom: true, iomRegion: "western" });
  assert.equal(merged.visible, true);
  assert.equal(merged.definitionExpression, "MedRegion = 'western'");

  syncReferenceLayers(map, { iom: true, iomRegion: "all" });
  assert.equal(merged.definitionExpression, null);

  const withoutField = { ...merged, fields: [{ name: "Mode" }], definitionExpression: "Mode = 'sea'" };
  syncReferenceLayers({ allLayers: { toArray: () => [withoutField] } }, { iom: true, iomRegion: "western" });
  assert.equal(withoutField.definitionExpression, "Mode = 'sea'");
});
