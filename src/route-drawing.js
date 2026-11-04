import Graphic from "@arcgis/core/Graphic.js";
import Polyline from "@arcgis/core/geometry/Polyline.js";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol.js";

export function startRouteDrawing(draw, view, routesLayer, onComplete) {
  const action = draw.create("polyline", { mode: "hybrid" });
  const symbol = new SimpleLineSymbol({ color: [255, 140, 0, 1], width: 3.5, style: "solid" });
  let preview = null;

  const clearPreview = () => {
    if (preview) view.graphics.remove(preview);
    preview = null;
  };

  const cancelHandle = view.on("key-down", (event) => {
    if (event.key === "Escape" && draw.activeAction === action) {
      event.stopPropagation();
      draw.reset();
    }
  });

  const cleanup = () => {
    clearPreview();
    cancelHandle.remove();
  };

  const makeGeometry = (vertices) => new Polyline({
    paths: [vertices],
    spatialReference: view.spatialReference
  });

  const updatePreview = ({ vertices }) => {
    if (vertices.length < 2) {
      clearPreview();
      return;
    }
    if (preview) {
      preview.geometry = makeGeometry(vertices);
    } else {
      preview = new Graphic({ geometry: makeGeometry(vertices), symbol });
      view.graphics.add(preview);
    }
  };

  action.on(["vertex-add", "vertex-remove", "cursor-update", "undo", "redo"], updatePreview);
  action.on("draw-complete", ({ vertices }) => {
    cleanup();
    if (vertices.length < 2) return;
    routesLayer.add(new Graphic({ geometry: makeGeometry(vertices), symbol }));
    onComplete();
  });
  action.on("destroy", cleanup);
}