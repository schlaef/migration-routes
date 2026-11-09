/**
 * Routes from film and literature, shown after the analysis for comparison.
 *
 * Coordinates are approximate and only meant for an overview map: the line
 * connects the stations directly and does not trace the exact path in the work.
 * Texts (titles, stations, questions) live in the locale files under
 * `workRoutes.<routeId>`.
 *
 * `category` links a station to the app's obstacle categories
 * (see getCategoryDescriptionKey in analyzer.js) so the route can be compared
 * with the student's own analysis.
 */
export const WORK_ROUTES = [
  {
    id: "ioCapitano",
    kind: "film",
    startingPoint: "senegal",
    stations: [
      { id: "dakar", coordinates: [-17.45, 14.69], category: "general" },
      { id: "mali", coordinates: [-8.0, 12.64], category: "border" },
      { id: "agadez", coordinates: [7.99, 16.97], category: "exploitation" },
      { id: "sahara", coordinates: [11.5, 22.5], category: "desert" },
      { id: "libya", coordinates: [14.43, 27.04], category: "detention" },
      { id: "tripoli", coordinates: [13.19, 32.89], category: "exploitation" },
      { id: "sea", coordinates: [14.0, 35.0], category: "sea" },
      { id: "italy", coordinates: [14.5, 36.75], category: "general" }
    ]
  },
  {
    id: "coccodrilli",
    kind: "literature",
    startingPoint: "afghanistan",
    stations: [
      { id: "ghazni", coordinates: [67.6, 33.3], category: "general" },
      { id: "quetta", coordinates: [67.0, 30.18], category: "exploitation" },
      { id: "iran", coordinates: [50.88, 34.64], category: "exploitation" },
      { id: "mountains", coordinates: [44.1, 39.4], category: "mountain" },
      { id: "istanbul", coordinates: [28.97, 41.01], category: "exploitation" },
      { id: "aegean", coordinates: [26.4, 39.1], category: "sea" },
      { id: "athens", coordinates: [23.73, 37.98], category: "exploitation" },
      { id: "ferry", coordinates: [21.73, 38.25], category: "border" },
      { id: "italy", coordinates: [12.33, 45.44], category: "general" },
      { id: "turin", coordinates: [7.69, 45.07], category: "general" }
    ]
  }
];

export function getWorkRoute(id) {
  return WORK_ROUTES.find((route) => route.id === id) || null;
}

/**
 * Polyline path ([lon, lat] pairs) through all stations of a route.
 */
export function getWorkRoutePath(route) {
  return route ? route.stations.map((station) => station.coordinates) : [];
}

/**
 * Danger categories along a work route (without "general"), in order of appearance.
 */
export function getWorkRouteCategories(route) {
  if (!route) return [];
  return [...new Set(route.stations.map((station) => station.category).filter((c) => c && c !== "general"))];
}

/**
 * Compares the danger categories of a work route with those found on the
 * student's analyzed route (analysis.perspectiveFeedback.categories[].descriptionKey).
 */
export function compareWithAnalysis(route, analysis) {
  const prefix = "categoryDescriptions.";
  const own = new Set(
    (analysis?.perspectiveFeedback?.categories || [])
      .map((category) => category.descriptionKey)
      .filter((key) => key?.startsWith(prefix))
      .map((key) => key.slice(prefix.length))
      .filter((key) => key !== "general")
  );
  const work = getWorkRouteCategories(route);

  return {
    shared: work.filter((category) => own.has(category)),
    onlyWork: work.filter((category) => !own.has(category)),
    onlyOwn: [...own].filter((category) => !work.includes(category))
  };
}
