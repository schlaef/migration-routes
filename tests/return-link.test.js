import test from "node:test";
import assert from "node:assert/strict";
import { getReturnLink, parseReturnLink, sanitizeReturnUrl, MAX_LABEL_LENGTH } from "../src/return-link.js";

const KOMPETENZPFAD = "https://www.kompetenzpfad.ch/dashboard/competencies/migrationsrouten";

function memoryStorage() {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)) };
}

test("reads an encoded return URL and an optional label", () => {
  const link = parseReturnLink(`?back=${encodeURIComponent(KOMPETENZPFAD)}&backLabel=Kompetenzpfad&lang=de`);
  assert.equal(link.url, KOMPETENZPFAD);
  assert.equal(link.label, "Kompetenzpfad");
  assert.equal(link.host, "www.kompetenzpfad.ch");

  assert.equal(parseReturnLink(`?returnUrl=${encodeURIComponent(KOMPETENZPFAD)}`).label, null);
  assert.equal(parseReturnLink("?lang=de"), null);
});

test("only accepts absolute http(s) URLs", () => {
  assert.equal(sanitizeReturnUrl("javascript:alert(1)"), null);
  assert.equal(sanitizeReturnUrl("data:text/html,hi"), null);
  assert.equal(sanitizeReturnUrl("/relative/path"), null);
  assert.equal(sanitizeReturnUrl("not a url"), null);
  assert.equal(sanitizeReturnUrl("http://example.org/x"), "http://example.org/x");
  assert.equal(parseReturnLink("?back=javascript%3Aalert(1)"), null);
});

test("labels are trimmed and limited", () => {
  const long = "x".repeat(100);
  const link = parseReturnLink(`?back=${encodeURIComponent(KOMPETENZPFAD)}&backLabel=${long}`);
  assert.equal(link.label.length, MAX_LABEL_LENGTH);
});

test("the link is remembered for the tab and survives a reload without parameters", () => {
  const storage = memoryStorage();
  assert.equal(getReturnLink(`?back=${encodeURIComponent(KOMPETENZPFAD)}&backLabel=KP`, storage).url, KOMPETENZPFAD);
  const again = getReturnLink("?lang=it", storage);
  assert.equal(again.url, KOMPETENZPFAD);
  assert.equal(again.label, "KP");
  assert.equal(getReturnLink("", memoryStorage()), null);
  assert.equal(getReturnLink(`?back=${encodeURIComponent(KOMPETENZPFAD)}`, null).url, KOMPETENZPFAD);
});
