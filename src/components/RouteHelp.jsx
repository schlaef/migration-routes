import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { STARTING_POINTS } from "../starting-points.js";

const layers = ["border", "eu"];

export default function RouteHelp({ visibility, availability, onVisibilityChange, onStartingPointChange }) {
  const { t } = useTranslation();
  const [startingPoint, setStartingPoint] = useState("");

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
          onChange={(event) => {
            setStartingPoint(event.target.value);
            onStartingPointChange(event.target.value);
          }}
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
    <details style={{ marginBottom: "1rem", borderBottom: "1px solid var(--calcite-color-border-3)", paddingBottom: "0.75rem" }}>
      <summary style={{ cursor: "pointer", fontWeight: "600", fontSize: "0.9rem" }}>
        {t("routeHelp.title")}
      </summary>
      <div style={{ fontSize: "0.85rem", lineHeight: "1.5", paddingTop: "0.6rem" }}>
        <p style={{ margin: "0 0 0.75rem" }}>{t("routeHelp.introduction")}</p>
        {layers.map((key) => (
          <div key={key} style={{ marginBottom: "0.75rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600" }}>
              <input
                type="checkbox"
                checked={visibility[key]}
                disabled={!availability?.[key]}
                onChange={(event) => onVisibilityChange(key, event.target.checked)}
                aria-describedby={`route-help-${key}`}
              />
              {t(`routeHelp.${key}Title`)}
            </label>
            <p id={`route-help-${key}`} style={{ margin: "0.3rem 0 0" }}>
              {t(`routeHelp.${key}Description`)}
            </p>
            {availability && !availability[key] && (
              <p style={{ margin: "0.25rem 0 0", color: "var(--calcite-color-text-2)" }}>
                {t("routeHelp.unavailable")}
              </p>
            )}
            <a
              href={key === "border"
                ? "https://www.rescue.org/uk/article/why-cant-refugees-and-asylum-seekers-travel-freely-safety-understanding-power-passports"
                : "https://eur-lex.europa.eu/eli/reg/2024/1351/oj/eng"}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t(`routeHelp.${key}Source`)}
            </a>
          </div>
        ))}
        {!availability && <p style={{ margin: 0 }}>{t("routeHelp.loading")}</p>}
      </div>
    </details>
    </>
  );
}