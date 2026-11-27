import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getCategoryDescriptionKey } from "../src/analyzer.js";
import { getCategoryImages, hasLicenceNotice } from "../src/category-images.js";

const IMAGE = {
  url: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Example.jpg",
  title: "Example",
  author: "Jane Doe",
  license: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
  caption: { de: "Beispiel", en: "Example" }
};

test("linked images follow the recognized categories, including German names", () => {
  const manifest = { sea: [IMAGE], desert: [IMAGE], border: [IMAGE] };
  for (const name of ["Meer", "Wüste", "Grenze"]) {
    assert.deepEqual(getCategoryImages(getCategoryDescriptionKey(name), manifest), [IMAGE]);
  }
  assert.deepEqual(getCategoryImages("categoryDescriptions.mountain", manifest), []);
  assert.deepEqual(getCategoryImages("other.sea", manifest), []);
  assert.deepEqual(getCategoryImages(undefined, manifest), []);
});

test("images are only linked over https and need a full licence notice", () => {
  const show = (entry) => getCategoryImages("categoryDescriptions.sea", { sea: [entry] }).length === 1;
  assert.equal(show(IMAGE), true);
  assert.equal(show({ ...IMAGE, url: undefined, filename: "boat.jpg" }), false, "local files are not supported");
  assert.equal(show({ ...IMAGE, url: "http://example.org/a.jpg" }), false);
  assert.equal(show({ ...IMAGE, author: "" }), false);
  assert.equal(show({ ...IMAGE, license: "" }), false);
  assert.equal(show({ ...IMAGE, licenseUrl: undefined }), false);
  assert.equal(show({ ...IMAGE, license: "Public domain", licenseUrl: undefined }), true);
  assert.equal(show({ ...IMAGE, sourceUrl: "javascript:alert(1)" }), false);
  assert.equal(hasLicenceNotice(null), false);
});

test("the bundled manifest only contains linked images with licence notices", () => {
  const manifest = JSON.parse(readFileSync(new URL("../src/assets/categories/manifest.json", import.meta.url), "utf8"));
  for (const [category, entries] of Object.entries(manifest)) {
    for (const entry of entries) {
      assert.ok(entry.url && !entry.filename, `${category}: images must be linked by url, not stored as files`);
      assert.equal(getCategoryImages(`categoryDescriptions.${category}`, { [category]: [entry] }).length, 1, `${category}: incomplete entry ${JSON.stringify(entry)}`);
    }
  }
});
