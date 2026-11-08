#!/usr/bin/env python3
"""Download the IOM DTM migration route GeoJSON files and merge them into one file.

The result can be uploaded to ArcGIS Online (Content > New item > GeoJSON) and
published as a hosted feature layer. All six source files share one schema and
contain only MultiLineString geometries in WGS84, so they merge into a single
line layer. Two fields are added so the app (and your symbology) can tell the
routes apart:

  MedRegion  central | eastern | western   (from the source file prefix cmr/emr/wmr)
  Mode       land | sea                    (from the source file)

Only the Python standard library is used.

Examples:
  python3 scripts/download_iom_routes.py
  python3 scripts/download_iom_routes.py -o iom_routes_2026.geojson --simplify 0.005 --precision 5
  python3 scripts/download_iom_routes.py --input-dir ./downloads   # use files you downloaded yourself

Data source: IOM Displacement Tracking Matrix (DTM), https://dtm.iom.int/
Check IOM's terms of use before publishing, and credit the source on the item.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE_URL = "https://dtm.iom.int/sites/g/files/tmzbdl1461/files/dtm-migration-routes/GeoJSON/"

# (file name, MedRegion, Mode)
SOURCES = [
    ("cmr_Land_Routes.geojson", "central", "land"),
    ("cmr_Sea_Routes.geojson", "central", "sea"),
    ("emr_Land_Routes.geojson", "eastern", "land"),
    ("emr_Sea_Routes.geojson", "eastern", "sea"),
    ("wmr_Land_Routes.geojson", "western", "land"),
    ("wmr_Sea_Routes.geojson", "western", "sea"),
]

# Shapefile-truncated IOM field names -> readable names. OBJECTID and SHAPE_Leng
# are renamed or dropped because ArcGIS Online creates its own.
FIELD_NAMES = {
    "OBJECTID": "IOM_ObjectID",
    "RouteID": "RouteID",
    "RouteID_Ol": "RouteID_Old",
    "Origin_Cou": "Origin_Country",
    "Origin_ISO": "Origin_ISO",
    "Origin_Loc": "Origin_Location",
    "Origin_L_1": "Origin_PCode",
    "Destinatio": "Dest_Country",
    "Destinat_1": "Dest_ISO",
    "Destinat_2": "Dest_Location",
    "Destinat_3": "Dest_PCode",
    "Modality": "Modality",
    "Status_1": "Status",
    "Status_2": "Status_2",
    "Route_Type": "Route_Type",
    "Start_Date": "Start_Date",
    "End_Date": "End_Date",
    "Frequency": "Frequency",
    "Volume": "Volume",
    "Reason": "Reason",
    "Comments": "Comments",
    "Region": "IOM_Office",
    "Route_Regi": "Route_Region",
    "Source": "Source",
    "Update_Dat": "Update_Date",
    "SHAPE_Leng": None,
}

DATE_FIELDS = {"Start_Date", "End_Date", "Update_Dat"}
# Excel/Access "zero" date used by the source as a placeholder for "no date".
NULL_DATES = {"1899-12-30", "1899-12-31", "1900-01-01"}


def fetch(url: str, retries: int = 4) -> bytes:
    # Keep Python's default User-Agent: the IOM web firewall rejects some custom ones (HTTP 403).
    request = urllib.request.Request(url)
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                return response.read()
        except (urllib.error.URLError, TimeoutError) as error:
            if attempt == retries:
                raise
            wait = 2 ** (attempt + 1)
            print(f"  {error} - retrying in {wait}s", file=sys.stderr)
            time.sleep(wait)
    raise RuntimeError("unreachable")


def load_source(name: str, input_dir: Path | None) -> dict:
    if input_dir:
        path = input_dir / name
        print(f"Reading {path}")
        return json.loads(path.read_text(encoding="utf-8"))
    url = BASE_URL + name
    print(f"Downloading {url}")
    return json.loads(fetch(url).decode("utf-8"))


def perpendicular_distance(point, start, end) -> float:
    (x, y), (x1, y1), (x2, y2) = point, start, end
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(x - x1, y - y1)
    t = max(0.0, min(1.0, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
    return math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))


def simplify_line(points: list, tolerance: float) -> list:
    """Douglas-Peucker simplification (tolerance in degrees), iterative."""
    if tolerance <= 0 or len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        first, last = stack.pop()
        max_distance, index = 0.0, None
        for i in range(first + 1, last):
            distance = perpendicular_distance(points[i], points[first], points[last])
            if distance > max_distance:
                max_distance, index = distance, i
        if index is not None and max_distance > tolerance:
            keep[index] = True
            stack.extend([(first, index), (index, last)])
    return [p for p, k in zip(points, keep) if k]


def clean_geometry(geometry: dict, tolerance: float, precision: int | None) -> dict | None:
    if not geometry or geometry.get("type") not in ("LineString", "MultiLineString"):
        return None
    lines = geometry["coordinates"] if geometry["type"] == "MultiLineString" else [geometry["coordinates"]]
    cleaned = []
    for line in lines:
        points = [[float(c[0]), float(c[1])] for c in line]  # drop Z/M values if any
        points = simplify_line(points, tolerance)
        if precision is not None:
            points = [[round(x, precision), round(y, precision)] for x, y in points]
        # remove consecutive duplicates created by rounding
        points = [p for i, p in enumerate(points) if i == 0 or p != points[i - 1]]
        if len(points) >= 2:
            cleaned.append(points)
    if not cleaned:
        return None
    return {"type": "MultiLineString", "coordinates": cleaned}


def clean_properties(properties: dict, keep_original_names: bool) -> dict:
    result = {}
    for key, value in (properties or {}).items():
        if key in DATE_FIELDS and isinstance(value, str) and value[:10] in NULL_DATES:
            value = None
        if isinstance(value, str):
            value = value.strip() or None
        if keep_original_names:
            if key != "SHAPE_Leng":
                result["IOM_ObjectID" if key == "OBJECTID" else key] = value
            continue
        new_key = FIELD_NAMES.get(key, key)
        if new_key:
            result[new_key] = value
    return result


def count_vertices(features: list) -> int:
    return sum(len(line) for f in features for line in f["geometry"]["coordinates"])


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("-o", "--output", default="iom_routes_2026.geojson", help="output GeoJSON file")
    parser.add_argument("--input-dir", type=Path, help="read the six source files from this folder instead of downloading")
    parser.add_argument("--simplify", type=float, default=0.0,
                        help="Douglas-Peucker tolerance in degrees (e.g. 0.005 ~ 500 m); default 0 = keep all vertices")
    parser.add_argument("--precision", type=int, default=None,
                        help="round coordinates to this many decimals (5 ~ 1 m); default: unchanged")
    parser.add_argument("--keep-original-names", action="store_true",
                        help="keep IOM's truncated field names instead of readable ones")
    args = parser.parse_args()

    downloaded = dt.date.today().isoformat()
    features, raw_features = [], []
    for name, region, mode in SOURCES:
        collection = load_source(name, args.input_dir)
        source_features = collection.get("features", [])
        skipped = 0
        for feature in source_features:
            geometry = clean_geometry(feature.get("geometry"), args.simplify, args.precision)
            if geometry is None:
                skipped += 1
                continue
            raw_features.append(feature)
            properties = clean_properties(feature.get("properties"), args.keep_original_names)
            properties.update({
                "MedRegion": region,
                "Mode": mode,
                "SourceFile": name,
                "SourceUrl": BASE_URL + name,
                "Downloaded": downloaded,
            })
            features.append({"type": "Feature", "properties": properties, "geometry": geometry})
        note = f", {skipped} skipped (empty or not a line)" if skipped else ""
        print(f"  {len(source_features)} features ({region}, {mode}){note}")

    if not features:
        print("No features found.", file=sys.stderr)
        return 1

    output = {
        "type": "FeatureCollection",
        "name": "IOM_routes_2026",
        "features": features,
    }
    path = Path(args.output)
    path.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    by_region = {}
    for f in features:
        key = (f["properties"]["MedRegion"], f["properties"]["Mode"])
        by_region[key] = by_region.get(key, 0) + 1
    print(f"\nWrote {len(features)} features to {path} ({path.stat().st_size / 1e6:.1f} MB)")
    print(f"Vertices: {count_vertices(raw_features)} -> {count_vertices(features)}")
    for (region, mode), count in sorted(by_region.items()):
        print(f"  {region:8} {mode:4} {count}")
    print("\nNext: ArcGIS Online > Content > New item > upload the file > 'Add and create a hosted feature layer'.")
    print("Credit: 'IOM Displacement Tracking Matrix (DTM)', downloaded " + downloaded)
    return 0


if __name__ == "__main__":
    sys.exit(main())
