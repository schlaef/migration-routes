import React from "react";
import { useTranslation } from "react-i18next";
import { localizeText } from "../category-videos.js";

/**
 * Licence notice following the TULLU rule: title, author, licence (with link), source,
 * plus changes if the material was modified.
 * Fields: title, author, license | licenseKey, licenseUrl, sourceUrl, changes | changesKey.
 */
export default function LicenceNotice({ item, style }) {
  const { t, i18n } = useTranslation();
  if (!item) return null;
  const language = i18n.resolvedLanguage;
  const title = localizeText(item.title, language);
  const licence = item.licenseKey ? t(`legal.licences.${item.licenseKey}`) : item.license;
  const changes = item.changesKey ? t(`legal.changes.${item.changesKey}`) : localizeText(item.changes, language);
  const link = (href, text) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {text}
    </a>
  );

  return (
    <span style={{ display: "block", fontSize: "0.78rem", lineHeight: "1.45", ...style }}>
      {title && <>«{title}» </>}
      {item.author && <>{t("legal.by", { author: item.author })}</>}
      {licence && (
        <>
          {", "}
          {item.licenseUrl ? link(item.licenseUrl, licence) : licence}
        </>
      )}
      {item.sourceUrl && (
        <>
          {", "}
          {link(item.sourceUrl, t("legal.source"))}
        </>
      )}
      {changes && <>{` (${changes})`}</>}
    </span>
  );
}
