# Developer Documentation – Architecture

This document explains how the application is structured internally.

---

## Overview

The Accordion Keyboard Visualizer is a **React + TypeScript + Vite** application using:

- **SVG rendering** for the instrument layout
- **Tonal.js** for music theory logic
- **Tailwind CSS 4** for styling (via PostCSS)
- A set of keyboard definitions stored as plain data

The core idea:

- Keyboard definition is **pure data**
- Rendering & highlighting logic live in UI components
- Music theory (chords/scales) is delegated to **Tonal.js**

---

## Main Modules

### `src/App.tsx`

Responsible for:

- High‑level UI controls (keyboard selector, chord/scale selector)
- Calling Tonal.js for chord / scale notes
- Normalizing those notes
- Passing `highlightNotes` to the keyboard component

### `src/components/AccordionKeyboard.tsx`

Responsible for:

- Rendering the keyboard as SVG
- Drawing circular buttons split into push/pull halves
- Positioning buttons by:
  - row index (right → left)
  - button index (bottom → top)
  - `offsetY` (half‑button vertical offset)
- Applying highlight colors when notes match `highlightNotes`

This component does **no music theory** — it only draws what it’s given.

---

## Data Layer

### `src/data/keyboards.ts`

Contains an array of keyboard layouts:

- `id`: string identifier
- `name`: user‑facing label
- `rows`: description of each row (offset + buttons)

Each row includes:

- `offsetY`: number of half‑button vertical offsets
- `buttons`: buttons from bottom to top

Each button includes:

- `index`: button index from the bottom (1‑based)
- `push`: note played on push (string)
- `pull`: note played on pull (string)

---

## Note Normalization

To reliably match displayed notes with Tonal.js output, note names should be **normalized**:

Typical normalization steps:

- Strip octave numbers (`C4` → `C`)
- Convert Unicode accidentals (`♭`, `♯`) to `b`, `#`
- Optionally map French names (DO, RÉ, MI, …) to C, D, E…
- Use `Tonal.Note.get().pc` to get a canonical pitch class

A helper like `normalizeNote(raw: string): string` can be placed in `src/utils/notes.ts` and used both in:

- `App.tsx` (for Tonal output)
- `AccordionKeyboard.tsx` (for button note labels)

---

## Build & Tooling

### Vite

- Handles dev server (`npm run dev`)
- Handles production builds (`npm run build`)
- Uses `vite.config.ts` for configuration

### Tailwind CSS 4

- Integrated via PostCSS (`postcss.config.cjs`)
- Styles are imported through `src/styles.css` using:

  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```

---

## Rendering Logic (SVG)

Coordinate system:

- Width is computed from number of rows
- Height is computed from the row with the most buttons
- Each row:
  - Horizontal position: based on row index
  - Vertical position: based on button index and `offsetY`
- Each button:
  - Drawn as a circle
  - Two paths for left (push) / right (pull) halves
  - Text labels for notes
  - Text label for button number

---

## Extending the Architecture

You can extend the app by:

- Adding left‑hand keyboard rendering with a similar component
- Adding persistent user settings (e.g. via `localStorage`)
- Splitting UI into more components (e.g. `ControlPanel`, `Legend`, etc.)
- Adding routing or multiple pages (via React Router or similar)
