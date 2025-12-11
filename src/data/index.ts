import type { KeyboardDefinition } from "./types";

const modules = import.meta.glob<KeyboardDefinition>("./keyboards/*.keyboard.ts", {
  eager: true,
  import: "default"
});

// Gather all default exports and sort by name for a stable order.
export const keyboards: KeyboardDefinition[] = Object.values(modules).sort((a, b) =>
  a.name.localeCompare(b.name)
);

export type { ButtonLayout, KeyboardRow, KeyboardDefinition } from "./types";
