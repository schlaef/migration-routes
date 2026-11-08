import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { buildEmbedUrl, buildWatchUrl, localizeText } from "../category-videos.js";

function formatTime(seconds) {
  if (seconds === undefined) return "";
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function CategoryVideo({ video }) {
  const { t, i18n } = useTranslation();
  const [loaded, setLoaded] = useState(false);
  const language = i18n.resolvedLanguage || i18n.language;

  const title = localizeText(video.title, language);
  const note = localizeText(video.note, language);
  const source = localizeText(video.source, language);
  const caption = localizeText(video.caption, language);
  const range = video.start !== undefined || video.end !== undefined
    ? `${formatTime(video.start ?? 0)}${video.end !== undefined ? `–${formatTime(video.end)}` : ""}`
    : "";

  return (
    <figure style={{ margin: "0.75rem 0" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
        <calcite-chip scale="s" kind="neutral" appearance="outline-fill" icon="video">
          {t(`videos.kinds.${video.kind}`)}
        </calcite-chip>
        <strong style={{ fontSize: "0.85rem" }}>{title}</strong>
      </div>

      {note && (
        <p style={{ fontSize: "0.8rem", lineHeight: "1.45", margin: "0 0 0.5rem" }}>
          <strong>{t("videos.guidingQuestion")}</strong> {note}
        </p>
      )}

      {loaded ? (
        <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: "#000" }}>
          <iframe
            src={buildEmbedUrl(video)}
            title={title || t("videos.iframeTitle")}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>
      ) : (
        <div
          style={{
            border: "1px solid var(--calcite-color-border-2)",
            background: "var(--calcite-color-foreground-2)",
            borderRadius: "4px",
            padding: "0.75rem",
            fontSize: "0.8rem",
            lineHeight: "1.45"
          }}
        >
          {video.contentWarning && (
            <calcite-notice open kind="warning" scale="s" icon="exclamation-mark-triangle" style={{ marginBottom: "0.5rem" }}>
              <div slot="message">{localizeText(video.contentWarningText, language) || t("videos.contentWarning")}</div>
            </calcite-notice>
          )}
          <p style={{ margin: "0 0 0.5rem", color: "var(--calcite-color-text-2)" }}>{t("videos.privacyNotice")}</p>
          <calcite-button
            scale="s"
            icon-start="play"
            onClick={() => setLoaded(true)}
          >
            {range ? t("videos.loadClip", { range }) : t("videos.load")}
          </calcite-button>
        </div>
      )}

      <figcaption style={{ fontSize: "0.8rem", color: "var(--calcite-color-text-2)", marginTop: "0.25rem" }}>
        {caption && <span style={{ display: "block" }}>{caption}</span>}
        {source && <span style={{ display: "block" }}>{t("videos.source", { source })}</span>}
        <a href={buildWatchUrl(video)} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
          {t("videos.openOnYoutube")}
        </a>
        {video.sourceUrl && (
          <a href={video.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
            {t("analysis.linkToResource")}
          </a>
        )}
      </figcaption>
    </figure>
  );
}
