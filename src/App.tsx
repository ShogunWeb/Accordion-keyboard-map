import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { AccordionKeyboard } from "./components/AccordionKeyboard";
import { keyboards } from "./data/keyboards";
import type { KeyboardDefinition } from "./data/keyboards";
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
    notationAnglo: "English (A B C)",
    notationFrench: "French (Do Ré Mi)",
    feedback: "Feedback",
    feedbackPlaceholder: "Please send any feedback regarding the use of the app. Include your email if you want to be contacted for further discussions.",
    feedbackSend: "Send feedback"
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
    notationAnglo: "Anglo-saxonne (A B C)",
    notationFrench: "Française (Do Ré Mi)",
    feedback: "Retour",
    feedbackPlaceholder: "Veuillez envoyer tout retour sur l'utilisation de l'application. Ajoutez votre email si vous souhaitez être recontacté.",
    feedbackSend: "Envoyer"
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
  const [selectedKeyboard, setSelectedKeyboard] = useState<KeyboardDefinition>(keyboards[0]);
  const [activeTab, setActiveTab] = useState<"chord" | "scale" | "settings">("chord");
  const [selectionMode, setSelectionMode] = useState<"chord" | "scale">("chord");
  const [highlightNotes, setHighlightNotes] = useState<number[]>([]);
  const [highlightLabels, setHighlightLabels] = useState<Record<number, string>>({});
  const [language, setLanguage] = useState<Language>("en");
  const [notation, setNotation] = useState<NoteNotation>("anglo");
  const [showKeyboardName, setShowKeyboardName] = useState(false);
  const [showSelectors, setShowSelectors] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

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

  const handleTabChange = (tab: "chord" | "scale" | "settings") => {
    setActiveTab(tab);
    if (tab !== "settings") {
      setSelectionMode(tab);
    }
    setShowSelectors(false);
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
  const tabButtons: { id: "chord" | "scale" | "settings"; label: string }[] = [
    { id: "chord", label: t.chord },
    { id: "scale", label: t.scale },
    { id: "settings", label: t.settings },
  ];

  // Keep keyboard name hidden on first render
  useEffect(() => {
    setShowKeyboardName(false);
  }, []);

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
        }>;
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.notation) setNotation(parsed.notation);
        if (parsed.fundamental) setFundamental(parsed.fundamental);
        if (parsed.type) setType(parsed.type);
        if (parsed.selectionMode) {
          setSelectionMode(parsed.selectionMode);
          setActiveTab(parsed.selectionMode);
        }
        if (parsed.keyboardId) {
          const kb = keyboards.find(k => k.id === parsed.keyboardId);
          if (kb) setSelectedKeyboard(kb);
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
          selectionMode
        })
      );
    } catch {
      // storage may be unavailable (private mode)
    }
  }, [selectedKeyboard.id, language, notation, fundamental, type, selectionMode]);

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
          <div className="brand-mark">AK</div>
          <div>
            <p className="eyebrow">{t.keyboard}</p>
            <h1 className="app-title">{t.title}</h1>
          </div>
        </div>
      </header>

      <nav className="tab-bar" role="tablist" aria-label="Modes">
        {tabButtons.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {(activeTab === "settings" || showSelectors) && (
        <section className="panel-card">
          {activeTab === "settings" ? (
          <div className="selector-grid settings-grid">
            <label className="field">
              <span>{t.keyboard}</span>
              <select
                value={selectedKeyboard.id}
                  onChange={e => {
                    const kb = keyboards.find(k => k.id === e.target.value);
                    if (kb) setSelectedKeyboard(kb);
                    setShowKeyboardName(false);
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
          </div>
        ) : (
            <div className="selector-grid selector-inline">
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
          )}
        </section>
      )}

      <section className="panel-card keyboard-card">
        <div className="keyboard-top">
          <div className="keyboard-label">
            <p className="eyebrow">{t.keyboard}</p>
            <button
              className="icon-button"
              aria-expanded={showKeyboardName}
              aria-label="Show keyboard name"
              onClick={() => setShowKeyboardName(v => !v)}
            >
              ℹ︎
            </button>
          </div>
          <button
            className="pill pill-button"
            type="button"
            aria-expanded={showSelectors}
            aria-label="Edit chord or scale selection"
            onClick={() => setShowSelectors(v => !v)}
          >
            {selectionLabel}
          </button>
        </div>
        {showKeyboardName && (
          <div className="keyboard-name-chip" role="status">
            {selectedKeyboard.name}
          </div>
        )}

        <div className="keyboard-wrapper">
          <AccordionKeyboard
            rows={selectedKeyboard.rows}
            highlightNotes={highlightNotes}
            highlightLabels={highlightLabels}
            notation={notation}
          />
        </div>

        <div className="legend">
          <span className="legend-text">{t.legendPush}</span>
          <span className="split-circle" aria-hidden="true">
            <span className="half left" />
            <span className="half right" />
          </span>
          <span className="legend-text">{t.legendPull}</span>
        </div>
      </section>
    </div>
  );
};
