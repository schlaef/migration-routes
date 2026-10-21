import React, { useEffect, useRef } from "react";
import { Trans, useTranslation } from "react-i18next";

export default function GuideModal({ open, onClose }) {
  const modalRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;

    const handleClose = () => {
      if (onClose) onClose();
    };

    el.addEventListener("calciteDialogClose", handleClose);
    return () => {
      el.removeEventListener("calciteDialogClose", handleClose);
    };
  }, [onClose]);

  if (!open) return null;

  return (
    <calcite-dialog
      ref={modalRef}
      open
      heading={t("guideModal.title")}
      width-scale="l"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", lineHeight: "1.5" }}>
        <div>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>
            {t("guideModal.perspectiveHeading")}
          </h3>
          <p style={{ margin: 0, color: "var(--calcite-color-text-2)", fontSize: "0.9rem" }}>
            {t("guideModal.perspectiveDescription")}
          </p>
        </div>

        <calcite-notice open icon="view-hide" kind="brand">
          <div slot="title">{t("guideModal.invisibleHeading")}</div>
          <div slot="message">
            <Trans
              i18nKey="guideModal.invisibleDescription"
              components={{ code: <code /> }}
            />
          </div>
        </calcite-notice>

        <div>
          <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem" }}>
            {t("guideModal.corridorsHeading")}
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <calcite-card>
              <div slot="title" style={{ fontSize: "0.9rem", fontWeight: "600" }}>
                {t("guideModal.centralMediterraneanTitle")}
              </div>
              <p style={{ fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>
                {t("guideModal.centralMediterraneanDescription")}
              </p>
            </calcite-card>

            <calcite-card>
              <div slot="title" style={{ fontSize: "0.9rem", fontWeight: "600" }}>
                {t("guideModal.easternMediterraneanTitle")}
              </div>
              <p style={{ fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>
                {t("guideModal.easternMediterraneanDescription")}
              </p>
            </calcite-card>

            <calcite-card>
              <div slot="title" style={{ fontSize: "0.9rem", fontWeight: "600" }}>
                {t("guideModal.westernBalkanTitle")}
              </div>
              <p style={{ fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>
                {t("guideModal.westernBalkanDescription")}
              </p>
            </calcite-card>

            <calcite-card>
              <div slot="title" style={{ fontSize: "0.9rem", fontWeight: "600" }}>
                {t("guideModal.westernMediterraneanTitle")}
              </div>
              <p style={{ fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>
                {t("guideModal.westernMediterraneanDescription")}
              </p>
            </calcite-card>
          </div>
        </div>

        <div>
          <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem" }}>
            {t("guideModal.discussionHeading")}
          </h4>
          <ul style={{ margin: "0", paddingLeft: "1.2rem", fontSize: "0.85rem", color: "var(--calcite-color-text-2)" }}>
            <li>{t("guideModal.discussionQuestion1")}</li>
            <li>{t("guideModal.discussionQuestion2")}</li>
            <li>{t("guideModal.discussionQuestion3")}</li>
          </ul>
        </div>
      </div>

      <div slot="footer-end">
        <calcite-button kind="brand" onClick={onClose}>
          {t("guideModal.close")}
        </calcite-button>
      </div>
    </calcite-dialog>
  );
}
