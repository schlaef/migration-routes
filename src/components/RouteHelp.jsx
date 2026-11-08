import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { STARTING_POINTS } from "../starting-points.js";
import {
  HELP_STAGES,
  IOM_REGIONS,
  getAllowedReferenceLayers,
  getIomRegionForStartingPoint,
  isStageUnlocked
} from "../reference-layers.js";

const sourceLinks = {
  border: "https://www.rescue.org/uk/article/why-cant-refugees-and-asylum-seekers-travel-freely-safety-understanding-power-passports",
  eu: "https://eur-lex.europa.eu/eli/reg/2024/1351/oj/eng",
  iom: "https://dtm.iom.int/"
};

export default function RouteHelp({
  visibility,
  availability,
  helpLevel = 2,
  usedHelp = {},
  onVisibilityChange,
  onStartingPointChange
}) {
  const { t } = useTranslation();
  const [startingPoint, setStartingPoint] = useState("");
  const allowed = getAllowedReferenceLayers(helpLevel);
  const stages = [...new Set(allowed.map((key) => HELP_STAGES[key]))].sort();

  const chooseStartingPoint = (id) => {
    setStartingPoint(id);
    onStartingPointChange(id);
    // Pre-select the matching real routes, without switching them on.
    if (allowed.includes("iom")) {
      const point = STARTING_POINTS.find((entry) => entry.id === id);
      onVisibilityChange("iomRegion", getIomRegionForStartingPoint(point));
    }
  };

  const renderLayer = (key) => {
    const locked = !isStageUnlocked(key, usedHelp);
    const unavailable = availability && !availability[key];

    return (
      <div key={key} style={{ marginBottom: "0.75rem" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600" }}>
          <input
            type="checkbox"
            checked={Boolean(visibility[key])}
            disabled={!availability?.[key] || locked}
            onChange={(event) => onVisibilityChange(key, event.target.checked)}
            aria-describedby={`route-help-${key}`}
          />
          {t(`routeHelp.${key}Title`)}
        </label>
        {locked ? (
          <p id={`route-help-${key}`} style={{ margin: "0.3rem 0 0", color: "var(--calcite-color-text-2)" }}>
            {t("routeHelp.locked")}
          </p>
        ) : (
          <p id={`route-help-${key}`} style={{ margin: "0.3rem 0 0" }}>
            {t(`routeHelp.${key}Description`)}
          </p>
        )}
        {key === "iom" && !locked && visibility.iom && (
          <div style={{ margin: "0.5rem 0 0" }}>
            <label htmlFor="route-help-iom-region" style={{ display: "block", fontWeight: "600", marginBottom: "0.25rem" }}>
              {t("routeHelp.iomRegion")}
            </label>
            <select
              id="route-help-iom-region"
              value={visibility.iomRegion || "all"}
              onChange={(event) => onVisibilityChange("iomRegion", event.target.value)}
              style={{ width: "100%", padding: "0.35rem", font: "inherit" }}
            >
              {IOM_REGIONS.map((region) => (
                <option key={region} value={region}>{t(`routeHelp.iomRegions.${region}`)}</option>
              ))}
            </select>
            {visibility.iomRegion && visibility.iomRegion !== "all" && (
              <p style={{ margin: "0.4rem 0 0" }}>{t(`routeHelp.iomRegionDescriptions.${visibility.iomRegion}`)}</p>
            )}
          </div>
        )}
        {unavailable && (
          <p style={{ margin: "0.25rem 0 0", color: "var(--calcite-color-text-2)" }}>
            {t("routeHelp.unavailable")}
          </p>
        )}
        <a href={sourceLinks[key]} target="_blank" rel="noopener noreferrer">
          {t(`routeHelp.${key}Source`)}
        </a>
      </div>
    );
  };

  return (
    <>
    <div style={{ marginBottom: "1rem", fontSize: "0.85rem", lineHeight: "1.5" }}>
      <label htmlFor="route-starting-point" style={{ display: "block", fontWeight: "600", marginBottom: "0.3rem" }}>
        {t("routeHelp.startingPoint")}
      </label>
      <p id="route-starting-point-description" style={{ margin: "0 0 0.5rem" }}>
        {t("routeHelp.startingPointDescription")}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
        <select
          id="route-starting-point"
          aria-describedby="route-starting-point-description"
          value={startingPoint}
          disabled={!availability}
          onChange={(event) => chooseStartingPoint(event.target.value)}
          style={{ flex: "1 1 auto", minWidth: 0, padding: "0.35rem", font: "inherit" }}
        >
          <option value="" disabled>{t("routeHelp.chooseStartingPoint")}</option>
          {["africa", "east"].map((region) => (
            <optgroup key={region} label={t(`startingPoints.${region}`)}>
              {STARTING_POINTS.filter((point) => point.region === region).map((point) => (
                <option key={point.id} value={point.id}>{t(`startingPoints.${point.id}`)}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <calcite-action
          icon="locate"
          text={t("routeHelp.recenter")}
          title={t("routeHelp.recenter")}
          disabled={!availability || !startingPoint ? true : undefined}
          onClick={() => onStartingPointChange(startingPoint)}
        />
      </div>
    </div>
    {allowed.length > 0 && (
    <details style={{ marginBottom: "1rem", borderBottom: "1px solid var(--calcite-color-border-3)", paddingBottom: "0.75rem" }}>
      <summary style={{ cursor: "pointer", fontWeight: "600", fontSize: "0.9rem" }}>
        {t("routeHelp.title")}
      </summary>
      <div style={{ fontSize: "0.85rem", lineHeight: "1.5", paddingTop: "0.6rem" }}>
        <p style={{ margin: "0 0 0.75rem" }}>{t("routeHelp.introduction")}</p>
        {stages.map((stage) => (
          <section key={stage} aria-labelledby={`route-help-stage-${stage}`}>
            <h3
              id={`route-help-stage-${stage}`}
              style={{ fontSize: "0.85rem", margin: "0.75rem 0 0.5rem", color: "var(--calcite-color-text-2)" }}
            >
              {t(`routeHelp.stage${stage}`)}
            </h3>
            {allowed.filter((key) => HELP_STAGES[key] === stage).map(renderLayer)}
          </section>
        ))}
        {!availability && <p style={{ margin: 0 }}>{t("routeHelp.loading")}</p>}
      </div>
    </details>
    )}
    </>
  );
}
