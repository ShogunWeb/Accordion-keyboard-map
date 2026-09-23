import { useCallback, useRef, useState } from "react";
import { keyboards as builtInKeyboards } from "../data";
import type { KeyboardDefinition } from "../data";
import { isChordSpec, parseSongbook, sameChord, SONGBOOK_STORAGE_KEY, SONGBOOK_VERSION } from "../data/songs";
import type { ChordSpec, Song, SongbookStorageError } from "../data/songs";
import type { PortableSong } from "../utils/songTransfer";

interface SongbookState {
  songs: Song[];
  storageError: SongbookStorageError | null;
  writable: boolean;
}

/** Read synchronously before any mutation; mounting never writes to storage. */
function readSongbook(keyboards: readonly KeyboardDefinition[]): SongbookState {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(SONGBOOK_STORAGE_KEY);
  } catch {
    return { songs: [], storageError: "unavailable", writable: false };
  }
  if (raw === null) return { songs: [], storageError: null, writable: true };
  try {
    return { songs: parseSongbook(raw, keyboards), storageError: null, writable: true };
  } catch {
    return { songs: [], storageError: "invalid", writable: false };
  }
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Saved song sheets are independent of the current keyboard preferences. */
export function useSongbook(keyboards: readonly KeyboardDefinition[] = builtInKeyboards) {
  const [state, setState] = useState<SongbookState>(() => readSongbook(keyboards));
  const stateRef = useRef(state);

  // Persist in the action itself, never inside a React state updater/effect.
  // This also supports multiple actions before React commits the next render.
  const changeSongs = useCallback((transform: (songs: Song[]) => Song[]) => {
    const previous = stateRef.current;
    const songs = transform(previous.songs);
    if (songs === previous.songs) return;
    let storageError = previous.storageError;
    if (previous.writable) {
      try {
        window.localStorage.setItem(SONGBOOK_STORAGE_KEY, JSON.stringify({ version: SONGBOOK_VERSION, songs }));
        storageError = null;
      } catch (error) {
        storageError = error instanceof DOMException
          && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
          ? "quota" : "unavailable";
      }
    }
    const next = { songs, storageError, writable: previous.writable };
    stateRef.current = next;
    setState(next);
  }, []);

  const changeSong = useCallback((id: string, transform: (song: Song) => Song) => {
    changeSongs(songs => {
      const index = songs.findIndex(song => song.id === id);
      if (index < 0) return songs;
      const nextSong = transform(songs[index]);
      if (nextSong === songs[index]) return songs;
      return songs.map((song, position) => position === index ? nextSong : song);
    });
  }, [changeSongs]);

  const createSong = useCallback((title: string, keyboardId: string): Song => {
    const song: Song = {
      id: createId(),
      title: title.trim() || "Untitled",
      keyboardId: keyboards.some(keyboard => keyboard.id === keyboardId) ? keyboardId : keyboards[0].id,
      chords: [],
    };
    changeSongs(songs => [...songs, song]);
    return song;
  }, [changeSongs, keyboards]);

  const renameSong = useCallback((id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    changeSong(id, song => song.title === trimmed ? song : { ...song, title: trimmed });
  }, [changeSong]);

  const setSongKeyboard = useCallback((id: string, keyboardId: string) => {
    if (!keyboards.some(keyboard => keyboard.id === keyboardId)) return;
    changeSong(id, song => song.keyboardId === keyboardId ? song : { ...song, keyboardId });
  }, [changeSong, keyboards]);

  const addChord = useCallback((songId: string, spec: ChordSpec) => {
    if (!isChordSpec(spec)) return;
    changeSong(songId, song => song.chords.some(chord => sameChord(chord, spec)) ? song : {
      ...song,
      chords: [...song.chords, { id: createId(), root: spec.root, type: spec.type }],
    });
  }, [changeSong]);

  const updateChord = useCallback((songId: string, chordId: string, spec: ChordSpec) => {
    if (!isChordSpec(spec)) return;
    changeSong(songId, song => {
      const target = song.chords.find(chord => chord.id === chordId);
      if (!target || sameChord(target, spec)
        || song.chords.some(chord => chord.id !== chordId && sameChord(chord, spec))) return song;
      return { ...song, chords: song.chords.map(chord => chord.id === chordId
        ? { id: chordId, root: spec.root, type: spec.type } : chord) };
    });
  }, [changeSong]);

  const removeChord = useCallback((songId: string, chordId: string) => {
    changeSong(songId, song => !song.chords.some(chord => chord.id === chordId) ? song
      : { ...song, chords: song.chords.filter(chord => chord.id !== chordId) });
  }, [changeSong]);

  const moveChord = useCallback((songId: string, chordId: string, direction: -1 | 1) => {
    changeSong(songId, song => {
      const index = song.chords.findIndex(chord => chord.id === chordId);
      const destination = index + direction;
      if (index < 0 || destination < 0 || destination >= song.chords.length) return song;
      const chords = [...song.chords];
      [chords[index], chords[destination]] = [chords[destination], chords[index]];
      return { ...song, chords };
    });
  }, [changeSong]);

  const deleteSong = useCallback((id: string) => {
    changeSongs(songs => songs.some(song => song.id === id) ? songs.filter(song => song.id !== id) : songs);
  }, [changeSongs]);

  /** Add an entire validated import atomically with fresh IDs, never replace songs. */
  const importSongs = useCallback((incoming: readonly PortableSong[]): Song[] => {
    const titles = new Set(stateRef.current.songs.map(song => song.title));
    const imported = incoming.map(item => {
      const baseTitle = item.title.trim();
      let title = baseTitle;
      let copy = 2;
      while (titles.has(title)) title = `${baseTitle} (${copy++})`;
      titles.add(title);
      return {
        id: createId(), title, keyboardId: item.keyboardId,
        chords: item.chords.map(chord => ({ id: createId(), root: chord.root, type: chord.type })),
      };
    });
    // Revalidate at the mutation boundary (including resolved keyboard IDs).
    parseSongbook(JSON.stringify({ version: SONGBOOK_VERSION, songs: imported }), keyboards);
    if (imported.length) changeSongs(songs => [...songs, ...imported]);
    return imported;
  }, [changeSongs, keyboards]);

  return {
    songs: state.songs,
    storageError: state.storageError,
    createSong, renameSong, setSongKeyboard, addChord, updateChord, removeChord, moveChord, deleteSong, importSongs,
  };
}
