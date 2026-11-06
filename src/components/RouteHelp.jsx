import React from "react";
import { useTranslation } from "react-i18next";

const layers = ["border", "eu"];

export default function RouteHelp({ visibility, availability, onVisibilityChange }) {
  const { t } = useTranslation();

  return (
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
  );
}