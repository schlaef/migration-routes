import React from "react";
import { useTranslation } from "react-i18next";
import { WORK_ROUTES, compareWithAnalysis, getWorkRoute, getWorkRouteVideos } from "../work-routes.js";
import CategoryVideo from "./CategoryVideo.jsx";

const box = {
  backgroundColor: "var(--calcite-color-foreground-2, #f8f9fa)",
  padding: "0.75rem",
  borderRadius: "6px",
  fontSize: "0.85rem",
  lineHeight: "1.5"
};

function CategoryList({ categories, emptyKey }) {
  const { t } = useTranslation();
  if (categories.length === 0) return <span>{t(emptyKey)}</span>;
  return <span>{categories.map((category) => t(`workRoutes.categories.${category}`)).join(", ")}</span>;
}

export default function WorkRoutes({ analysis, selectedId, onSelect, showVideos = true }) {
  const { t } = useTranslation();

  // Videos with their texts from the locale files (title and guiding question).
  const renderVideos = (route, stationId) => {
    if (!showVideos) return null;
    const prefix = stationId
      ? `workRoutes.${route.id}.stations.${stationId}.videos`
      : `workRoutes.${route.id}.videos`;
    return getWorkRouteVideos(route, stationId).map((video) => (
      <CategoryVideo
        key={`${video.videoId}-${video.start ?? 0}`}
        video={{
          ...video,
          title: t(`${prefix}.${video.key}.title`, { defaultValue: "" }),
          note: t(`${prefix}.${video.key}.note`, { defaultValue: "" })
        }}
      />
    ));
  };
  const route = getWorkRoute(selectedId);
  const comparison = route ? compareWithAnalysis(route, analysis) : null;
  const questions = route ? t(`workRoutes.${route.id}.questions`, { returnObjects: true }) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: "1.5" }}>{t("workRoutes.introduction")}</p>

      {WORK_ROUTES.map((work) => {
        const active = work.id === selectedId;
        return (
          <calcite-card key={work.id} style={{ width: "100%" }}>
            <div slot="heading" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.4rem" }}>
              <calcite-chip scale="s" appearance="outline-fill" icon={work.kind === "film" ? "video" : "book"}>
                {t(`videos.kinds.${work.kind}`)}
              </calcite-chip>
              <em style={{ fontSize: "0.95rem" }}>{t(`workRoutes.${work.id}.title`)}</em>
            </div>
            <div slot="description">{t(`workRoutes.${work.id}.meta`)}</div>
            <p style={{ fontSize: "0.85rem", lineHeight: "1.5", margin: "0.5rem 0" }}>
              {t(`workRoutes.${work.id}.summary`)}
            </p>
            {renderVideos(work)}
            <div slot="footer-start">
              <calcite-button
                scale="s"
                appearance={active ? "outline" : "solid"}
                icon-start={active ? "view-hide" : "map"}
                onClick={() => onSelect(active ? null : work.id)}
              >
                {active ? t("workRoutes.hide") : t("workRoutes.show")}
              </calcite-button>
            </div>
          </calcite-card>
        );
      })}

      {route && (
        <>
          <div>
            <h4 style={{ margin: "0.25rem 0 0.5rem", fontSize: "0.95rem" }}>
              {t("workRoutes.stationsHeading", { title: t(`workRoutes.${route.id}.title`) })}
            </h4>
            <ol style={{ margin: 0, paddingLeft: "1.4rem", fontSize: "0.85rem", lineHeight: "1.5" }}>
              {route.stations.map((station) => (
                <li key={station.id} style={{ marginBottom: "0.5rem" }}>
                  <strong>{t(`workRoutes.${route.id}.stations.${station.id}.name`)}</strong>
                  {station.category !== "general" && (
                    <span style={{ color: "var(--calcite-color-text-2)" }}>
                      {" "}({t(`workRoutes.categories.${station.category}`)})
                    </span>
                  )}
                  <br />
                  {t(`workRoutes.${route.id}.stations.${station.id}.text`)}
                  {renderVideos(route, station.id)}
                </li>
              ))}
            </ol>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--calcite-color-text-2)" }}>
              {t("workRoutes.approximate")}
            </p>
          </div>

          <div style={box}>
            <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem" }}>{t("workRoutes.comparisonHeading")}</h4>
            <p style={{ margin: "0 0 0.35rem" }}>
              <strong>{t("workRoutes.shared")}</strong> <CategoryList categories={comparison.shared} emptyKey="workRoutes.none" />
            </p>
            <p style={{ margin: "0 0 0.35rem" }}>
              <strong>{t("workRoutes.onlyWork")}</strong> <CategoryList categories={comparison.onlyWork} emptyKey="workRoutes.none" />
            </p>
            <p style={{ margin: 0 }}>
              <strong>{t("workRoutes.onlyOwn")}</strong> <CategoryList categories={comparison.onlyOwn} emptyKey="workRoutes.none" />
            </p>
          </div>

          <div>
            <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem" }}>{t("analysis.reflectionHeading")}</h4>
            <ol style={{ margin: 0, paddingLeft: "1.4rem", fontSize: "0.85rem", lineHeight: "1.5" }}>
              {(Array.isArray(questions) ? questions : []).concat(t("workRoutes.generalQuestion")).map((question, index) => (
                <li key={index} style={{ marginBottom: "0.4rem" }}>{question}</li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
