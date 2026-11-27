import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { CODE_LICENCE, CONTENT_LICENCE, DATA_SOURCES, SOFTWARE, getEmbeddedVideos } from "../src/legal.js";

const https = (value) => /^https:\/\//.test(value || "");
const locale = (lang) => JSON.parse(readFileSync(new URL(`../src/locales/${lang}/translation.json`, import.meta.url), "utf8"));

test("own content is CC BY-SA 4.0 and code Apache 2.0, with licence files", () => {
  assert.equal(CONTENT_LICENCE.license, "CC BY-SA 4.0");
  assert.match(CONTENT_LICENCE.licenseUrl, /creativecommons\.org\/licenses\/by-sa\/4\.0/);
  assert.equal(CODE_LICENCE.license, "Apache License 2.0");
  assert.ok(existsSync(new URL("../LICENSE", import.meta.url)));
  assert.ok(existsSync(new URL("../LICENSE-CONTENT.md", import.meta.url)));
  assert.match(readFileSync(new URL("../LICENSE", import.meta.url), "utf8"), /Apache License\s+Version 2\.0/);
});

test("every data source and library has title, author, licence and https source (TULLU)", () => {
  for (const source of [...DATA_SOURCES, ...SOFTWARE]) {
    assert.ok(source.title && source.author, `${source.title}: title/author`);
    assert.ok(source.license || source.licenseKey, `${source.title}: licence`);
    assert.ok(https(source.sourceUrl), `${source.title}: source`);
    if (source.licenseUrl) assert.ok(https(source.licenseUrl), `${source.title}: licence link`);
  }
});

test("all embedded videos appear in the source list", () => {
  const ids = getEmbeddedVideos().map((entry) => entry.video.videoId);
  assert.ok(ids.includes("ZRY2NZp-W8M") && ids.includes("3U229vpOfJU"));
  for (const entry of getEmbeddedVideos()) assert.match(entry.watchUrl, /^https:\/\/www\.youtube\.com\/watch\?v=/);
});

test("licence keys, change keys and privacy texts exist in all languages", () => {
  for (const lang of ["de", "fr", "it", "en"]) {
    const legal = locale(lang).legal;
    for (const source of [...DATA_SOURCES, ...SOFTWARE]) {
      if (source.licenseKey) assert.ok(legal.licences[source.licenseKey], `${lang}: licences.${source.licenseKey}`);
      if (source.changesKey) assert.ok(legal.changes[source.changesKey], `${lang}: changes.${source.changesKey}`);
    }
    assert.ok(legal.licences.embedded);
    assert.ok(Array.isArray(legal.privacy.items) && legal.privacy.items.length >= 5, `${lang}: privacy items`);
    assert.ok(locale(lang).videos.embeddedNote, `${lang}: video note`);
  }
});
