import React from "react";
import { useTranslation } from "react-i18next";
import { browsersInOrder, detectBrowser } from "../webgl.js";

/**
 * Shown over the map when the browser cannot provide WebGL2, with fixes per browser.
 */
export default function WebGLNotice() {
  const { t } = useTranslation();
  const current = detectBrowser();
  const general = t("webgl.general", { returnObjects: true });

  return (
    <div
      role="alert"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 20,
        overflowY: "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "2rem 1rem",
        backgroundColor: "var(--calcite-color-background, #f8f8f8)"
      }}
    >
      <div
        style={{
          maxWidth: "640px",
          width: "100%",
          backgroundColor: "var(--calcite-color-foreground-1, #fff)",
          border: "1px solid var(--calcite-color-border-2, #ddd)",
          borderRadius: "6px",
          padding: "1.25rem",
          fontSize: "0.9rem",
          lineHeight: "1.5"
        }}
      >
        <h2 style={{ fontSize: "1.15rem", margin: "0 0 0.5rem" }}>{t("webgl.title")}</h2>
        <p style={{ margin: "0 0 0.75rem" }}>{t("webgl.text")}</p>
        <p style={{ margin: "0 0 0.75rem" }}>
          <strong>{t("webgl.quickFix")}</strong>
        </p>
        <ul style={{ margin: "0 0 1rem", paddingLeft: "1.2rem" }}>
          {(Array.isArray(general) ? general : []).map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
        <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>{t("webgl.perBrowser")}</p>
        {browsersInOrder(current).map((browser) => {
          const steps = t(`webgl.browsers.${browser}.steps`, { returnObjects: true });
          return (
            <details key={browser} open={browser === current} style={{ marginBottom: "0.5rem" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                {t(`webgl.browsers.${browser}.name`)}
                {browser === current && ` (${t("webgl.yourBrowser")})`}
              </summary>
              <ol style={{ margin: "0.4rem 0 0", paddingLeft: "1.4rem" }}>
                {(Array.isArray(steps) ? steps : []).map((step, index) => (
                  <li key={index} style={{ marginBottom: "0.25rem" }}>{step}</li>
                ))}
              </ol>
            </details>
          );
        })}
        <p style={{ margin: "1rem 0 0" }}>
          {t("webgl.testText")}{" "}
          <a href="https://get.webgl.org/webgl2/" target="_blank" rel="noopener noreferrer">
            get.webgl.org/webgl2
          </a>
        </p>
      </div>
    </div>
  );
}
