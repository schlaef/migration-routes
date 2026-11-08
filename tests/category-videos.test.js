import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getCategoryDescriptionKey } from "../src/analyzer.js";
import {
  buildEmbedUrl,
  buildWatchUrl,
  getCategoryVideos,
  localizeText,
  normalizeVideo
} from "../src/category-videos.js";
import { parseUrlParams, DEFAULT_CONFIG } from "../src/config.js";

const VIDEO = { videoId: "abcdefghijk", start: "1:30", end: 150, title: { de: "Titel", en: "Title" } };

test("videos follow recognized categories, including German names", () => {
  const manifest = { sea: [VIDEO], desert: [{ ...VIDEO, kind: "film" }] };

  const sea = getCategoryVideos(getCategoryDescriptionKey("Meer"), manifest);
  assert.equal(sea.length, 1);
  assert.equal(sea[0].start, 90);
  assert.equal(sea[0].end, 150);
  assert.equal(sea[0].kind, "documentary");
  assert.equal(sea[0].contentWarning, true);

  assert.equal(getCategoryVideos(getCategoryDescriptionKey("Wüste"), manifest)[0].kind, "film");
  assert.deepEqual(getCategoryVideos(getCategoryDescriptionKey("Grenze"), manifest), []);
  assert.deepEqual(getCategoryVideos("other.sea", manifest), []);
  assert.deepEqual(getCategoryVideos(undefined, manifest), []);
});

test("invalid entries are skipped and bad time ranges dropped", () => {
  assert.equal(normalizeVideo({ videoId: "https://youtu.be/abcdefghijk" }), null);
  assert.equal(normalizeVideo({ videoId: "abcdefghijk", provider: "vimeo" }), null);
  assert.equal(normalizeVideo(null), null);

  const reversed = normalizeVideo({ videoId: "abcdefghijk", start: 100, end: 50 });
  assert.equal(reversed.start, 100);
  assert.equal(reversed.end, undefined);
  assert.equal(normalizeVideo({ videoId: "abcdefghijk", start: "abc" }).start, undefined);
  assert.equal(normalizeVideo({ videoId: "abcdefghijk", contentWarning: false }).contentWarning, false);
});

test("embed uses privacy-enhanced domain and clip range", () => {
  const video = normalizeVideo(VIDEO);
  const embed = new URL(buildEmbedUrl(video));
  assert.equal(embed.hostname, "www.youtube-nocookie.com");
  assert.equal(embed.pathname, "/embed/abcdefghijk");
  assert.equal(embed.searchParams.get("start"), "90");
  assert.equal(embed.searchParams.get("end"), "150");
  assert.equal(buildWatchUrl(video), "https://www.youtube.com/watch?v=abcdefghijk&t=90s");
});

test("texts can be plain strings or per-language objects", () => {
  assert.equal(localizeText("Same", "de"), "Same");
  assert.equal(localizeText({ de: "Hallo", en: "Hello" }, "de-CH"), "Hallo");
  assert.equal(localizeText({ de: "Hallo", en: "Hello" }, "it"), "Hello");
  assert.equal(localizeText(undefined, "de"), "");
});

test("videos can be switched off via URL", () => {
  assert.equal(DEFAULT_CONFIG.showVideos, true);
  assert.equal(parseUrlParams("?videos=off").showVideos, false);
  assert.equal(parseUrlParams("?videos=1").showVideos, true);
  assert.equal(parseUrlParams("?videos=maybe").showVideos, undefined);
});

test("bundled video manifest only contains embeddable entries", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../src/assets/categories/videos.json", import.meta.url), "utf8")
  );
  for (const [category, entries] of Object.entries(manifest)) {
    assert.ok(Array.isArray(entries), `${category} must be an array`);
    for (const entry of entries) {
      assert.ok(normalizeVideo(entry), `Invalid video entry in ${category}: ${JSON.stringify(entry)}`);
    }
  }
});
