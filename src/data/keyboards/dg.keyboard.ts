import type { KeyboardDefinition } from "../types";

const keyboard: KeyboardDefinition = {
  id: "DG",
  name: "Clavier D/G",
  rows: [
    {
      offsetY: 0,
      buttons: [
        { index: 1, push: "D4", pull: "G3" },
        { index: 2, push: "E4", pull: "A3" },
        { index: 3, push: "F#4", pull: "B3" },
        { index: 4, push: "G4", pull: "C4" },
        { index: 5, push: "A4", pull: "D4" },
        { index: 6, push: "B4", pull: "E4" },
        { index: 7, push: "C#5", pull: "F#4" },
        { index: 8, push: "D5", pull: "G4" },
        { index: 9, push: "E5", pull: "A4" },
        { index: 10, push: "F#5", pull: "B4" },
        { index: 11, push: "G5", pull: "C5" },
      ]
    },
    {
      offsetY: 1,
      buttons: [
        { index: 1, push: "G3", pull: "A3" },
        { index: 2, push: "A3", pull: "B3" },
        { index: 3, push: "B3", pull: "C4" },
        { index: 4, push: "C4", pull: "D4" },
        { index: 5, push: "D4", pull: "E4" },
        { index: 6, push: "E4", pull: "F#4" },
        { index: 7, push: "F#4", pull: "G4" },
        { index: 8, push: "G4", pull: "A4" },
        { index: 9, push: "A4", pull: "B4" },
        { index: 10, push: "B4", pull: "C5" },
      ]
    }
  ]
};

export default keyboard;
