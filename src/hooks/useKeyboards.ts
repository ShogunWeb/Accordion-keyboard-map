import { useMemo, useRef, useState } from "react";
import { keyboards as builtInKeyboards } from "../data";
import type { KeyboardDefinition } from "../data";
import { CUSTOM_KEYBOARDS_KEY, parseCustomKeyboards, validateCustomKeyboard } from "../data/customKeyboards";

type StorageError = "invalid" | "unavailable" | "write" | null;
interface State { custom: KeyboardDefinition[]; error: StorageError; writable: boolean }

function read(): State {
  let raw: string | null;
  try { raw = localStorage.getItem(CUSTOM_KEYBOARDS_KEY); }
  catch { return { custom: [], error: "unavailable", writable: false }; }
  try { return { custom: raw === null ? [] : parseCustomKeyboards(raw), error: null, writable: true }; }
  catch { return { custom: [], error: "invalid", writable: false }; }
}

export function newKeyboardId(): string {
  return `custom-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;
}

/** Load before songbook validation. A failed write leaves the saved library intact. */
export function useKeyboards() {
  const [state, setState] = useState(read);
  const current = useRef(state);
  const keyboards = useMemo(() => [...builtInKeyboards, ...state.custom].sort((a, b) => a.name.localeCompare(b.name)), [state.custom]);

  function persist(custom: KeyboardDefinition[]): boolean {
    const previous = current.current;
    if (!previous.writable) return false;
    try { localStorage.setItem(CUSTOM_KEYBOARDS_KEY, JSON.stringify({ version: 1, keyboards: custom })); }
    catch {
      current.current = { ...previous, error: "write" };
      setState(current.current);
      return false;
    }
    current.current = { custom, writable: true, error: null };
    setState(current.current);
    return true;
  }

  function saveKeyboard(input: KeyboardDefinition): boolean {
    const keyboard = validateCustomKeyboard(input);
    const custom = current.current.custom;
    return persist(custom.some(k => k.id === keyboard.id)
      ? custom.map(k => k.id === keyboard.id ? keyboard : k)
      : [...custom, keyboard]);
  }

  /** Keep portable IDs when free, copy collisions; never overwrite another layout. */
  function importKeyboards(incoming: readonly KeyboardDefinition[]): KeyboardDefinition[] | null {
    const validated = incoming.map(validateCustomKeyboard);
    const ids = new Set(current.current.custom.map(k => k.id));
    const names = new Set([...builtInKeyboards, ...current.current.custom].map(k => k.name));
    const imported = validated.map(k => {
      let id = k.id;
      while (ids.has(id)) id = newKeyboardId();
      ids.add(id);
      let name = k.name;
      let suffix = 2;
      while (names.has(name)) name = `${k.name.slice(0, 90)} (${suffix++})`;
      names.add(name);
      return { ...k, id, name };
    });
    return imported.length && persist([...current.current.custom, ...imported]) ? imported : null;
  }

  return { keyboards, customKeyboards: state.custom, storageError: state.error, saveKeyboard, importKeyboards };
}
