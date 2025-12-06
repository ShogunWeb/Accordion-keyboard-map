# Contributing Guidelines

Thank you for considering contributing to the Accordion Keyboard Visualizer!

This document explains how to contribute code, documentation, or keyboard layouts.

---

## 🧩 Code Style

- Use **TypeScript** for all new code  
- Prefer **functional React components**  
- Keep components focused (UI logic only)  
- Extract shared logic into helper functions under `src/utils`  
- Use descriptive names rather than abbreviations  

---

## 💻 Development Workflow

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Accordeon-keyboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open the URL that Vite prints (usually `http://localhost:5173`).

### 4. Build before submitting a PR

```bash
npm run build
```

Ensure there are no TypeScript or build errors.

---

## 📁 Project Layout (recap)

```text
src/
  App.tsx                 # main UI & tonal.js integration
  main.tsx                # entry point
  styles.css              # Tailwind CSS entry
  components/
    AccordionKeyboard.tsx # SVG rendering of the keyboard
  data/
    keyboards.ts          # keyboard layout definitions
  utils/
    notes.ts              # (optional) note normalization helpers
```

---

## 🧪 Testing Changes

Before opening a pull request, please:

- Check that keyboard rendering still works
- Test a few different keyboard layouts
- Test both chord and scale modes
- Try chords/scales that include sharps and flats
- Confirm that push/pull highlighting still behaves correctly

---

## 🎹 Contributing Keyboard Layouts

To add or update layouts:

1. Edit `src/data/keyboards.ts`
2. Add or modify entries using the existing structure:

```ts
{
  id: "my-layout",
  name: "My Layout",
  rows: [
    {
      offsetY: 1,
      buttons: [
        { index: 1, push: "C4", pull: "D4" },
        { index: 2, push: "E4", pull: "F4" },
        // ...
      ]
    }
  ]
}
```

3. Make sure:
   - Button indices start at 1 for the lowest button in the row  
   - `push` = bellows closed (left half)  
   - `pull` = bellows opened (right half)  
   - `offsetY` is consistent with the physical stagger pattern  

---

## 🐛 Reporting Bugs

When opening an issue, please include:

- What you were trying to do  
- What happened instead  
- Steps to reproduce  
- Browser / OS info  
- Screenshots or a short screen recording if possible  

---

## 🌟 Feature Requests

Ideas are welcome! When proposing a feature, try to include:

- The problem it solves  
- Who benefits (players, teachers, developers…)  
- Any thoughts on UI/UX impact  

---

## 🤝 Licensing

All contributions must be compatible with the repository’s chosen license  
(to be defined and added by the project owner in `LICENSE` and `README.md`).
