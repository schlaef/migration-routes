import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BROWSERS, browsersInOrder, detectBrowser, supportsWebGL2 } from "../src/webgl.js";

const UA = {
  chrome: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
  firefox: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:133.0) Gecko/20100101 Firefox/133.0",
  safari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15"
};

test("detects the browser family from the user agent", () => {
  for (const [browser, ua] of Object.entries(UA)) assert.equal(detectBrowser(ua), browser);
  assert.equal(detectBrowser("SomeBot/1.0"), "other");
});

test("the current browser is listed first", () => {
  assert.deepEqual(browsersInOrder("firefox"), ["firefox", "chrome", "edge", "safari"]);
  assert.deepEqual(browsersInOrder("other"), BROWSERS);
});

test("WebGL2 support is read from a canvas context", () => {
  const doc = (context) => ({ createElement: () => ({ getContext: (type) => (type === "webgl2" ? context : null) }) });
  assert.equal(supportsWebGL2(doc({})), true);
  assert.equal(supportsWebGL2(doc(null)), false);
  assert.equal(supportsWebGL2({ createElement: () => { throw new Error("no canvas"); } }), false);
  assert.equal(supportsWebGL2(null), true, "outside a browser nothing is reported");
});

test("fixes exist for every browser in all languages", () => {
  for (const lang of ["de", "fr", "it", "en"]) {
    const webgl = JSON.parse(readFileSync(new URL(`../src/locales/${lang}/translation.json`, import.meta.url), "utf8")).webgl;
    assert.ok(webgl.title && webgl.text && webgl.general.length >= 2, `${lang}: general texts`);
    for (const browser of BROWSERS) {
      assert.ok(webgl.browsers[browser].name, `${lang}: ${browser} name`);
      assert.ok(webgl.browsers[browser].steps.length >= 3, `${lang}: ${browser} steps`);
    }
  }
});
