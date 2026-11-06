import test from "node:test";
import assert from "node:assert/strict";
import { startRouteDrawing } from "../src/route-drawing.js";

function createDrawing() {
  const handlers = new Map();
  const action = {
    on(names, handler) {
      for (const name of Array.isArray(names) ? names : [names]) handlers.set(name, handler);
    }
  };
  const draw = {
    create(type, options) {
      assert.equal(type, "polyline");
      assert.equal(options.mode, "hybrid");
      this.activeAction = action;
      return action;
    },
    reset() {
      handlers.get("destroy")();
      this.activeAction = null;
    }
  };
  const previews = [];
  const surface = { style: { cursor: "grab" } };
  const drawingStates = [];
  let keyHandler = null;
  const view = {
    spatialReference: { wkid: 3857 },
    container: { querySelector: () => surface },
    on(name, handler) {
      assert.equal(name, "key-down");
      keyHandler = handler;
      return { remove() { keyHandler = null; } };
    },
    graphics: {
      add(graphic) { previews.push(graphic); },
      remove(graphic) { previews.splice(previews.indexOf(graphic), 1); }
    }
  };
  const routes = [];
  const routesLayer = { add(graphic) { routes.push(graphic); } };
  let completed = 0;
  startRouteDrawing(draw, view, routesLayer, () => { completed += 1; }, (active) => drawingStates.push(active));
  return { handlers, previews, routes, surface, drawingStates, completed: () => completed, keyHandler: () => keyHandler };
}

test("route drawing shows only a line preview and saves the completed route", () => {
  const drawing = createDrawing();
  assert.equal(drawing.surface.style.cursor, "crosshair");
  assert.deepEqual(drawing.drawingStates, [true]);
  const vertices = [[0, 0], [1, 1]];
  drawing.handlers.get("vertex-add")({ vertices });
  assert.equal(drawing.previews.length, 1);
  assert.equal(drawing.previews[0].geometry.type, "polyline");
  assert.equal(drawing.previews[0].symbol.type, "simple-line");
  assert.equal(drawing.routes.length, 0);
  drawing.handlers.get("draw-complete")({ vertices });
  assert.equal(drawing.previews.length, 0);
  assert.equal(drawing.routes.length, 1);
  assert.equal(drawing.routes[0].geometry.type, "polyline");
  assert.deepEqual(drawing.routes[0].geometry.paths[0], vertices);
  assert.equal(drawing.completed(), 1);
  assert.equal(drawing.keyHandler(), null);
  assert.equal(drawing.surface.style.cursor, "grab");
  assert.deepEqual(drawing.drawingStates, [true, false]);
  drawing.handlers.get("destroy")();
  assert.deepEqual(drawing.drawingStates, [true, false]);
});

test("Escape cancels a drawing and removes its preview without saving a route", () => {
  const drawing = createDrawing();
  drawing.handlers.get("cursor-update")({ vertices: [[0, 0], [1, 1]] });
  let stopped = false;
  drawing.keyHandler()({ key: "Escape", stopPropagation() { stopped = true; } });
  assert.equal(drawing.previews.length, 0);
  assert.equal(drawing.routes.length, 0);
  assert.equal(drawing.completed(), 0);
  assert.equal(drawing.keyHandler(), null);
  assert.equal(stopped, true);
  assert.equal(drawing.surface.style.cursor, "grab");
  assert.deepEqual(drawing.drawingStates, [true, false]);
});

test("an incomplete drawing restores the cursor and ends the drawing state", () => {
  const drawing = createDrawing();
  drawing.handlers.get("draw-complete")({ vertices: [[0, 0]] });

  assert.equal(drawing.surface.style.cursor, "grab");
  assert.deepEqual(drawing.drawingStates, [true, false]);
  assert.equal(drawing.routes.length, 0);
  assert.equal(drawing.completed(), 0);
});

test("destroying an active drawing clears its preview and restores the cursor", () => {
  const drawing = createDrawing();
  drawing.handlers.get("cursor-update")({ vertices: [[0, 0], [1, 1]] });
  drawing.handlers.get("destroy")();

  assert.equal(drawing.previews.length, 0);
  assert.equal(drawing.surface.style.cursor, "grab");
  assert.deepEqual(drawing.drawingStates, [true, false]);
  assert.equal(drawing.keyHandler(), null);
});