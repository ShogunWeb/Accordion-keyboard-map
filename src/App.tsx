import React, { useEffect, useMemo, useState } from "react";
import { AccordionKeyboard } from "./components/AccordionKeyboard";
import { keyboards } from "./data/keyboards";
import type { KeyboardDefinition } from "./data/keyboards";
import { Chord, Scale } from "tonal";
import { formatNoteLabel, toPitchClass } from "./utils/noteUtils";
import type { NoteNotation } from "./utils/noteUtils";

type Language = "en" | "fr";

/** Static UI translations keyed by language. */
const translations: Record<Language, Record<string, string>> = {
  en: {
    title: "Diatonic Keyboard",
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
    settings: "Settings",
    language: "Language",
    notation: "Notation",
    notationAnglo: "English (A B C)",
    notationFrench: "French (Do Ré Mi)",
  },
  fr: {
    title: "Clavier Diatonique",
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
    settings: "Paramètres",
    language: "Langue",
    notation: "Notation",
    notationAnglo: "Anglo-saxonne (A B C)",
    notationFrench: "Française (Do Ré Mi)",
  }
};

/** Chord qualities offered by the selector. */
const chordTypes = ["maj","min","7","m7","maj7","dim","aug","sus2","sus4"];
/** Scale types offered by the selector. */
const scaleTypes = ["major","minor","harmonic minor","melodic minor","dorian","phrygian","lydian","mixolydian","locrian"];

/**
 * Root UI for selecting an accordion layout and highlighting notes belonging
 * to the chosen chord or scale.
 */
export const App: React.FC = () => {
  const [selectedKeyboard, setSelectedKeyboard] = useState<KeyboardDefinition>(keyboards[0]);
  const [highlightNotes, setHighlightNotes] = useState<number[]>([]);
  const [highlightLabels, setHighlightLabels] = useState<Record<number, string>>({});
  const [language, setLanguage] = useState<Language>("fr");
  const [notation, setNotation] = useState<NoteNotation>("anglo");

  const [mode, setMode] = useState<"chord" | "scale">("chord");
  const [fundamental, setFundamental] = useState("C");
  const [type, setType] = useState("maj");

  const t = useMemo(() => translations[language], [language]);

  /**
   * Compute the notes for the current chord or scale selection and store them
   * without octave markers so the keyboard can highlight matching halves.
   */
  const applySelection = () => {
    let notes: string[] = [];
    if (mode === "chord") {
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
    if (mode === "chord") {
      setType("maj");
    } else {
      setType("major");
    }
  }, [mode]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>{t.title}</h1>

      {/* Settings */}
      <section style={{ marginBottom: "15px" }}>
        <strong>{t.settings}</strong>
        <div style={{ display: "flex", gap: "10px", marginTop: "6px", flexWrap: "wrap" }}>
          <label>
            {t.language} :{" "}
            <select value={language} onChange={e => setLanguage(e.target.value as Language)}>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </label>
          <label>
            {t.notation} :{" "}
            <select value={notation} onChange={e => setNotation(e.target.value as NoteNotation)}>
              <option value="anglo">{t.notationAnglo}</option>
              <option value="fr">{t.notationFrench}</option>
            </select>
          </label>
        </div>
      </section>

      {/* Sélecteur clavier */}
      <label>
        {t.keyboard} :{" "}
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

      <hr style={{ margin: "10px 0" }} />

      {/* Sélecteur fondamental et type */}
      <label>
        {t.mode} :{" "}
        <select value={mode} onChange={e => setMode(e.target.value as "chord" | "scale")}>
          <option value="chord">{t.chord}</option>
          <option value="scale">{t.scale}</option>
        </select>
      </label>
      <label style={{ marginLeft: "10px" }}>
        {t.fundamental} :{" "}
        <select value={fundamental} onChange={e => setFundamental(e.target.value)}>
          {["C","C#","Db","D","D#","Eb","E","F","F#","Gb","G","G#","Ab","A","A#","Bb","B"].map(n => (
            <option key={n} value={n}>{formatNoteLabel(n, notation)}</option>
          ))}
        </select>
      </label>
      <label style={{ marginLeft: "10px" }}>
        {t.type} :{" "}
        <select value={type} onChange={e => setType(e.target.value)}>
          {mode === "chord"
            ? chordTypes.map(tVal => <option key={tVal} value={tVal}>{tVal}</option>)
            : scaleTypes.map(tVal => (
              <option key={tVal} value={tVal}>
                {language === "fr"
                  ? ({
                      "major": "majeure",
                      "minor": "mineure",
                      "harmonic minor": "mineure harmonique",
                      "melodic minor": "mineure mélodique",
                      "dorian": "dorien",
                      "phrygian": "phrygien",
                      "lydian": "lydien",
                      "mixolydian": "mixolydien",
                      "locrian": "locrien"
                    } as Record<string, string>)[tVal] ?? tVal
                  : tVal}
              </option>
            ))
          }
        </select>
      </label>

      <button style={{ marginLeft: "10px" }} onClick={applySelection}>{t.apply}</button>

      <hr style={{ margin: "10px 0" }} />

      {/* Rendu du clavier */}
      <AccordionKeyboard
        rows={selectedKeyboard.rows}
        highlightNotes={highlightNotes}
        highlightLabels={highlightLabels}
        notation={notation}
      />

      {/* Légende graphique responsive */}
      <div style={{ marginTop: "20px" }}>
        <strong>{t.legend} :</strong>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
            marginTop: "10px",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          {/* Bouton non sélectionné */}
          <div style={{ textAlign: "center", width: "100px" }}>
            <svg width="60" height="60">
              <circle cx={30} cy={30} r={25} fill="#eee" stroke="#333" strokeWidth={2} />
              <path d="M30 30 L30 5 A25 25 0 0 1 30 55 Z" fill="#ccc" />
              <path d="M30 30 L30 55 A25 25 0 0 1 30 5 Z" fill="#fff" />
              <text x={15} y={30} fontSize="7" textAnchor="middle" fill="#000" alignmentBaseline="middle">P</text>
              <text x={45} y={30} fontSize="7" textAnchor="middle" fill="#000" alignmentBaseline="middle">T</text>
            </svg>
            <div style={{ fontSize: "12px" }}>{t.legendUnselected}</div>
          </div>

          {/* Bouton sélectionné */}
          <div style={{ textAlign: "center", width: "100px" }}>
            <svg width="60" height="60">
              <circle cx={30} cy={30} r={25} fill="#eee" stroke="#333" strokeWidth={2} />
              <path d="M30 30 L30 5 A25 25 0 0 1 30 55 Z" fill="#F5A623" />
              <path d="M30 30 L30 55 A25 25 0 0 1 30 5 Z" fill="#4A90E2" />
              <text x={15} y={30} fontSize="7" textAnchor="middle" fill="#000" alignmentBaseline="middle">P</text>
              <text x={45} y={30} fontSize="7" textAnchor="middle" fill="#000" alignmentBaseline="middle">T</text>
            </svg>
            <div style={{ fontSize: "12px" }}>{t.legendSelected}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
