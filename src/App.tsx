import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { AccordionKeyboard } from "./components/AccordionKeyboard";
import { keyboards } from "./data";
import type { KeyboardDefinition } from "./data";
import favicon from "/favicon.svg";
import { Chord, Scale } from "tonal";
import { formatNoteLabel, toPitchClass } from "./utils/noteUtils";
import type { NoteNotation } from "./utils/noteUtils";

type Language = "en" | "fr";
const STORAGE_KEY = "akm-settings";

/** Static UI translations keyed by language. */
const translations: Record<Language, Record<string, string>> = {
  en: {
    title: "Accordion Keyboard Map",
    keyboard: "Keyboard",
    mode: "Mode",
    chord: "Chord",
    scale: "Scale",
    fundamental: "Root",
    type: "Type",
    apply: "Apply",
    legend: "Legend",
    legendUnselected: "Not selected",
    legendSelected: "Selected",
    legendPush: "Push",
    legendPull: "Pull",
    settings: "Settings",
    language: "Language",
    notation: "Notation",
    notationAnglo: "C, D, E",
    notationFrench: "Do, Ré, Mi",
    feedback: "Feedback",
    feedbackPlaceholder: "Please send any feedback regarding the use of the app.",
    feedbackSend: "Send feedback",
    showLegend: "Show legend"
  },
  fr: {
    title: "Clavier d'accordéon",
    keyboard: "Clavier",
    mode: "Mode",
    chord: "Accord",
    scale: "Gamme",
    fundamental: "Fondamentale",
    type: "Type",
    apply: "Appliquer",
    legend: "Légende",
    legendUnselected: "Non sélectionné",
    legendSelected: "Sélectionné",
    legendPush: "Poussé",
    legendPull: "Tiré",
    settings: "Paramètres",
    language: "Langue",
    notation: "Notation",
    notationAnglo: "C, D, E",
    notationFrench: "Do, Ré, Mi",
    feedback: "Retour",
    feedbackPlaceholder: "Veuillez envoyer tout retour sur l'utilisation de l'application.",
    feedbackSend: "Envoyer",
    showLegend: "Afficher la légende"
  }
};

/** Chord qualities offered by the selector. */
const chordTypes = ["maj","min","7","m7","maj7","dim","aug","sus2","sus4"];
/** Scale types offered by the selector. */
const scaleTypes = ["major","minor","harmonic minor","melodic minor","dorian","phrygian","lydian","mixolydian","locrian"];
const scaleLabelsFr: Record<string, string> = {
  "major": "majeure",
  "minor": "mineure",
  "harmonic minor": "mineure harmonique",
  "melodic minor": "mineure mélodique",
  "dorian": "dorien",
  "phrygian": "phrygien",
  "lydian": "lydien",
  "mixolydian": "mixolydien",
  "locrian": "locrien"
};
const rootNotes = ["C","C#","Db","D","D#","Eb","E","F","F#","Gb","G","G#","Ab","A","A#","Bb","B"];

/**
 * Root UI for selecting an accordion layout and highlighting notes belonging
 * to the chosen chord or scale.
 */
export const App: React.FC = () => {
  const defaultKeyboard = keyboards.find(k => k.id === "image-3rangs") ?? keyboards[0];
  const [selectedKeyboard, setSelectedKeyboard] = useState<KeyboardDefinition>(defaultKeyboard);
  const [selectionMode, setSelectionMode] = useState<"chord" | "scale">("chord");
  const [highlightNotes, setHighlightNotes] = useState<number[]>([]);
  const [highlightLabels, setHighlightLabels] = useState<Record<number, string>>({});
  const [language, setLanguage] = useState<Language>("en");
  const [notation, setNotation] = useState<NoteNotation>("anglo");
  const zoomLevels = [0.7, 0.8, 0.9, 1, 1.2] as const;
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 520px)").matches;
  const [zoomIndex, setZoomIndex] = useState(isMobile ? 1 : 3);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<"selection" | "settings">("selection");
  const [feedbackText, setFeedbackText] = useState("");
  const [showLegend, setShowLegend] = useState(true);

  const [fundamental, setFundamental] = useState("C");
  const [type, setType] = useState("maj");

  const t = useMemo(() => translations[language], [language]);

  /**
   * Compute the notes for the current chord or scale selection and store them
   * without octave markers so the keyboard can highlight matching halves.
   */
  const applySelection = () => {
    let notes: string[] = [];
    if (selectionMode === "chord") {
      notes = Chord.get(`${fundamental}${type}`).notes;
    } else {
      notes = Scale.get(`${fundamental} ${type}`).notes;
    }
    const normalized = notes
      .map(toPitchClass)
      .filter((pc): pc is number => pc !== undefined);

    const labels: Record<number, string> = {};
    notes.forEach(note => {
      const pc = toPitchClass(note);
      if (pc !== undefined) {
        labels[pc] = note.replace(/[0-9]/g, ""); // keep accidental from current selection
      }
    });

    setHighlightNotes(normalized);
    setHighlightLabels(labels);
  };

  // Keep a sensible default type when switching modes
  useEffect(() => {
    if (selectionMode === "chord") {
      setType("maj");
    } else {
      setType("major");
    }
  }, [selectionMode]);

  // Apply the current selection automatically when inputs change
  useEffect(() => {
    applySelection();
  }, [fundamental, type, selectionMode]);

  const selectionTypeLabel = selectionMode === "scale" && language === "fr"
    ? scaleLabelsFr[type] ?? type
    : type;
  const selectionLabel = `${formatNoteLabel(fundamental, notation)} ${selectionTypeLabel}`;

  const zoomIn = () => setZoomIndex(i => Math.min(zoomLevels.length - 1, i + 1));
  const zoomOut = () => setZoomIndex(i => Math.max(0, i - 1));
  const openDrawer = (view: "selection" | "settings") => {
    setDrawerView(view);
    setDrawerOpen(true);
  };
  const closeDrawer = () => setDrawerOpen(false);

  // Keep document title in sync with language/app title
  useEffect(() => {
    document.title = t.title;
  }, [t.title]);

  // Load saved preferences on first render
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<{
          keyboardId: string;
          language: Language;
          notation: NoteNotation;
          fundamental: string;
          type: string;
          selectionMode: "chord" | "scale";
          zoomIndex: number;
          showLegend: boolean;
        }>;
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.notation) setNotation(parsed.notation);
        if (parsed.fundamental) setFundamental(parsed.fundamental);
        if (parsed.type) setType(parsed.type);
        if (parsed.selectionMode) {
          setSelectionMode(parsed.selectionMode);
        }
        if (typeof parsed.zoomIndex === "number") {
          const clamped = Math.min(Math.max(0, parsed.zoomIndex), zoomLevels.length - 1);
          setZoomIndex(clamped);
        }
        if (parsed.keyboardId) {
          const kb = keyboards.find(k => k.id === parsed.keyboardId);
          if (kb) setSelectedKeyboard(kb);
        }
        if (typeof parsed.showLegend === "boolean") {
          setShowLegend(parsed.showLegend);
        }
        return;
      }
      // No saved language: infer from browser locale
      const navLang = (navigator.language || navigator.languages?.[0] || "").toLowerCase();
      if (navLang.startsWith("fr")) {
        setLanguage("fr");
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  // Persist preferences whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          keyboardId: selectedKeyboard.id,
          language,
          notation,
          fundamental,
          type,
          selectionMode,
          zoomIndex,
          showLegend
        })
      );
    } catch {
      // storage may be unavailable (private mode)
    }
  }, [selectedKeyboard.id, language, notation, fundamental, type, selectionMode, zoomIndex, showLegend]);

  const submitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    const body = encodeURIComponent(feedbackText.trim());
    const subject = encodeURIComponent("Accordion keyboard - user feedback");
    const mailto = `mailto:accordion@shogunweb.be?subject=${subject}${body ? `&body=${body}` : ""}`;
    window.location.href = mailto;
  };

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <img className="brand-mark" src={favicon} alt="Accordion keyboard icon" />
          <h1 className="app-title">{t.title}</h1>
        </div>
      </header>

      <section className="panel-card keyboard-card">
        <div className="keyboard-wrapper">
          <div className="keyboard-overlay">
            <button
              className="pill pill-button"
              type="button"
              aria-expanded={drawerOpen && drawerView === "selection"}
              aria-label="Edit chord or scale selection"
              onClick={() => openDrawer("selection")}
            >
              {selectionLabel}
            </button>
            <div className="zoom-controls" aria-label="Resize keyboard">
              <button
                className="zoom-button"
                type="button"
                onClick={zoomIn}
                disabled={zoomIndex === zoomLevels.length - 1}
                aria-label="Increase keyboard size"
              >
                +
              </button>
              <button
                className="zoom-button"
                type="button"
                onClick={zoomOut}
                disabled={zoomIndex === 0}
                aria-label="Decrease keyboard size"
              >
                −
              </button>
            </div>
            <div className="mode-toggle" aria-label={t.mode}>
              <button
                type="button"
                className={`mode-button ${selectionMode === "chord" ? "active" : ""}`}
                onClick={() => setSelectionMode("chord")}
              >
                {t.chord}
              </button>
              <button
                type="button"
                className={`mode-button ${selectionMode === "scale" ? "active" : ""}`}
                onClick={() => setSelectionMode("scale")}
              >
                {t.scale}
              </button>
            </div>
          </div>
          <AccordionKeyboard
            rows={selectedKeyboard.rows}
            highlightNotes={highlightNotes}
            highlightLabels={highlightLabels}
            notation={notation}
            scale={zoomLevels[zoomIndex]}
          />
          {showLegend && (
            <div className="legend legend-inline">
              <span className="legend-text">{t.legendPush}</span>
              <span className="split-circle" aria-hidden="true">
                <span className="half left" />
                <span className="half right" />
              </span>
              <span className="legend-text">{t.legendPull}</span>
            </div>
          )}
          <button
            className="settings-fab"
            type="button"
            aria-label={t.settings}
            onClick={() => openDrawer("settings")}
          >
            ⚙︎
          </button>
        </div>
      </section>

      {drawerOpen && <div className="drawer-backdrop" onClick={closeDrawer} aria-hidden="true" />}
      <aside
        className={`side-drawer ${drawerOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={drawerView === "selection" ? (selectionMode === "chord" ? t.chord : t.scale) : t.settings}
      >
        <div className="drawer-header">
          <h2 className="drawer-title">
            {drawerView === "selection" ? (selectionMode === "chord" ? t.chord : t.scale) : t.settings}
          </h2>
          <button className="drawer-close" type="button" onClick={closeDrawer} aria-label="Close panel">×</button>
        </div>
        <div className="drawer-content">
          {drawerView === "selection" ? (
            <div className="selector-grid">
              <label className="field">
                <span>{t.fundamental}</span>
                <select value={fundamental} onChange={e => setFundamental(e.target.value)}>
                  {rootNotes.map(n => (
                    <option key={n} value={n}>{formatNoteLabel(n, notation)}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t.type}</span>
                <select value={type} onChange={e => setType(e.target.value)}>
                  {selectionMode === "chord"
                    ? chordTypes.map(tVal => <option key={tVal} value={tVal}>{tVal}</option>)
                    : scaleTypes.map(tVal => (
                      <option key={tVal} value={tVal}>
                        {language === "fr" ? scaleLabelsFr[tVal] ?? tVal : tVal}
                      </option>
                    ))
                  }
                </select>
              </label>
            </div>
          ) : (
            <div className="selector-grid settings-grid">
              <label className="field">
                <span>{t.keyboard}</span>
                <select
                  value={selectedKeyboard.id}
                  onChange={e => {
                    const kb = keyboards.find(k => k.id === e.target.value);
                    if (kb) setSelectedKeyboard(kb);
                  }}
                >
                  {keyboards.map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t.language}</span>
                <select value={language} onChange={e => setLanguage(e.target.value as Language)}>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </label>
              <label className="field">
                <span>{t.notation}</span>
                <div className="toggle">
                  <button
                    type="button"
                    className={`toggle-option ${notation === "anglo" ? "active" : ""}`}
                    onClick={() => setNotation("anglo")}
                  >
                    {t.notationAnglo}
                  </button>
                  <button
                    type="button"
                    className={`toggle-option ${notation === "fr" ? "active" : ""}`}
                    onClick={() => setNotation("fr")}
                  >
                    {t.notationFrench}
                  </button>
                </div>
              </label>
              <label className="field checkbox-field">
                <span>{t.showLegend}</span>
                <input
                  type="checkbox"
                  checked={showLegend}
                  onChange={e => setShowLegend(e.target.checked)}
                />
              </label>
              <form className="field feedback" onSubmit={submitFeedback}>
                <div className="feedback-header">
                  <span>{t.feedback}</span>
                  <button className="send-button" type="submit">{t.feedbackSend}</button>
                </div>
                <textarea
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder={t.feedbackPlaceholder}
                  rows={4}
                />
              </form>
              <a
                className="source-link"
                href="https://github.com/ShogunWeb/Accordion-keyboard-map"
                target="_blank"
                rel="noreferrer"
              >
                <svg className="github-mark" aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                  <path
                    fill="currentColor"
                    d="M12 2a10 10 0 0 0-3.162 19.492c.5.092.683-.217.683-.483 0-.238-.01-1.024-.014-1.858-2.782.604-3.37-1.19-3.37-1.19-.455-1.156-1.11-1.465-1.11-1.465-.908-.62.069-.608.069-.608 1.004.07 1.532 1.03 1.532 1.03.893 1.53 2.341 1.087 2.91.831.09-.647.35-1.088.636-1.339-2.22-.253-4.556-1.11-4.556-4.944 0-1.092.39-1.987 1.03-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.56 9.56 0 0 1 2.5.336c1.909-1.295 2.748-1.026 2.748-1.026.546 1.378.202 2.397.1 2.65.64.701 1.028 1.596 1.028 2.688 0 3.844-2.34 4.688-4.57 4.936.36.31.68.923.68 1.86 0 1.344-.012 2.428-.012 2.758 0 .268.18.58.688.48A10 10 0 0 0 12 2Z"
                  />
                </svg>
                <span>Source code</span>
              </a>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
