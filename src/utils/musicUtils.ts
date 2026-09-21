import { Chord, Scale } from "tonal";
import type { ChordSpec } from "../data/songs";
import { formatNoteLabel, toPitchClass } from "./noteUtils";
import type { NoteNotation } from "./noteUtils";

/** Shared selector values keep saved chords and the live keyboard consistent. */
export const chordTypes = ["maj", "min", "7", "m7", "maj7", "dim", "aug", "sus2", "sus4"];
export const rootNotes = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];

/** Compute every pitch class in a chord/scale, retaining its musical spelling. */
export function getSelectionHighlights(mode: "chord" | "scale", root: string, type: string) {
  const notes = mode === "chord"
    ? Chord.get(`${root}${type}`).notes
    : Scale.get(`${root} ${type}`).notes;
  const highlightNotes: number[] = [];
  const highlightLabels: Record<number, string> = {};
  for (const note of notes) {
    const pitchClass = toPitchClass(note);
    if (pitchClass !== undefined) {
      highlightNotes.push(pitchClass);
      highlightLabels[pitchClass] = note.replace(/[0-9]/g, "");
    }
  }
  return { highlightNotes, highlightLabels };
}

/** Conventional compact names for song cards and PDF headings. */
export function formatChordName(chord: ChordSpec, notation: NoteNotation): string {
  const suffix = chord.type === "maj" ? "" : chord.type === "min" ? "m" : chord.type;
  return `${formatNoteLabel(chord.root, notation)}${suffix}`;
}
