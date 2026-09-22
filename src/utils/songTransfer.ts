import { isChordSpec, sameChord } from "../data/songs";
import type { ChordSpec } from "../data/songs";

/** Portable musical data; local identifiers and computed SVGs are not exchanged. */
export interface PortableSong {
  title: string;
  keyboardId: string;
  chords: ChordSpec[];
}

export const SONG_FILE_FORMAT = "accordion-keyboard-map/songs";
export const SONG_FILE_VERSION = 1;
export const MAX_SONG_FILE_BYTES = 2 * 1024 * 1024;
export type SongFileErrorCode = "invalid" | "version" | "empty" | "tooLarge";

export class SongFileError extends Error {
  readonly code: SongFileErrorCode;
  constructor(code: SongFileErrorCode) {
    super(`Song file: ${code}`);
    this.name = "SongFileError";
    this.code = code;
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Validate the entire document before any songs can be added to local storage. */
export function parseSongFile(raw: string): PortableSong[] {
  if (new Blob([raw]).size > MAX_SONG_FILE_BYTES) throw new SongFileError("tooLarge");
  let data: unknown;
  try {
    data = JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch {
    throw new SongFileError("invalid");
  }
  if (!record(data) || data.format !== SONG_FILE_FORMAT) throw new SongFileError("invalid");
  if (data.version !== SONG_FILE_VERSION) throw new SongFileError("version");
  if (!Array.isArray(data.songs)) throw new SongFileError("invalid");
  if (!data.songs.length) throw new SongFileError("empty");

  return data.songs.map((song: unknown) => {
    if (!record(song) || typeof song.title !== "string" || !song.title.trim()
      || typeof song.keyboardId !== "string" || !song.keyboardId.trim() || !Array.isArray(song.chords)) {
      throw new SongFileError("invalid");
    }
    const chords: ChordSpec[] = [];
    for (const chord of song.chords as unknown[]) {
      if (!isChordSpec(chord) || chords.some(existing => sameChord(existing, chord))) {
        throw new SongFileError("invalid");
      }
      chords.push({ root: chord.root, type: chord.type });
    }
    // Unknown keyboards are resolved explicitly in the import preview.
    return { title: song.title.trim(), keyboardId: song.keyboardId, chords };
  });
}

export function serializeSongFile(songs: readonly PortableSong[]): string {
  const raw = JSON.stringify({
    format: SONG_FILE_FORMAT,
    version: SONG_FILE_VERSION,
    songs: songs.map(song => ({
      title: song.title,
      keyboardId: song.keyboardId,
      chords: song.chords.map(chord => ({ root: chord.root, type: chord.type })),
    })),
  }, null, 2) + "\n";
  // Every exported file must be accepted by our importer, including size limits.
  parseSongFile(raw);
  return raw;
}

export function downloadSongFile(songs: readonly PortableSong[], title = "accordion-songs"): void {
  const raw = serializeSongFile(songs);
  const filename = title.normalize("NFKD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 100).replace(/^[._-]+|[._-]+$/g, "") || "accordion-songs";
  const url = URL.createObjectURL(new Blob([raw], { type: "application/json;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.akm.json`;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    // Give the browser time to start the download before releasing its URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
