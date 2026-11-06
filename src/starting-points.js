export const STARTING_POINTS = [
  { id: "sudan", region: "africa", coordinates: [30, 15] },
  { id: "southSudan", region: "africa", coordinates: [30, 7] },
  { id: "libya", region: "africa", coordinates: [18, 27] },
  { id: "niger", region: "africa", coordinates: [9, 17] },
  { id: "mali", region: "africa", coordinates: [-4, 17] },
  { id: "burkinaFaso", region: "africa", coordinates: [-1.5, 12.5] },
  { id: "chad", region: "africa", coordinates: [19, 15] },
  { id: "somalia", region: "africa", coordinates: [46, 5] },
  { id: "ethiopia", region: "africa", coordinates: [39, 9] },
  { id: "eritrea", region: "africa", coordinates: [39, 15] },
  { id: "democraticRepublicOfCongo", region: "africa", coordinates: [23, -3] },
  { id: "syria", region: "east", coordinates: [38, 35] },
  { id: "afghanistan", region: "east", coordinates: [66, 34] },
  { id: "iran", region: "east", coordinates: [53, 32] },
  { id: "iraq", region: "east", coordinates: [44, 33] },
  { id: "yemen", region: "east", coordinates: [47, 15.5] }
];

export function focusStartingPoint(view, id) {
  const point = STARTING_POINTS.find((entry) => entry.id === id);
  if (!view || !point) return null;

  return view.goTo({ target: point.coordinates, scale: 500000 }, { duration: 800 });
}