import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { useTranslation } from "react-i18next";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer.js";
import Graphic from "@arcgis/core/Graphic.js";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol.js";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol.js";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import TextSymbol from "@arcgis/core/symbols/TextSymbol.js";
import Point from "@arcgis/core/geometry/Point.js";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel.js";
import Polyline from "@arcgis/core/geometry/Polyline.js";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils.js";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine.js";
import { sampleObstacles } from "../sample-obstacles.js";
import { ROUTE_SYMBOL_PROPERTIES, countRoutes } from "../route-drawing.js";
import { syncReferenceLayers } from "../reference-layers.js";
import { focusStartingPoint } from "../starting-points.js";
import { getWorkRoutePath } from "../work-routes.js";
import {
  findObstacleLayer,
  ensureObstacleLayerHidden,
  buildObstacleIntersectionQuery,
  countCountriesCrossed,
  bufferRouteGeometries,
  intersectBufferWithObstacles,
  summarizeRouteAnalysis
} from "../analyzer.js";

const MapContainer = forwardRef(function MapContainer(
  { config, onRouteChange, onAnalysisComplete, onStatusUpdate, referenceLayers, onReferenceLayerAvailabilityChange },
  ref
) {
  const { t } = useTranslation();
  const [sketching, setSketching] = useState(false);
  const mapElementRef = useRef(null);
  const viewRef = useRef(null);
  const sketchRef = useRef(null);
  const routesLayerRef = useRef(null);
  const bufferLayerRef = useRef(null);
  const highlightLayerRef = useRef(null);
  const hoverLayerRef = useRef(null);
  const workRouteLayerRef = useRef(null);
  const workRouteLabelLayerRef = useRef(null);
  const obstacleLayerRef = useRef(null);
  const referenceLayersRef = useRef(referenceLayers);

  useEffect(() => {
    referenceLayersRef.current = referenceLayers;
    if (viewRef.current?.map) {
      onReferenceLayerAvailabilityChange?.(syncReferenceLayers(viewRef.current.map, referenceLayers));
    }
  }, [referenceLayers, onReferenceLayerAvailabilityChange]);

  // Latest callback for the SketchViewModel events (created once per map).
  const onRouteChangeRef = useRef(onRouteChange);
  onRouteChangeRef.current = onRouteChange;

  // Start a new route with the ArcGIS SketchViewModel (the logic behind the Sketch
  // component, without its toolbar). In "click" mode, dragging pans and the mouse
  // wheel zooms while drawing; vertices are shown as control points.
  const startSketch = () => {
    const sketch = sketchRef.current;
    if (!sketch?.layer || sketching) return;
    sketch.create("polyline", { mode: "click" });
  };

  // Expose imperative methods to parent (App.jsx)
  useImperativeHandle(ref, () => ({
    startSketch,

    goToStartingPoint(id) {
      focusStartingPoint(viewRef.current, id)?.catch((error) => {
        if (error.name !== "AbortError") console.warn("Could not navigate to starting point:", error);
      });
    },

    /**
     * Shows a route from film or literature (or hides it when route is null).
     * stationLabels: translated station names in station order.
     */
    showWorkRoute(route, stationLabels = []) {
      const view = viewRef.current;
      if (!view?.map) return;

      const ensureLayer = (layerRef, id) => {
        if (!layerRef.current || !view.map.layers.includes(layerRef.current)) {
          layerRef.current = new GraphicsLayer({ id, title: "Route from film / literature", listMode: "hide" });
          view.map.add(layerRef.current);
        }
        layerRef.current.removeAll();
        return layerRef.current;
      };
      const layer = ensureLayer(workRouteLayerRef, "work-route");
      // Labels on their own layer: if label fonts cannot be loaded, line and points still show.
      const labelLayer = ensureLayer(workRouteLabelLayerRef, "work-route-labels");
      if (!route) return;

      // Station coordinates are WGS84; convert for Web Mercator maps so lines and zoom work without a projection engine.
      const toView = (geometry) =>
        view.spatialReference?.isWebMercator && webMercatorUtils.canProject(geometry, view.spatialReference)
          ? webMercatorUtils.geographicToWebMercator(geometry)
          : geometry;
      const spatialReference = { wkid: 4326 };
      const line = new Graphic({
        geometry: toView(new Polyline({ paths: [getWorkRoutePath(route)], spatialReference })),
        symbol: new SimpleLineSymbol({ color: [123, 63, 160, 0.95], width: 3, style: "short-dash" })
      });
      const labels = [];
      const stations = route.stations.map((station, index) => {
        const geometry = toView(new Point({ x: station.coordinates[0], y: station.coordinates[1], spatialReference }));
        labels.push(
          new Graphic({
            geometry,
            symbol: new TextSymbol({
              text: String(index + 1),
              color: "white",
              font: { size: 9, weight: "bold" },
              yoffset: -3
            })
          }),
          new Graphic({
            geometry,
            symbol: new TextSymbol({
              text: stationLabels[index] || "",
              color: [60, 20, 90, 1],
              haloColor: "white",
              haloSize: 1.5,
              font: { size: 10, weight: "bold" },
              xoffset: 12,
              yoffset: 8,
              horizontalAlignment: "left"
            })
          })
        );
        return new Graphic({
          geometry,
          symbol: new SimpleMarkerSymbol({
            style: "circle",
            size: 18,
            color: [123, 63, 160, 1],
            outline: { color: [255, 255, 255, 1], width: 1.5 }
          })
        });
      });
      layer.addMany([line, ...stations]);
      labelLayer.addMany(labels);
      view.goTo(line.geometry.extent.clone().expand(1.3), { duration: 800 }).catch((error) => {
        if (error.name !== "AbortError") console.warn("Could not zoom to work route:", error);
      });
    },

    clearAll() {
      sketchRef.current?.cancel();
      if (routesLayerRef.current) routesLayerRef.current.removeAll();
      if (bufferLayerRef.current) bufferLayerRef.current.removeAll();
      if (highlightLayerRef.current) highlightLayerRef.current.removeAll();
      if (hoverLayerRef.current) hoverLayerRef.current.removeAll();
      if (workRouteLayerRef.current) workRouteLayerRef.current.removeAll();
      if (workRouteLabelLayerRef.current) workRouteLabelLayerRef.current.removeAll();
      if (onRouteChange) onRouteChange(0);
    },

    highlightObstacle(obstacle) {
      const layer = hoverLayerRef.current;
      if (!layer) return;
      layer.removeAll();
      const geometry = obstacle?.geometry;
      if (!geometry) return;

      let symbol;
      if (geometry.type === "polygon" || geometry.type === "extent") {
        symbol = new SimpleFillSymbol({
          color: [255, 215, 0, 0.35],
          outline: { color: [255, 190, 0, 1], width: 3 }
        });
      } else if (geometry.type === "polyline") {
        symbol = new SimpleLineSymbol({ color: [255, 190, 0, 1], width: 5 });
      } else {
        symbol = new SimpleMarkerSymbol({
          style: "diamond",
          color: [255, 215, 0, 1],
          size: 20,
          outline: { color: [255, 255, 255, 1], width: 2 }
        });
      }
      layer.add(new Graphic({ geometry, symbol }));
    },

    async analyze() {
      if (!routesLayerRef.current || !viewRef.current) {
        throw Object.assign(new Error("Map or sketch layer is not initialized yet."), { code: "notReady" });
      }

      // Load only the layers the analysis needs; one slow or blocked reference
      // layer (e.g. an external service filtered at school) must not block it.
      const analysisLayers = [
        findObstacleLayer(viewRef.current.map, config.obstacleLayerTitle) || obstacleLayerRef.current,
        findObstacleLayer(viewRef.current.map, "Political Boundaries - Countries")
      ].filter((layer) => typeof layer?.load === "function");
      const loadResults = await Promise.allSettled(analysisLayers.map((layer) => layer.load()));
      loadResults
        .filter((result) => result.status === "rejected")
        .forEach((result) => console.warn("Could not load a layer needed for the analysis:", result.reason));

      const routeGraphics = routesLayerRef.current.graphics
        .filter(
          (g) =>
            g &&
            g.geometry &&
            (g.geometry.type === "polyline" || g.geometry.type === "line")
        )
        .toArray();

      if (routeGraphics.length === 0) {
        throw Object.assign(new Error("Please sketch at least one migration route on the map first."), { code: "noRoute" });
      }

      const routeGeometries = routeGraphics.map((g) => g.geometry);

      // 1. Buffer sketched routes
      let bufferPolygon;
      try {
        bufferPolygon = bufferRouteGeometries(
          routeGeometries,
          config.bufferDistance,
          config.bufferUnit,
          geometryEngine
        );
      } catch (err) {
        throw Object.assign(new Error(`Buffering failed: ${err.message}`), { code: "bufferFailed", detail: err.message });
      }

      // 2. Clear old buffer & highlight graphics, render new buffer
      if (bufferLayerRef.current) {
        bufferLayerRef.current.removeAll();
        const bufferGraphic = new Graphic({
          geometry: bufferPolygon,
          symbol: new SimpleFillSymbol({
            color: [255, 140, 0, 0.2],
            outline: {
              color: [255, 140, 0, 0.85],
              width: 1.5,
              style: "dash"
            }
          }),
          attributes: {
            type: "route-buffer",
            distance: config.bufferDistance,
            unit: config.bufferUnit
          }
        });
        bufferLayerRef.current.add(bufferGraphic);
      }

      // 3. Query obstacle layer
      const obstacleLayer =
        findObstacleLayer(viewRef.current.map, config.obstacleLayerTitle) ||
        obstacleLayerRef.current;
      obstacleLayerRef.current = obstacleLayer;

      let features = [];
      if (obstacleLayer) {
        ensureObstacleLayerHidden(obstacleLayer);
        try {
          if (typeof obstacleLayer.queryFeatures === "function") {
            const query = buildObstacleIntersectionQuery(obstacleLayer, bufferPolygon);
            const res = await obstacleLayer.queryFeatures(query);
            features = res.features || [];
          } else if (obstacleLayer.graphics) {
            features = obstacleLayer.graphics.toArray();
          }
        } catch (queryErr) {
          console.warn("Could not query obstacle layer:", queryErr);
          throw Object.assign(new Error(`Could not query obstacle layer: ${queryErr.message}`), {
            code: "queryFailed",
            detail: queryErr.message
          });
        }
      }

      // 4. Intersect buffer with obstacles
      const intersected = intersectBufferWithObstacles(
        bufferPolygon,
        features,
        geometryEngine,
        config,
        { prefiltered: Boolean(obstacleLayer?.queryFeatures) }
      );

      // 5. Highlight intersected obstacles
      if (highlightLayerRef.current) {
        highlightLayerRef.current.removeAll();
        for (const obs of intersected) {
          const highlightGraphic = new Graphic({
            geometry: obs.geometry,
            symbol: new SimpleMarkerSymbol({
              style: "diamond",
              color: [229, 62, 62, 0.9],
              size: 14,
              outline: {
                color: [255, 255, 255, 1],
                width: 2
              }
            }),
            attributes: {
              title: obs.title,
              category: obs.category,
              weight: obs.weight,
              description: obs.description
            },
            popupTemplate: {
              title: "{title}",
              content: `
                <p><strong>Category:</strong> {category}</p>
                <p><strong>Difficulty Weight:</strong> {weight}</p>
                <p>{description}</p>
              `
            }
          });
          highlightLayerRef.current.add(highlightGraphic);
        }
      }

      // 6. Calculate total length in km
      let totalLengthKm = 0;
      for (const geom of routeGeometries) {
        try {
          if (geometryEngine.geodesicLength) {
            totalLengthKm += geometryEngine.geodesicLength(geom, "kilometers");
          } else {
            totalLengthKm += geometryEngine.planarLength(geom, "kilometers");
          }
        } catch (e) {
          // ignore geometry length calculation failure
        }
      }

      let countryCount = null;
      const countryLayer = findObstacleLayer(viewRef.current.map, "Political Boundaries - Countries");
      if (countryLayer) {
        try {
          countryCount = await countCountriesCrossed(countryLayer, routeGeometries);
        } catch (error) {
          console.warn("Could not count countries crossed:", error);
        }
      }

      // 7. Consolidate results
      const summary = summarizeRouteAnalysis(intersected, config, {
        routeCount: routeGraphics.length,
        totalLengthKm,
        countryCount
      });

      // 8. Adjust view extent to show buffer corridor if available
      if (bufferPolygon && bufferPolygon.extent && viewRef.current.goTo) {
        viewRef.current.goTo(bufferPolygon.extent.expand(1.3), { duration: 800 });
      }

      return summary;
    }
  }));

  // Setup ArcGIS View and Layers when custom element is mounted
  useEffect(() => {
    const mapEl = mapElementRef.current;
    if (!mapEl) return;

    let destroyed = false;
    let initializingMap = null;
    let hoverLayer = null;
    let hoverMap = null;

    async function initializeLayers(view) {
      if (destroyed || !view || !view.map) return;
      const map = view.map;
      if (initializingMap === map) return;
      initializingMap = map;
      viewRef.current = view;
      onReferenceLayerAvailabilityChange?.(null);
      // As soon as the WebMap has created its layers, hide help layers (even if the
      // WebMap saved them as visible) without waiting for slow external sources.
      try {
        await map.load();
      } catch (loadErr) {
        console.warn("Could not load the WebMap:", loadErr);
      }
      if (destroyed || view.map !== map) return;
      onReferenceLayerAvailabilityChange?.(syncReferenceLayers(map, referenceLayersRef.current));

      // Only wait for the obstacle layer, not for every layer in the WebMap:
      // drawing must not depend on slow or blocked external reference layers.
      try {
        await findObstacleLayer(map, config.obstacleLayerTitle)?.load?.();
      } catch (loadErr) {
        console.warn("Could not load the obstacle layer:", loadErr);
      }

      if (destroyed || view.map !== map) return;

      onReferenceLayerAvailabilityChange?.(syncReferenceLayers(map, referenceLayersRef.current));

      // Ensure view padding and UI elements
      view.ui.move("zoom", "top-left");

      // 1. Routes Sketch Layer
      const routesLayer = new GraphicsLayer({
        id: "user-sketched-routes",
        title: "Sketched Migration Routes",
        listMode: "show"
      });
      view.map.add(routesLayer);
      routesLayerRef.current = routesLayer;
      sketchRef.current?.destroy();
      const sketch = new SketchViewModel({
        view,
        layer: routesLayer,
        polylineSymbol: new SimpleLineSymbol(ROUTE_SYMBOL_PROPERTIES),
        defaultCreateOptions: { mode: "click" }
      });
      sketchRef.current = sketch;

      // Keep the route count and the "drawing" state in sync with sketching and editing.
      const reportCount = () => onRouteChangeRef.current?.(countRoutes(routesLayer));
      sketch.on("create", (event) => {
        if (event.state === "start") setSketching(true);
        if (event.state === "complete" || event.state === "cancel") {
          setSketching(false);
          reportCount();
        }
      });
      sketch.on("update", (event) => {
        if (event.state === "complete") reportCount();
      });
      sketch.on(["delete", "undo", "redo"], reportCount);
      onRouteChangeRef.current?.(0);

      // 2. Buffer corridor visualization layer
      const bufferLayer = new GraphicsLayer({
        id: "route-buffer-corridor",
        title: "Route Buffer Corridor",
        listMode: "show"
      });
      view.map.add(bufferLayer);
      bufferLayerRef.current = bufferLayer;

      // 3. Highlight layer for intersected obstacles
      const highlightLayer = new GraphicsLayer({
        id: "intersected-obstacles-highlight",
        title: "Intersected Obstacles (Analysis)",
        listMode: "show"
      });
      view.map.add(highlightLayer);
      highlightLayerRef.current = highlightLayer;

      if (hoverLayer && hoverMap) hoverMap.remove(hoverLayer);
      hoverLayer = new GraphicsLayer({
        id: "hovered-obstacle-highlight",
        title: "Hovered Obstacle",
        listMode: "hide"
      });
      view.map.add(hoverLayer);
      hoverMap = view.map;
      hoverLayerRef.current = hoverLayer;

      // 4. Look for existing route obstacles layer in WebMap
      let obstacleLayer = findObstacleLayer(view.map, config.obstacleLayerTitle);

      if (obstacleLayer) {
        // Enforce invisiblity requirement
        ensureObstacleLayerHidden(obstacleLayer);
        obstacleLayerRef.current = obstacleLayer;
        if (onStatusUpdate) {
          onStatusUpdate(`Connected to WebMap layer: "${obstacleLayer.title}" (invisible on map)`);
        }
      } else {
        // Create local fallback GeoJSON layer using sampleObstacles
        try {
          const blob = new Blob([JSON.stringify(sampleObstacles)], {
            type: "application/json"
          });
          const url = URL.createObjectURL(blob);
          const fallbackLayer = new GeoJSONLayer({
            id: "route-obstacles-fallback",
            title: config.obstacleLayerTitle,
            url,
            visible: false, // Must be invisible per requirement
            listMode: "hide",
            outFields: ["*"]
          });
          view.map.add(fallbackLayer);
          obstacleLayerRef.current = fallbackLayer;
          if (onStatusUpdate) {
            onStatusUpdate(`Initialized fallback obstacle dataset (${sampleObstacles.features.length} points, hidden on map)`);
          }
        } catch (e) {
          console.warn("Could not create fallback GeoJSONLayer:", e);
        }
      }

    }

    const handleViewReady = (event) => {
      const view = event.target.view;
      if (view) {
        initializeLayers(view);
      }
    };

    mapEl.addEventListener("arcgisViewReadyChange", handleViewReady);

    // If view is already attached
    if (mapEl.view) {
      initializeLayers(mapEl.view);
    }

    return () => {
      destroyed = true;
      if (mapEl) {
        mapEl.removeEventListener("arcgisViewReadyChange", handleViewReady);
      }
      sketchRef.current?.destroy();
      sketchRef.current = null;
      if (hoverLayer && hoverMap) hoverMap.remove(hoverLayer);
      if (hoverLayerRef.current === hoverLayer) hoverLayerRef.current = null;
      if (viewRef.current?.map === initializingMap) viewRef.current = null;
    };
  }, [config.webmapId, config.obstacleLayerTitle]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <arcgis-map
        ref={mapElementRef}
        item-id={config.webmapId}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <arcgis-zoom position="top-left" />
        <arcgis-basemap-toggle slot="bottom-right" next-basemap="satellite" />
        <arcgis-scale-bar position="bottom-left" />
      </arcgis-map>

      {/* Floating on-map toolbar for quick sketching & buffer indicator */}
      <div
        style={{
          position: "absolute",
          top: "15px",
          left: "60px",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          padding: "6px 12px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          backdropFilter: "blur(4px)"
        }}
      >
        <calcite-button
          appearance="outline"
          kind="brand"
          scale="s"
          icon-start="pencil"
          disabled={sketching ? true : undefined}
          onClick={startSketch}
          title={t("drawing.drawTooltip")}
        >
          {t("drawing.draw")}
        </calcite-button>

        <calcite-chip scale="s" value="buffer-info" icon="extent">
          {t("drawing.corridor", { distance: config.bufferDistance, unit: t(`drawing.unitsShort.${config.bufferUnit}`) })}
        </calcite-chip>
      </div>

      {sketching && (
        <div
          role="status"
          style={{
            position: "absolute",
            top: "70px",
            left: "16px",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            width: "max-content",
            maxWidth: "min(360px, calc(100% - 32px))",
            padding: "0.4rem 0.5rem 0.4rem 0.75rem",
            backgroundColor: "var(--calcite-color-foreground-1, #fff)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            borderRadius: "4px",
            fontSize: "0.85rem",
            lineHeight: "1.4"
          }}
        >
          <span>{t("drawing.instructions")}</span>
          <calcite-action
            icon="x"
            text={t("drawing.cancel")}
            title={t("drawing.cancel")}
            onClick={() => sketchRef.current?.cancel()}
          />
        </div>
      )}
    </div>
  );
});

export default MapContainer;
