import { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { keyboards as builtIns } from "../data";
import { blankRow, CUSTOM_KEYBOARDS_KEY } from "../data/customKeyboards";
import { useKeyboards } from "./useKeyboards";
import { useSongbook } from "./useSongbook";

const keyboard = { id: "custom-test", name: "Personnel", rows: [blankRow(), blankRow(1)] };
const payload = JSON.stringify({ version: 1, keyboards: [keyboard] });
beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("keyboard persistence and song integration", () => {
  it("reads without writing on mount and updates a stable ID without touching built-in layouts", () => {
    localStorage.setItem(CUSTOM_KEYBOARDS_KEY, payload);
    const original = structuredClone(builtIns);
    const write = vi.spyOn(Storage.prototype, "setItem");
    const { result, unmount } = renderHook(useKeyboards, { wrapper: StrictMode });
    expect(result.current.customKeyboards).toEqual([keyboard]);
    expect(write).not.toHaveBeenCalled();
    act(() => { expect(result.current.saveKeyboard({ ...keyboard, name: "Renamed" })).toBe(true); });
    expect(result.current.customKeyboards).toHaveLength(1);
    expect(builtIns).toEqual(original);
    unmount();
    expect(renderHook(useKeyboards).result.current.customKeyboards[0]).toMatchObject({ id: keyboard.id, name: "Renamed" });
  });

  it("imports atomically, preserves free IDs and makes copies of collisions", () => {
    const { result } = renderHook(useKeyboards);
    act(() => {
      result.current.importKeyboards([keyboard]);
      result.current.importKeyboards([keyboard]);
    });
    expect(result.current.customKeyboards[0]).toEqual(keyboard);
    expect(result.current.customKeyboards.map(k => k.name)).toEqual(["Personnel", "Personnel (2)"]);
    expect(result.current.customKeyboards[1].id).not.toBe(keyboard.id);
    const before = localStorage.getItem(CUSTOM_KEYBOARDS_KEY);
    expect(() => result.current.importKeyboards([keyboard, { ...keyboard, rows: [] }])).toThrow();
    expect(localStorage.getItem(CUSTOM_KEYBOARDS_KEY)).toBe(before);
  });

  it.each(["{broken", JSON.stringify({ version: 2, keyboards: [keyboard] })])("preserves unreadable saved data and disables writes", raw => {
    localStorage.setItem(CUSTOM_KEYBOARDS_KEY, raw);
    const { result } = renderHook(useKeyboards);
    act(() => { expect(result.current.saveKeyboard(keyboard)).toBe(false); });
    expect(result.current.storageError).toBe("invalid");
    expect(localStorage.getItem(CUSTOM_KEYBOARDS_KEY)).toBe(raw);
  });

  it("keeps the previous library when storage is full and allows a retry", () => {
    localStorage.setItem(CUSTOM_KEYBOARDS_KEY, payload);
    const { result } = renderHook(useKeyboards);
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Full", "QuotaExceededError"); });
    act(() => { expect(result.current.saveKeyboard({ ...keyboard, name: "New name" })).toBe(false); });
    expect(result.current.customKeyboards[0]).toEqual(keyboard);
    expect(result.current.storageError).toBe("write");
    expect(localStorage.getItem(CUSTOM_KEYBOARDS_KEY)).toBe(payload);
    write.mockRestore();
    act(() => { expect(result.current.saveKeyboard({ ...keyboard, name: "New name" })).toBe(true); });
    expect(result.current.storageError).toBeNull();
  });

  it("handles blocked storage without overwriting anything", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
    const write = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(useKeyboards);
    act(() => { expect(result.current.saveKeyboard(keyboard)).toBe(false); });
    expect(result.current.storageError).toBe("unavailable");
    expect(write).not.toHaveBeenCalled();
  });

  it("uses newly created keyboards in songs and restores their references after remount", () => {
    const useHarness = () => {
      const library = useKeyboards();
      return { library, book: useSongbook(library.keyboards) };
    };
    const { result, unmount } = renderHook(useHarness);
    act(() => { result.current.library.saveKeyboard(keyboard); });
    act(() => {
      const song = result.current.book.createSong("Valse", keyboard.id);
      result.current.book.addChord(song.id, { root: "C", type: "maj" });
      result.current.book.importSongs([{ title: "Imported", keyboardId: keyboard.id, chords: [] }]);
    });
    expect(result.current.book.songs.every(song => song.keyboardId === keyboard.id)).toBe(true);
    const songs = result.current.book.songs;
    unmount();
    const restored = renderHook(useHarness).result;
    expect(restored.current.book.storageError).toBeNull();
    expect(restored.current.book.songs).toEqual(songs);
  });
});
