#!/usr/bin/env python3
"""Turn pushback testimonies into one obstacle zone per border.

Reads the pushback points (testimonies from the Border Violence Monitoring Network,
BVMN) from an ArcGIS feature layer, keeps incidents from a start date on, groups
them per border (Pushback_From -> Pushback_To, sea pushbacks separately), buffers
the points and dissolves each group into ONE (multi)polygon. The result is a
GeoJSON file that can be appended to the obstacle layer `Routenschwierigkeiten`.

Why: the app counts every obstacle polygon a route touches once. Hundreds of
testimony points on the same border would otherwise appear hundreds of times; a
dissolved zone per border appears once, and the number of testimonies goes into
`Weight` and `Description` instead.

Output fields match the obstacle layer: ObstacleType ("Grenze"), Name, Weight,
Description. Additional fields (Testimonies, People, FirstDate, LastDate, ...)
document the source and are ignored by the app. No personal data from the
testimonies (texts, nationalities, ages) is written to the output.

Requirements: Python 3.9+, shapely 2, pyproj and numpy
  pip install shapely pyproj numpy

Examples:
  python3 scripts/build_pushback_zones.py
  python3 scripts/build_pushback_zones.py --since 2022-01-01 --buffer-km 15 --min-count 5 -o pushback_zones.geojson

Then in ArcGIS Online: upload the GeoJSON, publish it (or use it directly) and
append it to `Routenschwierigkeiten` with Append (map ObstacleType, Name, Weight,
Description). Check BVMN's terms of use and credit the source.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

import numpy as np
import shapely
from pyproj import Transformer
from shapely.geometry import Point, mapping
from shapely.ops import unary_union

DEFAULT_LAYER = "https://services4.arcgis.com/9hSTcaT2vUglUGs4/arcgis/rest/services/pushbacks/FeatureServer/0"
SOURCE = "Border Violence Monitoring Network (BVMN), borderviolence.eu"

FIELDS = [
    "Pushback_From",
    "Pushback_To",
    "Maritime_Pushback",
    "Group_Size",
    "Incident_Date",
    "Types_of_Violence_Used",
    "Intention_Asylum_Expressed",
]

# German country names for the obstacle names and descriptions (the app shows them as they are).
COUNTRIES_DE = {
    "Albania": "Albanien",
    "Austria": "Österreich",
    "Bosnia": "Bosnien und Herzegowina",
    "Bulgaria": "Bulgarien",
    "Croatia": "Kroatien",
    "Germany": "Deutschland",
    "Greece": "Griechenland",
    "Hungary": "Ungarn",
    "Italy": "Italien",
    "Kosovo": "Kosovo",
    "Montenegro": "Montenegro",
    "North Macedonia": "Nordmazedonien",
    "Romania": "Rumänien",
    "Serbia": "Serbien",
    "Slovenia": "Slowenien",
    "Turkey": "Türkei",
}

# Spelling variants in the source data -> canonical name (matched in lower case, after
# normalize_country). "t√ºrkiye" is "Türkiye" with a broken character encoding.
COUNTRY_ALIASES = {
    "bosnia and herzegovina": "Bosnia",
    "bosnia & herzegovina": "Bosnia",
    "bih": "Bosnia",
    "türkiye": "Turkey",
    "türkiye (turkey)": "Turkey",
    "t√ºrkiye (turkey)": "Turkey",
    "t√ºrkiye": "Turkey",
    "macedonia": "North Macedonia",
}

# Approximate extents (lon_min, lat_min, lon_max, lat_max) used to catch mislocated points: a
# testimony point must lie within the extent of the country it was pushed from or to (plus a
# margin, which also covers coastal waters). Countries not listed here are not checked.
COUNTRY_EXTENTS = {
    "Albania": (19.2, 39.6, 21.1, 42.7),
    "Austria": (9.5, 46.4, 17.2, 49.0),
    "Bosnia": (15.7, 42.5, 19.7, 45.3),
    "Bulgaria": (22.3, 41.2, 28.7, 44.3),
    "Croatia": (13.4, 42.4, 19.5, 46.6),
    "Germany": (5.9, 47.2, 15.1, 55.1),
    "Greece": (19.3, 34.8, 29.7, 41.8),
    "Hungary": (16.1, 45.7, 22.9, 48.6),
    "Italy": (6.6, 36.6, 18.6, 47.1),
    "Kosovo": (20.0, 41.8, 21.8, 43.3),
    "Montenegro": (18.4, 41.8, 20.4, 43.6),
    "North Macedonia": (20.4, 40.8, 23.1, 42.4),
    "Romania": (20.2, 43.6, 29.8, 48.3),
    "Serbia": (18.8, 42.2, 23.1, 46.2),
    "Slovenia": (13.3, 45.4, 16.6, 46.9),
    "Turkey": (25.6, 35.8, 44.9, 42.2),
}
EXTENT_MARGIN_DEG = 0.3

# German preposition for "to <country>" ("nach Kroatien", but "in die Türkei").
COUNTRIES_DE_TO = {"Turkey": "in die Türkei"}

# Weight (1-10) by number of testimonies, damped so that one border does not outweigh everything.
WEIGHT_STEPS = [(300, 8), (100, 7), (20, 6), (0, 4)]

# Equal-area projection for Europe (metres), used for buffering and simplifying.
_TO_METRIC = Transformer.from_crs("EPSG:4326", "EPSG:3035", always_xy=True)
_TO_WGS84 = Transformer.from_crs("EPSG:3035", "EPSG:4326", always_xy=True)


def reproject(geometry, transformer):
    return shapely.transform(geometry, lambda xy: np.column_stack(transformer.transform(xy[:, 0], xy[:, 1])))


def normalize_country(name) -> str:
    """Canonical English country name, merging spelling variants of the same country."""
    text = " ".join(str(name or "").split())
    return COUNTRY_ALIASES.get(text.lower(), text)


def fetch_features(layer_url: str, since: dt.date) -> list[dict]:
    """Query all matching points page by page (outSR 4326)."""
    features, offset, page_size = [], 0, 1000
    where = f"Incident_Date >= date '{since.isoformat()}'"
    while True:
        params = urllib.parse.urlencode({
            "where": where,
            "outFields": ",".join(FIELDS),
            "returnGeometry": "true",
            "outSR": "4326",
            "resultOffset": offset,
            "resultRecordCount": page_size,
            "orderByFields": "FID",
            "f": "json",
        })
        with urllib.request.urlopen(f"{layer_url}/query?{params}", timeout=120) as response:
            data = json.loads(response.read().decode("utf-8"))
        if "error" in data:
            raise RuntimeError(f"Query failed: {data['error']}")
        batch = data.get("features", [])
        features.extend(batch)
        if not data.get("exceededTransferLimit") and len(batch) < page_size:
            return features
        offset += len(batch)


def country_de(name: str) -> str:
    return COUNTRIES_DE.get(name, name)


def country_de_to(name: str) -> str:
    return COUNTRIES_DE_TO.get(name, f"nach {country_de(name)}")


def is_plausible(x: float, y: float, countries: tuple[str, ...]) -> bool:
    """True if the point lies within the extent of one of the countries (or none is known)."""
    extents = [COUNTRY_EXTENTS[c] for c in countries if c in COUNTRY_EXTENTS]
    if not extents:
        return True
    m = EXTENT_MARGIN_DEG
    return any(x0 - m <= x <= x1 + m and y0 - m <= y <= y1 + m for x0, y0, x1, y1 in extents)


def weight_for(count: int) -> int:
    return next(weight for threshold, weight in WEIGHT_STEPS if count >= threshold)


def is_true(value) -> bool:
    return str(value).strip().lower() in {"true", "yes", "1"}


def percent(part: int, whole: int) -> int:
    return round(100 * part / whole) if whole else 0


def describe(group: dict) -> str:
    n = group["count"]
    first, last = group["first"].year, group["last"].year
    period = f"{first}" if first == last else f"{first}–{last}"
    where = (
        f"auf See von {country_de(group['from'])} in Richtung {country_de(group['to'])}"
        if group["maritime"]
        else f"von {country_de(group['from'])} {country_de_to(group['to'])}"
    )
    parts = [
        f"Das Border Violence Monitoring Network hat {n} Zeugenaussagen ({period}) zu Zurückweisungen "
        f"{where} dokumentiert, betroffen waren rund {group['people']} Menschen."
    ]
    known_violence = group["violence_known"]
    if known_violence:
        parts.append(f"In {percent(group['violence'], known_violence)} % der Berichte wird Gewalt beschrieben")
        if group["belongings"]:
            parts[-1] += (
                f", in {percent(group['belongings'], known_violence)} % wurden Sachen wie Handys oder Geld "
                "abgenommen oder zerstört"
            )
        parts[-1] += "."
    if group["asylum_known"]:
        parts.append(
            f"In {percent(group['asylum_yes'], group['asylum_known'])} % der Fälle hatten die Menschen "
            "um Asyl gebeten."
        )
    return " ".join(parts)


def build_zones(features: list[dict], buffer_km: float, min_count: int, simplify_m: float) -> tuple[list[dict], list[dict], dict, list[str]]:
    groups: dict[tuple, dict] = {}
    skipped = defaultdict(int)
    mislocated = []

    for feature in features:
        a = feature.get("attributes", {})
        g = feature.get("geometry") or {}
        origin, target = normalize_country(a.get("Pushback_From")), normalize_country(a.get("Pushback_To"))
        if not origin or not target or origin == target or g.get("x") is None:
            skipped[(origin, target)] += 1
            continue
        if not is_plausible(g["x"], g["y"], (origin, target)):
            mislocated.append(f"{origin}→{target} at {g['x']:.2f}, {g['y']:.2f}")
            continue
        maritime = is_true(a.get("Maritime_Pushback"))
        key = (origin, target, maritime)
        group = groups.setdefault(key, {
            "from": origin, "to": target, "maritime": maritime, "points": [], "count": 0, "people": 0,
            "first": None, "last": None, "violence": 0, "belongings": 0, "violence_known": 0,
            "asylum_yes": 0, "asylum_known": 0,
        })
        group["points"].append(Point(g["x"], g["y"]))
        group["count"] += 1
        group["people"] += int(a.get("Group_Size") or 0)
        if a.get("Incident_Date"):
            date = dt.datetime.fromtimestamp(a["Incident_Date"] / 1000, tz=dt.timezone.utc).date()
            group["first"] = min(filter(None, [group["first"], date]))
            group["last"] = max(filter(None, [group["last"], date]))
        violence = (a.get("Types_of_Violence_Used") or "").strip().lower()
        if violence:
            group["violence_known"] += 1
            if violence != "no violence used":
                group["violence"] += 1
            if "personal belongings" in violence:
                group["belongings"] += 1
        asylum = (a.get("Intention_Asylum_Expressed") or "").strip().lower()
        if asylum in {"yes", "no"}:
            group["asylum_known"] += 1
            group["asylum_yes"] += asylum == "yes"

    zones, dropped = [], []
    for group in sorted(groups.values(), key=lambda item: -item["count"]):
        if group["count"] < min_count:
            dropped.append(group)
            continue
        metric = [reproject(point, _TO_METRIC) for point in group["points"]]
        zone = unary_union([point.buffer(buffer_km * 1000, quad_segs=8) for point in metric])
        if simplify_m:
            zone = zone.simplify(simplify_m, preserve_topology=True)
        zone = reproject(zone, _TO_WGS84)
        name = f"Pushbacks {country_de(group['from'])} → {country_de(group['to'])}"
        if group["maritime"]:
            name += " (auf See)"
        zones.append({
            "type": "Feature",
            "geometry": mapping(zone),
            "properties": {
                "ObstacleType": "Grenze",
                "Name": name,
                "Weight": weight_for(group["count"]),
                "Description": describe(group),
                "Testimonies": group["count"],
                "People": group["people"],
                "PushbackFrom": group["from"],
                "PushbackTo": group["to"],
                "Maritime": "yes" if group["maritime"] else "no",
                "FirstDate": group["first"].isoformat() if group["first"] else None,
                "LastDate": group["last"].isoformat() if group["last"] else None,
                "Source": SOURCE,
            },
        })
    return zones, dropped, skipped, mislocated


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--layer", default=DEFAULT_LAYER, help="URL of the pushback point layer")
    parser.add_argument("--since", default="2022-01-01", help="first incident date to include (YYYY-MM-DD)")
    parser.add_argument("--buffer-km", type=float, default=15, help="buffer around each testimony point in km")
    parser.add_argument("--min-count", type=int, default=5, help="minimum testimonies for a border to become a zone")
    parser.add_argument("--simplify-m", type=float, default=500, help="simplify zone outlines (metres, 0 = off)")
    parser.add_argument("-o", "--output", default="pushback_zones.geojson", help="output GeoJSON file")
    args = parser.parse_args()

    since = dt.date.fromisoformat(args.since)
    print(f"Reading pushback points since {since} from {args.layer}")
    features = fetch_features(args.layer, since)
    print(f"  {len(features)} points")

    zones, dropped, skipped, mislocated = build_zones(features, args.buffer_km, args.min_count, args.simplify_m)

    output = {"type": "FeatureCollection", "name": "pushback_zones", "features": zones}
    path = Path(args.output)
    path.write_text(json.dumps(output, ensure_ascii=False), encoding="utf-8")

    print(f"\nWrote {len(zones)} zones to {path} ({path.stat().st_size / 1e3:.0f} kB)")
    for zone in zones:
        p = zone["properties"]
        print(f"  {p['Testimonies']:4} testimonies  weight {p['Weight']}  {p['Name']}")
    if dropped:
        print(f"Skipped {len(dropped)} borders with fewer than {args.min_count} testimonies: "
              + ", ".join(f"{g['from']}→{g['to']} ({g['count']})" for g in dropped))
    if mislocated:
        print(f"Ignored {len(mislocated)} points outside both countries (probably mislocated): "
              + "; ".join(mislocated))
    if skipped:
        print(f"Ignored {sum(skipped.values())} points without a border (same or missing country): "
              + ", ".join(f"{a or '?'}→{b or '?'} ({n})" for (a, b), n in skipped.items()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
