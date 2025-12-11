# Developer Documentation – Data Model

This document describes the internal data structures used to represent accordion keyboards.

---

## File Layout (data layer)

- `src/data/types.ts` — shared TypeScript interfaces
- `src/data/index.ts` — collects all keyboard definitions via `import.meta.glob`, exports `keyboards`
- `src/data/keyboards/*.keyboard.ts` — one file per layout, default‑exporting a `KeyboardDefinition`

Adding a keyboard = adding a new `*.keyboard.ts` file; the loader picks it up automatically (sorted by `name`).

---

## Keyboard type

```ts
type KeyboardDefinition = {
  id: string;
  name: string;
  rows: Row[];
};
```

- `id` — unique technical identifier (used for storage/selection)  
- `name` — user‑visible label  
- `rows` — rows ordered **right → left**

---

## Row

```ts
type Row = {
  offsetY: number;
  buttons: Button[];
};
```

- `offsetY` — vertical offset in **half‑button units**
- `buttons` — array of buttons ordered **bottom → top**

### `offsetY` semantics

| offsetY | Meaning                    |
|--------:|----------------------------|
| 0       | Row aligned                |
| 1       | Shifted by half a button  |
| 2       | Shifted by one full button|
| 3       | Shifted by 1.5 buttons    |

This models the typical staggered (in‑quincunx) layout of diatonic accordions.

---

## Button

```ts
type Button = {
  index: number;   // 1 = bottom button in the row
  push: string;    // e.g. "C4", "F#", "" if undefined
  pull: string;    // same format
};
```

- `index` — logical button index (from bottom to top)
- `push` — note when pushing the bellows
- `pull` — note when pulling the bellows

Notes are stored as:

- Plain names: `C`, `F#`, `Bb`  
- Names with octave: `C4`, `G5`  
- Optionally with Unicode accidentals: `E♭`, `F♯`  
- Empty string `""` when the note is unknown or intentionally left blank

---

## Note Normalization

Because note names can vary in:

- Accidentals (`#` vs `b`)
- Unicode vs ASCII (`♭` vs `b`)
- Language (French vs English notation)
- Presence of octaves (`C4` vs `C`)

a normalization function is recommended:

```ts
function normalizeNote(raw: string): string;
```

Responsibilities:

- Trim whitespace
- Strip octave numbers
- Normalize accidentals (`♭` → `b`, `♯` → `#`)
- Optionally map DO/RÉ/MI… to C/D/E…
- Use `Tonal.Note.get()` to resolve to a pitch class where possible

This function should be used both for:

- Keyboard note values (`push` / `pull`)
- Notes returned by Tonal.js (`Chord.get().notes`, `Scale.get().notes`)

---

## Example keyboard definition file

`src/data/keyboards/my-layout.keyboard.ts`

```ts
import type { KeyboardDefinition } from "../types";

const keyboard: KeyboardDefinition = {
  id: "example",
  name: "Example Layout",
  rows: [
    {
      offsetY: 0,
      buttons: [
        { index: 1, push: "C4", pull: "D4" },
        { index: 2, push: "E4", pull: "F4" },
      ]
    },
    {
      offsetY: 1,
      buttons: [
        { index: 1, push: "G4", pull: "A4" },
        { index: 2, push: "B4", pull: "C5" },
      ]
    }
  ]
};

export default keyboard;
```

The schema is intentionally simple and can be extended with additional metadata if needed (MIDI numbers, fingering suggestions, tags, etc.).
