import { describe, expect, it } from "vitest";
import { MAX_SONG_FILE_BYTES, parseSongFile, serializeSongFile, SONG_FILE_FORMAT, SongFileError } from "./songTransfer";
import type { Song } from "../data/songs";

const song: Song = {
  id: "local-song", title: "Valse d’été", keyboardId: "GC",
  chords: [
    { id: "c1", root: "A", type: "min" }, { id: "c2", root: "D", type: "min" },
    { id: "c3", root: "E", type: "7" }, { id: "c4", root: "Bb", type: "maj" },
  ],
};
const file = (songs: unknown[], version = 1) => JSON.stringify({ format: SONG_FILE_FORMAT, version, songs });

describe("portable song files", () => {
  it("round-trips a readable, versioned document preserving title, keyboard, order and musical spelling", () => {
    const raw = serializeSongFile([song]);
    expect(JSON.parse(raw)).toEqual({ format: SONG_FILE_FORMAT, version: 1, songs: [{
      title: song.title, keyboardId: "GC", chords: song.chords.map(({ root, type }) => ({ root, type })),
    }] });
    expect(raw).not.toContain('"id"');
    expect(parseSongFile(`\uFEFF${raw}`)[0].chords.map(chord => chord.root)).toEqual(["A", "D", "E", "Bb"]);
    expect(serializeSongFile(parseSongFile(raw))).toBe(raw);
  });

  it("supports multiple songs, empty chord sheets and unknown keyboard references for explicit remapping", () => {
    const raw = serializeSongFile([song, { title: "À préparer", keyboardId: "custom", chords: [] }]);
    expect(parseSongFile(raw)).toHaveLength(2);
    expect(parseSongFile(raw)[1]).toEqual({ title: "À préparer", keyboardId: "custom", chords: [] });
  });

  it.each([
    ["malformed JSON", "{", "invalid"],
    ["different application", JSON.stringify({ version: 1, songs: [song] }), "invalid"],
    ["unsupported version", file([song], 2), "version"],
    ["empty library", file([]), "empty"],
    ["invalid title", file([{ ...song, title: " " }]), "invalid"],
    ["missing keyboard", file([{ ...song, keyboardId: "" }]), "invalid"],
    ["unknown note", file([{ ...song, chords: [{ root: "H", type: "maj" }] }]), "invalid"],
    ["unknown quality", file([{ ...song, chords: [{ root: "C", type: "nonsense" }] }]), "invalid"],
    ["duplicate chords", file([{ ...song, chords: [song.chords[0], song.chords[0]] }]), "invalid"],
    ["one invalid song in a batch", file([song, { title: "Broken" }]), "invalid"],
    ["oversized file", " ".repeat(MAX_SONG_FILE_BYTES + 1), "tooLarge"],
  ])("rejects %s with a useful error", (_name, raw, code) => {
    try { parseSongFile(raw); expect.fail("Expected invalid file"); }
    catch (error) { expect(error).toBeInstanceOf(SongFileError); expect((error as SongFileError).code).toBe(code); }
  });

  it("refuses to export files its importer cannot accept", () => {
    expect(() => serializeSongFile([])).toThrow(SongFileError);
    expect(() => serializeSongFile([{ ...song, title: "é".repeat(MAX_SONG_FILE_BYTES) }])).toThrow(SongFileError);
  });
});
