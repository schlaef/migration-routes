import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { CODE_LICENCE, CONTENT_LICENCE, DATA_SOURCES, SOFTWARE, getEmbeddedVideos } from "../legal.js";
import LicenceNotice from "./LicenceNotice.jsx";
import categoryVideos from "../assets/categories/videos.json";

const sectionStyle = { margin: "0 0 1.25rem" };
const headingStyle = { fontSize: "0.95rem", margin: "0 0 0.5rem" };
const textStyle = { fontSize: "0.85rem", lineHeight: "1.5", margin: "0 0 0.5rem" };
const listStyle = { margin: 0, paddingLeft: "1.2rem", fontSize: "0.85rem", lineHeight: "1.5" };

/**
 * «Licences & sources»: licence of the own content, embedded videos, maps and geodata,
 * software, privacy notice and (if configured) imprint.
 */
export default function LegalModal({ open, onClose, imprint }) {
  const { t } = useTranslation();
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const handleClose = () => onClose?.();
    dialog.addEventListener("calciteDialogClose", handleClose);
    return () => dialog.removeEventListener("calciteDialogClose", handleClose);
  }, [open, onClose]);

  if (!open) return null;

  const videos = getEmbeddedVideos(categoryVideos).map(({ video, context, watchUrl }) => {
    const prefix = context.workId
      ? context.stationId
        ? `workRoutes.${context.workId}.stations.${context.stationId}.videos.${video.key}`
        : `workRoutes.${context.workId}.videos.${video.key}`
      : null;
    const title = prefix ? t(`${prefix}.title`, { defaultValue: "" }) : video.title;
    const where = context.workId ? t(`workRoutes.${context.workId}.title`) : t(`workRoutes.categories.${context.category}`, { defaultValue: context.category });
    return { key: `${video.videoId}-${video.start ?? 0}`, where, notice: { title, author: video.source, licenseKey: "embedded", sourceUrl: watchUrl } };
  });

  const privacy = t("legal.privacy.items", { returnObjects: true });

  return (
    <calcite-dialog ref={dialogRef} open heading={t("legal.title")} width-scale="m">
      <section style={sectionStyle}>
        <h3 style={headingStyle}>{t("legal.contentHeading")}</h3>
        <p style={textStyle}>{t("legal.contentText")}</p>
        <LicenceNotice item={CONTENT_LICENCE} />
        <p style={{ ...textStyle, marginTop: "0.5rem" }}>{t("legal.codeText")}</p>
        <LicenceNotice item={CODE_LICENCE} />
      </section>

      <section style={sectionStyle}>
        <h3 style={headingStyle}>{t("legal.videosHeading")}</h3>
        <p style={textStyle}>{t("legal.videosText")}</p>
        {videos.length > 0 ? (
          <ul style={listStyle}>
            {videos.map((entry) => (
              <li key={entry.key}>
                <strong>{entry.where}:</strong> <LicenceNotice item={entry.notice} style={{ display: "inline" }} />
              </li>
            ))}
          </ul>
        ) : (
          <p style={textStyle}>{t("legal.none")}</p>
        )}
      </section>

      <section style={sectionStyle}>
        <h3 style={headingStyle}>{t("legal.dataHeading")}</h3>
        <p style={textStyle}>{t("legal.dataText")}</p>
        <ul style={listStyle}>
          {DATA_SOURCES.map((source) => (
            <li key={source.id}>
              <LicenceNotice item={source} style={{ display: "inline" }} />
            </li>
          ))}
        </ul>
      </section>

      <section style={sectionStyle}>
        <h3 style={headingStyle}>{t("legal.softwareHeading")}</h3>
        <ul style={listStyle}>
          {SOFTWARE.map((library) => (
            <li key={library.title}>
              <LicenceNotice item={library} style={{ display: "inline" }} />
            </li>
          ))}
        </ul>
      </section>

      <section style={sectionStyle}>
        <h3 style={headingStyle}>{t("legal.privacy.heading")}</h3>
        <p style={textStyle}>{t("legal.privacy.intro")}</p>
        <ul style={listStyle}>
          {(Array.isArray(privacy) ? privacy : []).map((text, index) => (
            <li key={index} style={{ marginBottom: "0.35rem" }}>{text}</li>
          ))}
        </ul>
      </section>

      {imprint && (
        <section style={sectionStyle}>
          <h3 style={headingStyle}>{t("legal.imprintHeading")}</h3>
          <p style={{ ...textStyle, whiteSpace: "pre-line" }}>{imprint}</p>
        </section>
      )}

      <calcite-button slot="footer-end" kind="brand" onClick={onClose}>
        {t("legal.close")}
      </calcite-button>
    </calcite-dialog>
  );
}
