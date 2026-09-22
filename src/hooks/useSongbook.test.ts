import { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { keyboards } from "../data";
import { SONGBOOK_STORAGE_KEY } from "../data/songs";
import type { Song } from "../data/songs";
import { useSongbook } from "./useSongbook";
import { parseSongFile, serializeSongFile } from "../utils/songTransfer";

const keyboardId = keyboards[0].id;
const savedSong: Song = {
  id: "song-1", title: "Autumn leaves", keyboardId,
  chords: [{ id: "chord-1", root: "A", type: "min" }],
};
const payload = (songs: unknown[]) => JSON.stringify({ version: 1, songs });

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("useSongbook", () => {
  it("reads saved songs on the first render and never writes merely by mounting, including StrictMode", () => {
    localStorage.setItem(SONGBOOK_STORAGE_KEY, payload([savedSong]));
    const write = vi.spyOn(Storage.prototype, "setItem");
    const { result, unmount } = renderHook(useSongbook, { wrapper: StrictMode });
    expect(result.current.songs).toEqual([savedSong]);
    expect(result.current.storageError).toBeNull();
    expect(write).not.toHaveBeenCalled();
    unmount();
  });

  it("creates a deduplicated sheet, saves its name and keyboard, and restores it after remount", () => {
    localStorage.setItem("akm-settings", "existing preferences");
    const { result, unmount } = renderHook(useSongbook);
    let song!: Song;
    act(() => {
      song = result.current.createSong(" Waltz ", keyboardId);
      for (const spec of [
        { root: "A", type: "min" }, { root: "D", type: "min" },
        { root: "E", type: "7" }, { root: "A", type: "min" },
      ]) result.current.addChord(song.id, spec);
      result.current.renameSong(song.id, " Evening waltz ");
      result.current.setSongKeyboard(song.id, keyboards[1].id);
    });
    const expected = result.current.songs;
    expect(expected[0]).toMatchObject({ title: "Evening waltz", keyboardId: keyboards[1].id });
    expect(expected[0].chords.map(chord => `${chord.root}:${chord.type}`)).toEqual(["A:min", "D:min", "E:7"]);
    expect(new Set(expected[0].chords.map(chord => chord.id)).size).toBe(3);
    expect(localStorage.getItem("akm-settings")).toBe("existing preferences");
    unmount();
    expect(renderHook(useSongbook).result.current.songs).toEqual(expected);
  });

  it("preserves enharmonic spelling and keeps different qualities separate", () => {
    const { result } = renderHook(useSongbook);
    act(() => {
      const song = result.current.createSong("Spelling", keyboardId);
      result.current.addChord(song.id, { root: "A#", type: "maj" });
      result.current.addChord(song.id, { root: "Bb", type: "maj" });
      result.current.addChord(song.id, { root: "Bb", type: "min" });
    });
    expect(result.current.songs[0].chords).toHaveLength(3);
  });

  it("rejects duplicate edits, reorders with stable IDs, then removes an accord and deletes the song", () => {
    localStorage.setItem(SONGBOOK_STORAGE_KEY, payload([{
      ...savedSong, chords: [
        ...savedSong.chords,
        { id: "chord-2", root: "D", type: "min" },
        { id: "chord-3", root: "E", type: "7" },
      ],
    }]));
    const { result } = renderHook(useSongbook);
    act(() => {
      result.current.updateChord("song-1", "chord-2", { root: "A", type: "min" });
      result.current.moveChord("song-1", "chord-1", -1);
      result.current.moveChord("song-1", "chord-3", 1);
    });
    expect(result.current.songs[0].chords[1]).toMatchObject({ id: "chord-2", root: "D", type: "min" });
    act(() => {
      result.current.moveChord("song-1", "chord-3", -1);
      result.current.updateChord("song-1", "chord-2", { root: "D", type: "7" });
      result.current.removeChord("song-1", "chord-1");
    });
    expect(result.current.songs[0].chords).toEqual([
      { id: "chord-3", root: "E", type: "7" },
      { id: "chord-2", root: "D", type: "7" },
    ]);
    act(() => result.current.deleteSong("song-1"));
    expect(result.current.songs).toEqual([]);
    expect(JSON.parse(localStorage.getItem(SONGBOOK_STORAGE_KEY)!)).toEqual({ version: 1, songs: [] });
  });

  it.each([
    ["malformed JSON", "{broken"],
    ["unknown schema version", JSON.stringify({ version: 2, songs: [savedSong] })],
    ["invalid song list", JSON.stringify({ version: 1, songs: {} })],
    ["duplicate song IDs", payload([savedSong, savedSong])],
    ["missing song ID", payload([{ ...savedSong, id: "" }])],
    ["invalid chord", payload([{ ...savedSong, chords: [{ id: "c", root: "H", type: "maj" }] }])],
    ["unknown quality", payload([{ ...savedSong, chords: [{ id: "c", root: "C", type: "unknown" }] }])],
    ["duplicate chord ID", payload([{ ...savedSong, chords: [...savedSong.chords, { id: "chord-1", root: "D", type: "7" }] }])],
    ["duplicate chord", payload([{ ...savedSong, chords: [...savedSong.chords, { id: "chord-2", root: "A", type: "min" }] }])],
    ["unknown keyboard", payload([{ ...savedSong, keyboardId: "missing" }])],
  ])("surfaces %s and preserves the original payload during mount and subsequent edits", (_description, raw) => {
    localStorage.setItem(SONGBOOK_STORAGE_KEY, raw);
    const write = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(useSongbook);
    expect(result.current.storageError).toBe("invalid");
    expect(result.current.songs).toEqual([]);
    act(() => result.current.createSong("Unsaved song", keyboardId));
    expect(result.current.songs).toHaveLength(1);
    expect(result.current.storageError).toBe("invalid");
    expect(localStorage.getItem(SONGBOOK_STORAGE_KEY)).toBe(raw);
    expect(write).not.toHaveBeenCalled();
  });

  it("surfaces unavailable storage and permits working in memory without overwriting unreadable data", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
    const write = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(useSongbook);
    expect(result.current.storageError).toBe("unavailable");
    act(() => result.current.createSong("In memory", keyboardId));
    expect(result.current.songs).toHaveLength(1);
    expect(write).not.toHaveBeenCalled();
  });

  it("keeps the previous saved data when storage is full and retries on the next edit", () => {
    localStorage.setItem(SONGBOOK_STORAGE_KEY, payload([savedSong]));
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    const { result } = renderHook(useSongbook);
    act(() => result.current.renameSong("song-1", "Unsaved change"));
    expect(result.current.storageError).toBe("quota");
    expect(result.current.songs[0].title).toBe("Unsaved change");
    expect(localStorage.getItem(SONGBOOK_STORAGE_KEY)).toBe(payload([savedSong]));
    write.mockRestore();
    act(() => result.current.addChord("song-1", { root: "E", type: "7" }));
    expect(result.current.storageError).toBeNull();
    expect(JSON.parse(localStorage.getItem(SONGBOOK_STORAGE_KEY)!).songs).toEqual(result.current.songs);
  });

  it("ignores invalid mutations without changing persisted songs", () => {
    localStorage.setItem(SONGBOOK_STORAGE_KEY, payload([savedSong]));
    const write = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(useSongbook);
    act(() => {
      result.current.renameSong("song-1", "  ");
      result.current.setSongKeyboard("song-1", "missing");
      result.current.addChord("song-1", { root: "H", type: "maj" });
      result.current.updateChord("song-1", "chord-1", { root: "C", type: "unknown" });
      result.current.removeChord("song-1", "missing");
      result.current.moveChord("song-1", "missing", 1);
      result.current.deleteSong("missing");
    });
    expect(result.current.songs).toEqual([savedSong]);
    expect(write).not.toHaveBeenCalled();
  });
  it("imports copies atomically with fresh IDs and unique titles while preserving existing songs and settings", () => {
    localStorage.setItem(SONGBOOK_STORAGE_KEY, payload([savedSong]));
    localStorage.setItem("akm-settings", "keep settings");
    const { result, unmount } = renderHook(useSongbook);
    const write = vi.spyOn(Storage.prototype, "setItem");
    const portable = parseSongFile(serializeSongFile([savedSong, savedSong]));
    let imported!: Song[];
    act(() => { imported = result.current.importSongs(portable); });
    expect(write).toHaveBeenCalledTimes(1);
    expect(result.current.songs[0]).toEqual(savedSong);
    expect(imported.map(song => song.title)).toEqual(["Autumn leaves (2)", "Autumn leaves (3)"]);
    expect(new Set([savedSong.id, ...imported.map(song => song.id)]).size).toBe(3);
    expect(new Set([savedSong.chords[0].id, ...imported.map(song => song.chords[0].id)]).size).toBe(3);
    expect(localStorage.getItem("akm-settings")).toBe("keep settings");
    unmount();
    expect(renderHook(useSongbook).result.current.songs).toEqual([savedSong, ...imported]);
  });

  it("rejects an unresolved keyboard atomically and accepts an explicit replacement", () => {
    localStorage.setItem(SONGBOOK_STORAGE_KEY, payload([savedSong]));
    const { result } = renderHook(useSongbook);
    const write = vi.spyOn(Storage.prototype, "setItem");
    const incoming = [{ ...savedSong, keyboardId: "unknown" }];
    expect(() => result.current.importSongs([savedSong, ...incoming])).toThrow();
    expect(result.current.songs).toEqual([savedSong]);
    expect(write).not.toHaveBeenCalled();
    act(() => { result.current.importSongs(incoming.map(song => ({ ...song, keyboardId }))); });
    expect(result.current.songs).toHaveLength(2);
    expect(result.current.songs[1].keyboardId).toBe(keyboardId);
  });

  it("keeps an import in memory and preserves saved data if storage is full", () => {
    localStorage.setItem(SONGBOOK_STORAGE_KEY, payload([savedSong]));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Full", "QuotaExceededError"); });
    const { result } = renderHook(useSongbook);
    act(() => { result.current.importSongs([savedSong]); });
    expect(result.current.songs).toHaveLength(2);
    expect(result.current.storageError).toBe("quota");
    expect(localStorage.getItem(SONGBOOK_STORAGE_KEY)).toBe(payload([savedSong]));
  });

});
