import React, { useState, useRef, useCallback, useEffect } from "react";
import Header from "./components/Header.jsx";
import MapContainer from "./components/MapContainer.jsx";
import AnalysisPanel from "./components/AnalysisPanel.jsx";
import SettingsModal from "./components/SettingsModal.jsx";
import GuideModal from "./components/GuideModal.jsx";
import { getConfig } from "./config.js";
import {
  INITIAL_REFERENCE_LAYERS,
  HELP_STAGES,
  getAllowedReferenceLayers,
  isStageUnlocked,
  recordHelpUse
} from "./reference-layers.js";

export default function App() {
  const [config, setConfig] = useState(() => getConfig());
  const [routeCount, setRouteCount] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const [panelOpen, setPanelOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [referenceLayers, setReferenceLayers] = useState(INITIAL_REFERENCE_LAYERS);
  const [referenceLayerAvailability, setReferenceLayerAvailability] = useState(null);
  const [usedHelp, setUsedHelp] = useState({});
  const helpLevel = config.helpLevel ?? 2;

  // Switch off help layers that the configured help level no longer allows.
  useEffect(() => {
    const allowed = getAllowedReferenceLayers(helpLevel);
    setReferenceLayers((previous) => {
      const next = { ...previous };
      for (const key of Object.keys(HELP_STAGES)) {
        if (!allowed.includes(key)) next[key] = false;
      }
      return next;
    });
  }, [helpLevel]);

  const handleReferenceLayerChange = (key, value) => {
    if (Object.hasOwn(HELP_STAGES, key)) {
      if (value && (!getAllowedReferenceLayers(helpLevel).includes(key) || !isStageUnlocked(key, usedHelp))) return;
      setUsedHelp((previous) => recordHelpUse(previous, key, value));
    }
    setReferenceLayers((previous) => ({ ...previous, [key]: value }));
  };

  const mapContainerRef = useRef(null);

  const handleRouteChange = useCallback((count) => {
    setRouteCount(count);
    if (count === 0) {
      setAnalysisResult(null);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!mapContainerRef.current) return;
    mapContainerRef.current.highlightObstacle(null);
    setAnalyzing(true);
    setErrorMessage(null);
    try {
      const summary = await mapContainerRef.current.analyze();
      setAnalysisResult(summary ? { ...summary, helpUsed: usedHelp } : summary);
      setPanelOpen(true);
    } catch (err) {
      console.error("Analysis error:", err);
      setErrorMessage(err.message || "Failed to analyze sketched route.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClear = () => {
    if (mapContainerRef.current) {
      mapContainerRef.current.clearAll();
    }
    setRouteCount(0);
    setAnalysisResult(null);
    setErrorMessage(null);
  };

  const handleConfigSave = (updatedConfig) => {
    setConfig(updatedConfig);
  };

  const handleConfigReset = (defaultConfig) => {
    setConfig(defaultConfig);
  };

  const handleObstacleHover = (obstacle) => {
    mapContainerRef.current?.highlightObstacle(obstacle);
  };

  const closePanel = () => {
    handleObstacleHover(null);
    setPanelOpen(false);
  };

  return (
    <calcite-shell style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column" }}>
      <Header
        appTitle={config.appTitle}
        appSubtitle={config.appSubtitle}
        routeCount={routeCount}
        analyzing={analyzing}
        onAnalyze={handleAnalyze}
        onClear={handleClear}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenGuide={() => setGuideOpen(true)}
        panelOpen={panelOpen}
        onTogglePanel={() => {
          handleObstacleHover(null);
          setPanelOpen((prev) => !prev);
        }}
      />

      <calcite-shell-panel
        slot="panel-end"
        position="end"
        resizable
        width-scale="l"
        collapsed={!panelOpen ? true : undefined}
      >
        <AnalysisPanel
          analysis={analysisResult}
          analyzing={analyzing}
          config={config}
          onClose={closePanel}
          onOpenGuide={() => setGuideOpen(true)}
          onObstacleHover={handleObstacleHover}
          referenceLayers={referenceLayers}
          referenceLayerAvailability={referenceLayerAvailability}
          helpLevel={helpLevel}
          usedHelp={usedHelp}
          onStartingPointChange={(id) => mapContainerRef.current?.goToStartingPoint(id)}
          onReferenceLayerChange={handleReferenceLayerChange}
        />
      </calcite-shell-panel>

      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {errorMessage && (
          <div
            style={{
              position: "absolute",
              top: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 99,
              maxWidth: "600px",
              width: "90%"
            }}
          >
            <calcite-notice open kind="danger" icon="exclamation-mark-triangle">
              <div slot="title">Analysis Notice</div>
              <div slot="message">{errorMessage}</div>
              <calcite-action
                slot="actions-end"
                icon="x"
                text="Dismiss"
                onClick={() => setErrorMessage(null)}
              />
            </calcite-notice>
          </div>
        )}

        <MapContainer
          ref={mapContainerRef}
          config={config}
          onRouteChange={handleRouteChange}
          onStatusUpdate={(msg) => setStatusMessage(msg)}
          referenceLayers={referenceLayers}
          onReferenceLayerAvailabilityChange={setReferenceLayerAvailability}
        />
      </div>

      <SettingsModal
        open={settingsOpen}
        config={config}
        onSave={handleConfigSave}
        onReset={handleConfigReset}
        onClose={() => setSettingsOpen(false)}
      />

      <GuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
    </calcite-shell>
  );
}
