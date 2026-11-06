import { findObstacleLayer } from "./analyzer.js";

export const REFERENCE_LAYER_TITLES = {
  border: "Border crossing points",
  eu: "European Union"
};

export function syncReferenceLayers(map, visibility) {
  return Object.fromEntries(
    Object.entries(REFERENCE_LAYER_TITLES).map(([key, title]) => {
      const layer = findObstacleLayer(map, title);
      const matches = [layer?.title, layer?.id].some(
        (value) => value?.trim().toLowerCase() === title.toLowerCase()
      );
      if (matches) layer.visible = Boolean(visibility[key]);
      return [key, matches];
    })
  );
}