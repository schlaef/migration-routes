import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { STARTING_POINTS, focusStartingPoint } from "../src/starting-points.js";

test("starting points include the requested countries and valid map coordinates", () => {
  const ids = STARTING_POINTS.map((point) => point.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ["sudan", "libya", "niger", "syria", "afghanistan", "iran"]) {
    assert.ok(ids.includes(id), `Missing ${id}`);
  }
  for (const point of STARTING_POINTS) {
    assert.ok(["africa", "east"].includes(point.region));
    assert.ok(point.coordinates[0] >= -180 && point.coordinates[0] <= 180);
    assert.ok(point.coordinates[1] >= -90 && point.coordinates[1] <= 90);
    for (const language of ["en", "de", "it", "fr"]) {
      const translations = JSON.parse(readFileSync(new URL(`../src/locales/${language}/translation.json`, import.meta.url), "utf8"));
      assert.ok(translations.startingPoints[point.id], `Missing ${language} name for ${point.id}`);
    }
  }
});

test("selecting a starting point moves the map without creating a route", () => {
  const calls = [];
  const view = { goTo: (...args) => { calls.push(args); return Promise.resolve(); } };

  assert.ok(focusStartingPoint(view, "sudan"));
  assert.deepEqual(calls, [[{ target: [30, 15], scale: 500000 }, { duration: 800 }]]);
  assert.equal(focusStartingPoint(view, "unknown"), null);
  assert.equal(focusStartingPoint(null, "sudan"), null);
  assert.equal(calls.length, 1);
});