import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { WORK_ROUTES, compareWithAnalysis, getWorkRoute, getWorkRouteCategories, getWorkRoutePath, getWorkRouteVideos } from "../src/work-routes.js";
import { STARTING_POINTS } from "../src/starting-points.js";
import { getCategoryDescriptionKey } from "../src/analyzer.js";
import { parseUrlParams, DEFAULT_CONFIG } from "../src/config.js";

const LANGUAGES = ["en", "de", "it", "fr"];
const locale = (lang) => JSON.parse(readFileSync(new URL(`../src/locales/${lang}/translation.json`, import.meta.url), "utf8"));
const KNOWN_CATEGORIES = ["sea", "desert", "mountain", "border", "detention", "exploitation", "health", "terrain", "general"];

test("work routes have valid stations, start points and categories", () => {
  const startIds = STARTING_POINTS.map((p) => p.id);
  assert.ok(startIds.includes("senegal"));
  for (const route of WORK_ROUTES) {
    assert.ok(startIds.includes(route.startingPoint), `${route.id} start point`);
    assert.ok(route.stations.length >= 2);
    assert.equal(new Set(route.stations.map((s) => s.id)).size, route.stations.length);
    for (const station of route.stations) {
      const [lon, lat] = station.coordinates;
      assert.ok(lon >= -30 && lon <= 75 && lat >= 0 && lat <= 50, `${route.id}/${station.id} coordinates`);
      assert.ok(KNOWN_CATEGORIES.includes(station.category), `${route.id}/${station.id} category`);
      // category names must map onto the app's own category keys
      if (station.category !== "general") {
        assert.equal(getCategoryDescriptionKey(station.category), `categoryDescriptions.${station.category}`);
      }
    }
    assert.equal(getWorkRoutePath(route).length, route.stations.length);
  }
});

test("every work route has texts in all languages", () => {
  for (const lang of LANGUAGES) {
    const texts = locale(lang).workRoutes;
    for (const route of WORK_ROUTES) {
      const t = texts[route.id];
      assert.ok(t?.title && t.meta && t.summary, `${lang}: ${route.id} title/meta/summary`);
      assert.ok(Array.isArray(t.questions) && t.questions.length > 0, `${lang}: ${route.id} questions`);
      for (const station of route.stations) {
        assert.ok(t.stations?.[station.id]?.name && t.stations[station.id].text, `${lang}: ${route.id}/${station.id}`);
      }
    }
    for (const category of getWorkRouteCategories(WORK_ROUTES[0]).concat(getWorkRouteCategories(WORK_ROUTES[1]))) {
      assert.ok(texts.categories[category], `${lang}: category ${category}`);
    }
  }
});

test("comparison splits dangers into shared, work-only and own-only", () => {
  const route = getWorkRoute("ioCapitano");
  const analysis = {
    perspectiveFeedback: {
      categories: [
        { descriptionKey: getCategoryDescriptionKey("Meer") },
        { descriptionKey: getCategoryDescriptionKey("Gebirge") },
        { descriptionKey: "categoryDescriptions.general" }
      ]
    }
  };
  const result = compareWithAnalysis(route, analysis);
  assert.deepEqual(result.shared, ["sea"]);
  assert.deepEqual(result.onlyOwn, ["mountain"]);
  assert.ok(result.onlyWork.includes("desert") && result.onlyWork.includes("detention"));
  assert.ok(!result.onlyWork.includes("general"));

  assert.deepEqual(compareWithAnalysis(route, null).shared, []);
  assert.equal(getWorkRoute("unknown"), null);
});

test("work routes can be switched off via URL", () => {
  assert.equal(DEFAULT_CONFIG.showWorkRoutes, true);
  assert.equal(parseUrlParams("?werke=aus").showWorkRoutes, false);
  assert.equal(parseUrlParams("?works=on").showWorkRoutes, true);
  assert.equal(parseUrlParams("?werke=x").showWorkRoutes, undefined);
});

test("work route videos are embeddable and have texts in all languages", () => {
  for (const route of WORK_ROUTES) {
    const lists = [[route.videos, null], ...route.stations.map((station) => [station.videos, station.id])];
    for (const [videos = [], stationId] of lists) {
      const valid = getWorkRouteVideos(route, stationId);
      assert.equal(valid.length, videos.length, `${route.id}/${stationId ?? "route"}: invalid video entry`);
      for (const video of valid) {
        assert.ok(video.key, `${route.id}: video without key`);
        for (const lang of LANGUAGES) {
          const base = locale(lang).workRoutes[route.id];
          const texts = stationId ? base.stations[stationId].videos?.[video.key] : base.videos?.[video.key];
          assert.ok(texts?.title, `${lang}: ${route.id}/${stationId ?? "route"}/${video.key} title`);
        }
      }
    }
  }
  assert.equal(getWorkRouteVideos(getWorkRoute("ioCapitano"))[0].videoId, "ZRY2NZp-W8M");
  assert.equal(getWorkRouteVideos(getWorkRoute("coccodrilli"))[0].videoId, "3U229vpOfJU");
  assert.deepEqual(getWorkRouteVideos(null), []);
});
