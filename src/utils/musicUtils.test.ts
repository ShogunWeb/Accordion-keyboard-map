import { describe, expect, it } from "vitest";
import { formatChordName, getSelectionHighlights } from "./musicUtils";

describe("shared music selections", () => {
  it("uses the same complete chord pitches and spellings for saved and live keyboards", () => {
    expect(getSelectionHighlights("chord", "F#", "maj7")).toEqual({
      highlightNotes: [6, 10, 1, 5],
      highlightLabels: { 6: "F#", 10: "A#", 1: "C#", 5: "E#" },
    });
    expect(getSelectionHighlights("chord", "Bb", "7")).toEqual({
      highlightNotes: [10, 2, 5, 8],
      highlightLabels: { 10: "Bb", 2: "D", 5: "F", 8: "Ab" },
    });
  });

  it("preserves scale support and returns no highlights for an invalid selection", () => {
    expect(getSelectionHighlights("scale", "D", "minor").highlightNotes).toEqual([2, 4, 5, 7, 9, 10, 0]);
    expect(getSelectionHighlights("chord", "invalid", "maj")).toEqual({ highlightNotes: [], highlightLabels: {} });
  });

  it.each([
    ["A", "min", "anglo", "Am"],
    ["C", "maj", "anglo", "C"],
    ["E", "7", "anglo", "E7"],
    ["C", "maj7", "anglo", "Cmaj7"],
    ["A", "min", "fr", "Lam"],
    ["Bb", "m7", "fr", "Sibm7"],
  ] as const)("formats %s %s in %s notation", (root, type, notation, name) => {
    expect(formatChordName({ root, type }, notation)).toBe(name);
  });
});
