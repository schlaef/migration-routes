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

test("all translation resources define the same keys as English", () => {
  const englishKeys = getTranslationKeys(loadLocale("en")).sort();
  for (const locale of ["de", "it", "fr"]) {
    assert.deepEqual(getTranslationKeys(loadLocale(locale)).sort(), englishKeys, `${locale} keys differ from en`);
  }
});

test("translations keep the same interpolation placeholders and markup", () => {
  const english = loadLocale("en");
  const lookup = (obj, path) => path.split(".").reduce((value, key) => value?.[key], obj);
  const tokens = (text) => (String(text).match(/{{\s*\w+\s*}}|<\/?\w+>/g) || []).sort();
  for (const locale of ["de", "it", "fr"]) {
    const translation = loadLocale(locale);
    for (const key of getTranslationKeys(english)) {
      assert.deepEqual(tokens(lookup(translation, key)), tokens(lookup(english, key)), `${locale}: ${key}`);
    }
  }
});

test("sample obstacle perspective notes have English and German translations", () => {
  for (const locale of ["en", "de", "it", "fr"]) {
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