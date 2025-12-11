import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccordionKeyboard } from "./AccordionKeyboard";
import { toPitchClass } from "../utils/noteUtils";
import type { KeyboardRow } from "../data";

const simpleRows: KeyboardRow[] = [
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
    ]
  }
];

describe("AccordionKeyboard", () => {
  it("renders the correct number of buttons and note labels", () => {
    const { container, getByText } = render(
      <AccordionKeyboard rows={simpleRows} notation="anglo" />
    );

    const buttons = container.querySelectorAll("g");
    expect(buttons.length).toBe(3);
    expect(getByText("C")).toBeInTheDocument();
    expect(getByText("D")).toBeInTheDocument();
    expect(getByText("A")).toBeInTheDocument();
  });

  it("highlights push and pull halves when notes are in highlightNotes", () => {
    const rows: KeyboardRow[] = [
      { offsetY: 0, buttons: [{ index: 1, push: "C4", pull: "D4" }] }
    ];
    const { container } = render(
      <AccordionKeyboard
        rows={rows}
        highlightNotes={[
          toPitchClass("C") as number,
          toPitchClass("D") as number,
        ]}
      />
    );

    const paths = container.querySelectorAll("path");
    expect(paths.length).toBe(2);
    const pullHalf = paths[0];
    const pushHalf = paths[1];
    expect(pullHalf).toHaveAttribute("fill", "#F5A623");
    expect(pushHalf).toHaveAttribute("fill", "#4A90E2");
  });

  it("scales button size when a custom scale is provided", () => {
    const rows: KeyboardRow[] = [
      { offsetY: 0, buttons: [{ index: 1, push: "C4", pull: "D4" }] }
    ];
    const { container } = render(
      <AccordionKeyboard rows={rows} scale={0.8} />
    );

    const circle = container.querySelector("circle");
    expect(circle).not.toBeNull();
    expect(circle).toHaveAttribute("r", (50 * 0.8 / 2).toString());
  });
});
