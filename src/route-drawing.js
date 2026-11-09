/**
 * Shared settings for drawing routes with the ArcGIS SketchViewModel
 * (the behaviour of the Sketch component without its toolbar, see MapContainer.jsx).
 */

// Orange route line, used while drawing and for finished routes.
export const ROUTE_SYMBOL_PROPERTIES = {
  color: [255, 140, 0, 1],
  width: 3.5,
  style: "solid"
};

/**
 * Number of route lines in the sketch layer.
 */
export function countRoutes(layer) {
  const graphics = layer?.graphics;
  if (!graphics) return 0;
  const list = typeof graphics.toArray === "function" ? graphics.toArray() : Array.from(graphics);
  return list.filter((graphic) => graphic?.geometry?.type === "polyline").length;
}
