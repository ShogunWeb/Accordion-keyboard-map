import { describe, expect, it } from "vitest";
import { blankRow, KEYBOARD_FILE_FORMAT, MAX_KEYBOARD_FILE_BYTES, normalizeKeyboardNote, parseCustomKeyboards, parseKeyboardFile, serializeKeyboardFile, validateCustomKeyboard } from "./customKeyboards";

const keyboard = { id: "custom-test", name: " Mon clavier ", rows: [blankRow(0, 14), blankRow(1, 10)] };
const file = (keyboards: unknown[], version = 1) => JSON.stringify({ format: KEYBOARD_FILE_FORMAT, version, keyboards });

describe("custom keyboard validation", () => {
  it("round trips 2 and 3 rows, preserving notes, octaves, order and offsets", () => {
    const source = structuredClone(keyboard);
    source.rows[0].offsetY = 3;
    source.rows.push(blankRow(-3, 5));
    source.rows[0].buttons[0] = { index: 1, push: "Ré♯4", pull: "Sib3" };
    const result = parseKeyboardFile(serializeKeyboardFile([source]))[0];
    expect(result.name).toBe("Mon clavier");
    expect(result.rows.map(r => r.buttons.length)).toEqual([14, 10, 5]);
    expect(result.rows[0].buttons[0]).toEqual({ index: 1, push: "D#4", pull: "Bb3" });
    expect(result.rows[0].offsetY).toBe(3);
    expect(result.rows[2].offsetY).toBe(-3);
    expect(source.rows[0].buttons[0].push).toBe("Ré♯4");
    expect(parseKeyboardFile(serializeKeyboardFile([keyboard]))[0].rows).toHaveLength(2);
  });

  it.each([
    { ...keyboard, id: "GC" }, { ...keyboard, name: " " }, { ...keyboard, name: "x".repeat(101) },
    { ...keyboard, rows: [blankRow()] }, { ...keyboard, rows: Array.from({ length: 4 }, () => blankRow()) },
    { ...keyboard, rows: [blankRow(0, 15), blankRow()] }, { ...keyboard, rows: [blankRow(0, 0), blankRow()] },
    { ...keyboard, rows: [blankRow(0, 4), blankRow()] },
    { ...keyboard, rows: [blankRow(0.5), blankRow()] }, { ...keyboard, rows: [blankRow(-4), blankRow()] }, { ...keyboard, rows: [blankRow(4), blankRow()] },
    { ...keyboard, rows: [{ offsetY: 0, buttons: [{ index: 2, push: "C4", pull: "D4" }, ...blankRow(0, 5).buttons.slice(1)] }, blankRow()] },
    { ...keyboard, rows: [{ offsetY: 0, buttons: [{ index: 1, push: "H4", pull: "D4" }, ...blankRow(0, 5).buttons.slice(1)] }, blankRow()] },
  ])("rejects invalid layouts before rendering or persisting: %j", invalid => {
    expect(() => validateCustomKeyboard(invalid)).toThrow();
    expect(() => parseKeyboardFile(file([invalid]))).toThrow();
  });

  it("rejects invalid files, unsupported versions, duplicate IDs, empty and oversized imports", () => {
    for (const raw of ["{", file([keyboard], 2), file([]), file([keyboard, keyboard]), file([keyboard]).replace(KEYBOARD_FILE_FORMAT, "other"), " ".repeat(MAX_KEYBOARD_FILE_BYTES + 1)]) {
      expect(() => parseKeyboardFile(raw)).toThrow();
    }
    expect(parseCustomKeyboards(JSON.stringify({ version: 1, keyboards: [] }))).toEqual([]);
    expect(parseKeyboardFile('\uFEFF' + file([keyboard]))).toHaveLength(1);
  });

  it("accepts blanks and musical spellings but rejects unrenderable octaves or arbitrary text", () => {
    expect(["", " do ", "Fa##8", "sol♭", "bb3", "C"].map(normalizeKeyboardNote)).toEqual(["", "C", "F##8", "Gb", "Bb3", "C"]);
    for (const note of ["C-1", "C9", "C#b4", "C4junk", "<script>", "H", "C 4"]) expect(normalizeKeyboardNote(note)).toBeNull();
  });
});
