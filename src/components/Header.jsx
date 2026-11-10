import React from "react";
import { useTranslation } from "react-i18next";

export default function Header({
  returnLink,
  routeCount,
  analyzing,
  onAnalyze,
  onClear,
  onOpenSettings,
  onOpenGuide,
  panelOpen,
  onTogglePanel
}) {
  const { t } = useTranslation();
  const panelText = panelOpen ? t("header.collapsePanel") : t("header.expandPanel");

  return (
    <calcite-navigation slot="header">
      <calcite-navigation-logo
        slot="logo"
        heading={t("header.title")}
        description={t("header.subtitle")}
        icon="compass"
      />

      {returnLink && (
        <div slot="content-start" style={{ display: "flex", alignItems: "center", paddingInline: "0.5rem" }}>
          <calcite-button
            appearance="outline"
            kind="neutral"
            icon-start="arrow-left"
            href={returnLink.url}
            title={t("header.backTooltip", { host: returnLink.host })}
          >
            {returnLink.label || t("header.back")}
          </calcite-button>
        </div>
      )}

      <div
        slot="content-end"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <calcite-button
          appearance="solid"
          kind="brand"
          icon-start="analysis"
          loading={analyzing ? true : undefined}
          disabled={routeCount === 0 || analyzing ? true : undefined}
          onClick={onAnalyze}
          title={routeCount === 0 ? t("header.analyzeDisabledTooltip") : t("header.analyzeTooltip")}
        >
          {analyzing ? t("header.analyzing") : t("header.analyze")}
        </calcite-button>

        <calcite-button
          appearance="outline"
          kind="neutral"
          icon-start="trash"
          disabled={routeCount === 0 || analyzing ? true : undefined}
          onClick={onClear}
          title={t("header.clearTooltip")}
        >
          {t("header.clear")}
        </calcite-button>

        <calcite-action
          text={t("header.settings")}
          icon="gear"
          text-enabled={false}
          onClick={onOpenSettings}
          title={t("header.settings")}
        />

        <calcite-action
          text={t("header.guide")}
          icon="information"
          text-enabled={false}
          onClick={onOpenGuide}
          title={t("header.guide")}
        />

        <calcite-action
          text={panelText}
          icon={panelOpen ? "chevrons-right" : "chevrons-left"}
          text-enabled={false}
          onClick={onTogglePanel}
          title={panelText}
        />
      </div>
    </calcite-navigation>
  );
}
