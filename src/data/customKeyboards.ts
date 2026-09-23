import type { KeyboardDefinition, KeyboardRow } from "./types";

export const CUSTOM_KEYBOARDS_KEY = "akm-custom-keyboards";
export const MIN_BUTTONS_PER_ROW = 5;
export const MAX_BUTTONS_PER_ROW = 14;
export const MIN_ROW_OFFSET = -3;
export const MAX_ROW_OFFSET = 3;
export const KEYBOARD_FILE_FORMAT = "accordion-keyboard-map/keyboards";
export const MAX_KEYBOARD_FILE_BYTES = 256 * 1024;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Accept French/English entry, store only canonical ASCII note names. */
export function normalizeKeyboardNote(value: string): string | null {
  const text = value.trim().replace(/♯/g, "#").replace(/♭/g, "b");
  if (!text) return "";
  const match = /^(do|ré|re|mi|fa|sol|la|si|[a-g])(#{1,2}|b{1,2})?([0-8])?$/i.exec(text);
  if (!match) return null;
  const names: Record<string, string> = { do: "C", ré: "D", re: "D", mi: "E", fa: "F", sol: "G", la: "A", si: "B" };
  return (names[match[1].toLowerCase()] ?? match[1].toUpperCase()) + (match[2]?.toLowerCase() ?? "") + (match[3] ?? "");
}

export function blankRow(offsetY = 0, count = 11): KeyboardRow {
  return { offsetY, buttons: Array.from({ length: count }, (_, i) => ({ index: i + 1, push: "", pull: "" })) };
}

/** Bound all dimensions and copy whitelisted fields before rendering or saving. */
export function validateCustomKeyboard(value: unknown): KeyboardDefinition {
  if (!record(value) || typeof value.id !== "string" || !/^custom-[a-zA-Z0-9-]{1,100}$/.test(value.id)
    || typeof value.name !== "string" || !value.name.trim() || value.name.trim().length > 100
    || !Array.isArray(value.rows) || ![2, 3].includes(value.rows.length)) throw new Error("Invalid keyboard");
  const rows = value.rows.map((row: unknown) => {
    if (!record(row) || typeof row.offsetY !== "number" || !Number.isInteger(row.offsetY) || row.offsetY < MIN_ROW_OFFSET || row.offsetY > MAX_ROW_OFFSET
      || !Array.isArray(row.buttons) || row.buttons.length < MIN_BUTTONS_PER_ROW || row.buttons.length > MAX_BUTTONS_PER_ROW) throw new Error("Invalid row");
    const buttons = row.buttons.map((button: unknown, index: number) => {
      if (!record(button) || button.index !== index + 1 || typeof button.push !== "string" || typeof button.pull !== "string") throw new Error("Invalid button");
      const push = normalizeKeyboardNote(button.push);
      const pull = normalizeKeyboardNote(button.pull);
      if (push === null || pull === null) throw new Error("Invalid note");
      return { index: index + 1, push, pull };
    });
    return { offsetY: row.offsetY, buttons };
  });
  return { id: value.id, name: value.name.trim(), rows };
}

export function parseCustomKeyboards(raw: string): KeyboardDefinition[] {
  const data: unknown = JSON.parse(raw);
  if (!record(data) || data.version !== 1 || !Array.isArray(data.keyboards)) throw new Error("Invalid keyboard library");
  const keyboards = data.keyboards.map(validateCustomKeyboard);
  if (new Set(keyboards.map(k => k.id)).size !== keyboards.length) throw new Error("Duplicate keyboard ID");
  return keyboards;
}

export function parseKeyboardFile(raw: string): KeyboardDefinition[] {
  if (new Blob([raw]).size > MAX_KEYBOARD_FILE_BYTES) throw new Error("File too large");
  const text = raw.replace(/^\uFEFF/, "");
  const data: unknown = JSON.parse(text);
  if (!record(data) || data.format !== KEYBOARD_FILE_FORMAT) throw new Error("Invalid keyboard file");
  const keyboards = parseCustomKeyboards(text);
  if (!keyboards.length) throw new Error("Empty keyboard file");
  return keyboards;
}

export function serializeKeyboardFile(keyboards: readonly KeyboardDefinition[]): string {
  const raw = JSON.stringify({ format: KEYBOARD_FILE_FORMAT, version: 1, keyboards }, null, 2) + "\n";
  parseKeyboardFile(raw);
  return raw;
}

export function downloadKeyboardFile(keyboards: readonly KeyboardDefinition[]): void {
  const raw = serializeKeyboardFile(keyboards);
  const url = URL.createObjectURL(new Blob([raw], { type: "application/json;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "accordion-keyboards.akm.json";
  document.body.appendChild(link);
  try { link.click(); }
  finally { link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
