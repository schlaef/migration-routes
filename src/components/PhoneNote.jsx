import React from "react";
import { useTranslation } from "react-i18next";

/**
 * "The phone here": where a mobile phone helps people on the move with this
 * danger, and where it fails. Texts: phone.categories.<category> in the locale files.
 */
export function getPhoneCategory(descriptionKey) {
  const prefix = "categoryDescriptions.";
  return descriptionKey?.startsWith(prefix) ? descriptionKey.slice(prefix.length) : "general";
}

export default function PhoneNote({ descriptionKey }) {
  const { t } = useTranslation();
  const category = getPhoneCategory(descriptionKey);
  const base = `phone.categories.${category}`;

  return (
    <div
      style={{
        margin: "0.5rem 0",
        padding: "0.6rem 0.75rem",
        borderLeft: "3px solid var(--calcite-color-brand)",
        backgroundColor: "var(--calcite-color-foreground-2, #f8f9fa)",
        fontSize: "0.8rem",
        lineHeight: "1.5"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: "600", marginBottom: "0.3rem" }}>
        <calcite-icon icon="mobile" scale="s" aria-hidden="true" />
        {t("phone.heading")}
      </div>
      <p style={{ margin: "0 0 0.25rem" }}>
        <strong>{t("phone.helps")}</strong> {t(`${base}.helps`)}
      </p>
      <p style={{ margin: 0 }}>
        <strong>{t("phone.fails")}</strong> {t(`${base}.fails`)}
      </p>
    </div>
  );
}
