import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SAMPLE_OBSTACLES } from "../src/sample-obstacles.js";

function getTranslationKeys(value, prefix = "") {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof entry === "object" && entry !== null
      ? getTranslationKeys(entry, path)
      : [path];
  });
}

function loadLocale(locale) {
  return JSON.parse(
    readFileSync(new URL(`../src/locales/${locale}/translation.json`, import.meta.url), "utf8")
  );
}

test("English and German translation resources define matching keys", () => {
  const englishKeys = getTranslationKeys(loadLocale("en")).sort();
  const germanKeys = getTranslationKeys(loadLocale("de")).sort();

  assert.deepEqual(germanKeys, englishKeys);
});

test("sample obstacle perspective notes have English and German translations", () => {
  for (const locale of ["en", "de"]) {
    const translations = loadLocale(locale).obstaclePerspectives;

    for (const obstacle of SAMPLE_OBSTACLES) {
      assert.equal(
        typeof translations[obstacle.id],
        "string",
        `Missing ${locale} perspective translation for ${obstacle.id}`
      );
      assert.notEqual(translations[obstacle.id].trim(), "");
    }
  }
});