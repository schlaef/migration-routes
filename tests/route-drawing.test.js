import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ROUTE_SYMBOL_PROPERTIES, countRoutes } from "../src/route-drawing.js";

test("countRoutes counts only polyline graphics", () => {
  const graphics = [
    { geometry: { type: "polyline" } },
    { geometry: { type: "point" } },
    { geometry: { type: "polyline" } },
    null
  ];
  assert.equal(countRoutes({ graphics: { toArray: () => graphics } }), 2);
  assert.equal(countRoutes({ graphics }), 2);
  assert.equal(countRoutes(null), 0);
});

test("route symbol is a visible solid line", () => {
  assert.equal(ROUTE_SYMBOL_PROPERTIES.style, "solid");
  assert.ok(ROUTE_SYMBOL_PROPERTIES.width >= 2);
});

test("routes are drawn with the ArcGIS SketchViewModel in click mode, without a toolbar", () => {
  const source = readFileSync(new URL("../src/components/MapContainer.jsx", import.meta.url), "utf8");
  assert.match(source, /widgets\/Sketch\/SketchViewModel/);
  assert.match(source, /create\("polyline", \{ mode: "click" \}\)/);
  assert.doesNotMatch(source, /<arcgis-sketch/);
  assert.doesNotMatch(source, /views\/draw\/Draw/);
});
