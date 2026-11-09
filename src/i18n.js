import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import * as intl from "@arcgis/core/intl.js";
import en from "./locales/en/translation.json";
import de from "./locales/de/translation.json";
import it from "./locales/it/translation.json";
import fr from "./locales/fr/translation.json";

export const SUPPORTED_LANGUAGES = ["de", "fr", "it", "en"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      it: { translation: it },
      fr: { translation: fr }
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES,
    load: "languageOnly",
    detection: {
      // ?lang=it lets teachers share a link in the target language
      order: ["querystring", "localStorage", "navigator"],
      lookupQuerystring: "lang",
      caches: ["localStorage"]
    },
    interpolation: {
      escapeValue: false
    }
  });

// Propagate the language to everything outside React: the lang attribute (read by
// Calcite and ArcGIS map components such as arcgis-sketch) and ArcGIS core strings.
function applyLanguage(language) {
  const code = SUPPORTED_LANGUAGES.find((lng) => language?.startsWith(lng)) || "en";
  if (typeof document !== "undefined") document.documentElement.lang = code;
  intl.setLocale(code);
}

i18n.on("languageChanged", applyLanguage);
if (i18n.resolvedLanguage) applyLanguage(i18n.resolvedLanguage);

export default i18n;