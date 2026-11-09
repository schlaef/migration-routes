import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getCategoryDescriptionKey } from "../src/analyzer.js";

const CATEGORIES = ["sea", "desert", "mountain", "border", "detention", "exploitation", "health", "terrain", "general"];

test("every danger category has a phone note (helps and fails) in all languages", () => {
  for (const lang of ["en", "de", "it", "fr"]) {
    const phone = JSON.parse(readFileSync(new URL(`../src/locales/${lang}/translation.json`, import.meta.url), "utf8")).phone;
    assert.ok(phone.heading && phone.helps && phone.fails && phone.introduction, `${lang}: phone labels`);
    for (const category of CATEGORIES) {
      assert.ok(phone.categories[category]?.helps, `${lang}: ${category}.helps`);
      assert.ok(phone.categories[category]?.fails, `${lang}: ${category}.fails`);
    }
  }
});

test("categories from the obstacle layer map onto a phone note", () => {
  for (const name of ["Meer", "Desert", "Gebirge", "Grenze", "Haft", "unknown"]) {
    const key = getCategoryDescriptionKey(name).replace("categoryDescriptions.", "");
    assert.ok(CATEGORIES.includes(key), `${name} -> ${key}`);
  }
});
