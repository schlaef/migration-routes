import test from "node:test";
import assert from "node:assert/strict";
import { syncReferenceLayers } from "../src/reference-layers.js";

test("reference layers can be toggled independently without revealing obstacles", () => {
  const border = { title: "Border crossing points", visible: false };
  const eu = { title: "European Union", visible: false };
  const obstacles = { title: "Routenschwierigkeiten", visible: false };
  const map = { allLayers: { toArray: () => [border, eu, obstacles] } };

  assert.deepEqual(syncReferenceLayers(map, { border: true, eu: false }), { border: true, eu: true });
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

  assert.deepEqual(syncReferenceLayers(map, { border: true, eu: true }), { border: false, eu: false });
  assert.equal(unrelated.visible, false);
});