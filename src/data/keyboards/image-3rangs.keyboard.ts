import type { KeyboardDefinition } from "../types";

const keyboard: KeyboardDefinition = {
  id: "image-3rangs",
  name: "Serafini 3 rangs - basses Darwin",
  rows: [
    // Row 1 (right)
    {
      offsetY: 1,  //this row is offset by 1 half-button from base
      buttons: [
        { index: 1, push: "B3", pull: "E4" },
        { index: 2, push: "D4", pull: "F#4" },
        { index: 3, push: "G4", pull: "A4" },
        { index: 4, push: "B4", pull: "D5" },
        { index: 5, push: "D5", pull: "E5" },
        { index: 6, push: "G5", pull: "F#5" },
        { index: 7, push: "B5", pull: "A5" },
        { index: 8, push: "D6", pull: "C6" },
        { index: 9, push: "G6", pull: "E6" },
        { index: 10, push: "B6", pull: "F#6" },
        { index: 11, push: "D7", pull: "A6" },
      ]
    },

    // Row 2 (middle, quiconce)
    {
      offsetY: 0, //base offset
      buttons: [
        { index: 1, push: "C4", pull: "F4" },
        { index: 2, push: "E4", pull: "G4" },
        { index: 3, push: "A4", pull: "B4" },
        { index: 4, push: "C5", pull: "D5" },
        { index: 5, push: "E5", pull: "F5" },
        { index: 6, push: "A5", pull: "G5" },
        { index: 7, push: "C6", pull: "B5" },
        { index: 8, push: "E6", pull: "D6" },
        { index: 9, push: "A6", pull: "F6" },
        { index: 10, push: "C7", pull: "G6" },
        { index: 11, push: "E7", pull: "B6" },
        { index: 12, push: "G7", pull: "D7" },
      ]
    },

    // Row 3 (left)
    {
      offsetY: 1,  //this row is offset by 1 half-button from base
      buttons: [
        { index: 1, push: "Eb4", pull: "G#4" },
        { index: 2, push: "G#4", pull: "Bb4" },
        { index: 3, push: "Bb4", pull: "C#5" },
        { index: 4, push: "Eb5", pull: "Eb5" },
        { index: 5, push: "G#5", pull: "G#5" },
        { index: 6, push: "Bb5", pull: "Bb5" },
        { index: 7, push: "Eb6", pull: "C#6" },
        { index: 8, push: "G#6", pull: "Eb6" },
        { index: 9, push: "Bb6", pull: "G#6" },
        { index: 10, push: "Eb7", pull: "Bb6" },
        { index: 11, push: "G#7", pull: "C#7" },
      ]
    }
  ]
};

export default keyboard;
