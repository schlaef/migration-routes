/*
 * DATEN DER ZEUGINNEN UND ZEUGEN
 * ------------------------------
 * Neue Person hinzufügen:
 *   1. Foto in den Ordner "bilder/" legen (z. B. bilder/anna.jpg, Hochformat 3:4).
 *   2. Unten einen neuen Eintrag { ... } kopieren und ausfüllen.
 *   3. "id" muss eindeutig sein, nur Kleinbuchstaben/Bindestriche (wird Teil des Links).
 *
 * Felder:
 *   id, name, lebensdaten, kurztext (für die Übersicht), bild, bildnachweis,
 *   eckdaten: Liste von [Bezeichnung, Wert]
 *   zitat (optional), geschichte: Liste von Absätzen,
 *   video (optional, YouTube-Link), quellen: Liste von Texten oder {text, url}
 *
 * HINWEIS: Die folgenden Einträge sind PLATZHALTER und müssen durch
 * echte, belegte Zeugnisse (mit Einverständnis/Quellenangabe) ersetzt werden.
 */
window.ZEUGEN = [
  {
    id: "zeugin-1",
    name: "Zeugin 1 (Platzhalter)",
    lebensdaten: "geb. 19xx",
    kurztext: "Kurzer Satz, der neugierig auf die Geschichte macht.",
    bild: "bilder/platzhalter.svg",
    bildnachweis: "Bildnachweis eintragen",
    eckdaten: [
      ["Herkunft", "Ort / Kanton"],
      ["Verdingt", "von 19xx bis 19xx"],
      ["Pflegeplatz", "z. B. Bauernhof im Emmental"],
    ],
    zitat: "Hier steht ein prägendes Zitat der Zeugin.",
    geschichte: [
      "Erster Absatz: Kindheit und Familie vor der Fremdplatzierung.",
      "Zweiter Absatz: Wie es zur Verdingung kam und das Leben am Pflegeplatz.",
      "Dritter Absatz: Das Leben danach – und wie die Erfahrung nachwirkt.",
    ],
    video: "",
    quellen: ["Quelle eintragen (Interview, Buch, Archiv)"],
  },
  {
    id: "zeuge-2",
    name: "Zeuge 2 (Platzhalter)",
    lebensdaten: "geb. 19xx",
    kurztext: "Kurzer Satz, der neugierig auf die Geschichte macht.",
    bild: "bilder/platzhalter.svg",
    bildnachweis: "Bildnachweis eintragen",
    eckdaten: [
      ["Herkunft", "Ort / Kanton"],
      ["Verdingt", "von 19xx bis 19xx"],
    ],
    zitat: "",
    geschichte: ["Geschichte hier eintragen."],
    video: "",
    quellen: [],
  },
  {
    id: "zeugin-3",
    name: "Zeugin 3 (Platzhalter)",
    lebensdaten: "geb. 19xx",
    kurztext: "Kurzer Satz, der neugierig auf die Geschichte macht.",
    bild: "bilder/platzhalter.svg",
    bildnachweis: "Bildnachweis eintragen",
    eckdaten: [["Herkunft", "Ort / Kanton"]],
    zitat: "",
    geschichte: ["Geschichte hier eintragen."],
    video: "",
    quellen: [],
  },
];
