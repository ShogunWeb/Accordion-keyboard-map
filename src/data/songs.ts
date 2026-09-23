import { keyboards } from "./index";
import type { KeyboardDefinition } from "./types";
import { chordTypes, rootNotes } from "../utils/musicUtils";

export interface ChordSpec {
  root: string;
  type: string;
}

export interface SongChord extends ChordSpec {
  id: string;
}

export interface Song {
  id: string;
  title: string;
  keyboardId: string;
  chords: SongChord[];
}

export const SONGBOOK_STORAGE_KEY = "akm-songbook";
export const SONGBOOK_VERSION = 1;
export type SongbookStorageError = "unavailable" | "quota" | "invalid";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonemptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isChordSpec(value: unknown): value is ChordSpec {
  return isRecord(value)
    && typeof value.root === "string" && rootNotes.includes(value.root)
    && typeof value.type === "string" && chordTypes.includes(value.type);
}

export function sameChord(a: ChordSpec, b: ChordSpec): boolean {
  return a.root === b.root && a.type === b.type;
}

/**
 * Validate the complete versioned payload before using any of it. Unknown
 * versions or malformed records must not silently replace the user's library.
 */
export function parseSongbook(raw: string, availableKeyboards: readonly KeyboardDefinition[] = keyboards): Song[] {
  const payload: unknown = JSON.parse(raw);
  if (!isRecord(payload) || payload.version !== SONGBOOK_VERSION || !Array.isArray(payload.songs)) {
    throw new Error("Invalid songbook format");
  }
  const songIds = new Set<string>();
  return payload.songs.map((value: unknown) => {
    if (!isRecord(value) || !isNonemptyString(value.id) || songIds.has(value.id)
      || !isNonemptyString(value.title) || typeof value.keyboardId !== "string"
      || !availableKeyboards.some(keyboard => keyboard.id === value.keyboardId) || !Array.isArray(value.chords)) {
      throw new Error("Invalid song");
    }
    songIds.add(value.id);
    const chordIds = new Set<string>();
    const chords: SongChord[] = [];
    for (const chord of value.chords as unknown[]) {
      if (!isRecord(chord) || !isNonemptyString(chord.id) || chordIds.has(chord.id)
        || !isChordSpec(chord) || chords.some(existing => sameChord(existing, chord))) {
        throw new Error("Invalid song chord");
      }
      chordIds.add(chord.id);
      chords.push({ id: chord.id, root: chord.root, type: chord.type });
    }
    return { id: value.id, title: value.title, keyboardId: value.keyboardId, chords };
  });
}
