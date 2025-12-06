import { Note } from "tonal";

/**
 * Convert a note name (with or without octave) to its pitch-class number (0-11).
 * This lets us match enharmonic spellings (e.g. Bb == A#) when highlighting keys.
 */
export function toPitchClass(note: string): number | undefined {
  const parsed = Note.get(note);
  return parsed.empty ? undefined : parsed.chroma;
}

/** Supported output formats for note labels. */
export type NoteNotation = "anglo" | "fr";

const letterToFrench: Record<string, string> = {
  C: "Do",
  D: "Re",
  E: "Mi",
  F: "Fa",
  G: "Sol",
  A: "La",
  B: "Si",
};

/**
 * Format a note label for display in the requested notation (English or French),
 * preserving the accidental (# or b). Does not append the octave.
 */
export function formatNoteLabel(note: string, notation: NoteNotation): string {
  const match = /^([A-Ga-g])(#{1,2}|b{1,2})?$/.exec(note);
  if (!match) return note;

  const [, letterRaw, accidental = ""] = match;
  const letter = letterRaw.toUpperCase();

  if (notation === "fr") {
    const base = letterToFrench[letter] ?? letter;
    return `${base}${accidental}`;
  }

  return `${letter}${accidental}`;
}
