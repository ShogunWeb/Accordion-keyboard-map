/**
 * Push/pull notes for a single accordion button.
 */
export interface ButtonLayout {
  index: number;
  push: string;
  pull: string;
}

/**
 * A vertical row of buttons on the keyboard.
 * `offsetY` expresses half-button vertical offsets used to draw the staggered layout.
 */
export interface KeyboardRow {
  offsetY: number;
  buttons: ButtonLayout[];
}

/**
 * A full keyboard definition describing a diatonic accordion layout.
 */
export interface KeyboardDefinition {
  id: string;
  name: string;
  rows: KeyboardRow[];
}
