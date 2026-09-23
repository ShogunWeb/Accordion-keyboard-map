import { formatChordName } from "./musicUtils";
import { formatNoteLabel } from "./noteUtils";
import type { NoteNotation } from "./noteUtils";

// One spelling per pitch class: no duplicate enharmonic pages.
const roots = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const qualities = [
  { type: "maj", fr: "majeur", en: "major" },
  { type: "min", fr: "mineur", en: "minor" },
  { type: "7", fr: "7e", en: "7th" },
  { type: "m7", fr: "mineur 7", en: "minor 7th" },
];

export function chordReferencePages(language: "en" | "fr", notation: NoteNotation) {
  return roots.map(root => ({
    title: language === "fr"
      ? `Accords de ${formatNoteLabel(root, notation)}`
      : `${formatNoteLabel(root, notation)} chords`,
    chords: qualities.map(quality => ({
      root,
      type: quality.type,
      label: `${formatChordName({ root, type: quality.type }, notation)} — ${quality[language]}`,
    })),
  }));
}
