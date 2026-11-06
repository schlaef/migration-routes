import test from "node:test";
import assert from "node:assert/strict";
import { getCategoryDescriptionKey } from "../src/analyzer.js";
import { getCategoryImages } from "../src/category-images.js";

test("category images follow the recognized sea, desert, and border categories", () => {
  const manifest = {
    sea: [{ filename: "boat.webp", caption: "Boat" }],
    desert: [{ filename: "truck.jpg", caption: "Truck" }],
    border: [{ filename: "Grenze_türkei_gr.webp", caption: "Border" }]
  };
  const imageUrls = {
    "../assets/categories/sea/boat.webp": "/assets/boat.webp",
    "../assets/categories/desert/truck.jpg": "/assets/truck.jpg",
    "../assets/categories/border/Grenze_türkei_gr.webp": "/assets/border.webp"
  };

  for (const [name, category] of [["Meer", "sea"], ["Wüste", "desert"], ["Grenze", "border"]]) {
    assert.deepEqual(getCategoryImages(getCategoryDescriptionKey(name), manifest, imageUrls), [
      { ...manifest[category][0], url: imageUrls[`../assets/categories/${category}/${manifest[category][0].filename}`] }
    ]);
  }
});

test("missing categories and image files are skipped", () => {
  const manifest = { sea: [{ filename: "missing.jpg" }], desert: [] };

  assert.deepEqual(getCategoryImages("categoryDescriptions.sea", manifest, {}), []);
  assert.deepEqual(getCategoryImages("categoryDescriptions.desert", manifest, {}), []);
  assert.deepEqual(getCategoryImages("categoryDescriptions.border", manifest, {}), []);
  assert.deepEqual(getCategoryImages("other.sea", manifest, {}), []);
  assert.deepEqual(getCategoryImages(undefined, manifest, {}), []);
});