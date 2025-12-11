import type { KeyboardDefinition } from "../types";

const keyboard: KeyboardDefinition = {
  id: "GC",
  name: "Clavier G/C",
  rows: [
    {
      offsetY: 0,
      buttons: [
        { index: 1, push: "G4", pull: "C4" },
        { index: 2, push: "A4", pull: "D4" },
        { index: 3, push: "Bb4", pull: "E4" },
        { index: 4, push: "C5", pull: "F4" },
        { index: 5, push: "D5", pull: "G4" },
        { index: 6, push: "E5", pull: "A4" },
        { index: 7, push: "F5", pull: "Bb4" },
        { index: 8, push: "G5", pull: "C5" },
        { index: 9, push: "A5", pull: "D5" },
        { index: 10, push: "Bb5", pull: "E5" },
        { index: 11, push: "C6", pull: "F5" },
      ]
    },
    {
      offsetY: 1,
      buttons: [
        { index: 1, push: "C4", pull: "D4" },
        { index: 2, push: "D4", pull: "E4" },
        { index: 3, push: "E4", pull: "F4" },
        { index: 4, push: "F4", pull: "G4" },
        { index: 5, push: "G4", pull: "A4" },
        { index: 6, push: "A4", pull: "Bb4" },
        { index: 7, push: "Bb4", pull: "C5" },
        { index: 8, push: "C5", pull: "D5" },
        { index: 9, push: "D5", pull: "E5" },
        { index: 10, push: "E5", pull: "F5" },
      ]
    }
  ]
};

export default keyboard;
