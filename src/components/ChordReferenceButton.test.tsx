import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChordReferenceButton } from "./ChordReferenceButton";
import { keyboards } from "../data";
import { exportSongPdf } from "../utils/exportSongPdf";
import { toPitchClass } from "../utils/noteUtils";

vi.mock("../utils/exportSongPdf", () => ({ exportSongPdf: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

describe("chord reference download", () => {
  it("exports all 12 roots and four qualities using complete keyboards and French notation", async () => {
    const keyboard = keyboards.find(k => k.id === "image-3rangs")!;
    render(<ChordReferenceButton keyboard={keyboard} language="fr" notation="fr" />);
    expect(exportSongPdf).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Télécharger/ }));
    await waitFor(() => expect(exportSongPdf).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
    const options = vi.mocked(exportSongPdf).mock.calls[0][0];
    expect(options.keyboardName).toBe(keyboard.name);
    expect(options.pages).toHaveLength(12);
    expect(options.pages!.map(page => page.title)).toEqual([
      "Accords de Do", "Accords de Reb", "Accords de Re", "Accords de Mib", "Accords de Mi", "Accords de Fa",
      "Accords de Fa#", "Accords de Sol", "Accords de Lab", "Accords de La", "Accords de Sib", "Accords de Si",
    ]);
    expect(options.pages![0].cards.map(card => card.label)).toEqual([
      "Do — majeur", "Dom — mineur", "Do7 — 7e", "Dom7 — mineur 7",
    ]);
    const expectedNotes = [[0, 4, 7], [0, 3, 7], [0, 4, 7, 10], [0, 3, 7, 10]];
    const buttons = keyboard.rows.flatMap(row => row.buttons);
    for (const [pageIndex, page] of options.pages!.entries()) {
      expect(page.cards).toHaveLength(4);
      for (const [quality, card] of page.cards.entries()) {
        const groups = card.svg.querySelectorAll("g");
        expect(groups).toHaveLength(buttons.length);
        // Check actual push/pull colors against the chord intervals for every root.
        buttons.forEach((button, index) => {
          const paths = groups[index].querySelectorAll("path");
          const notes = expectedNotes[quality].map(note => (note + pageIndex) % 12);
          expect(paths[0].getAttribute("fill")).toBe(notes.includes(toPitchClass(button.pull)!) ? "#F5A623" : "#ccc");
          expect(paths[1].getAttribute("fill")).toBe(notes.includes(toPitchClass(button.push)!) ? "#4A90E2" : "#fff");
        });
      }
    }
  });

  it("prevents duplicate clicks, snapshots settings, and recovers after a failed export", async () => {
    let rejectExport!: (reason: Error) => void;
    vi.mocked(exportSongPdf).mockImplementationOnce(() => new Promise((_, reject) => { rejectExport = reject; }));
    const { rerender } = render(<ChordReferenceButton keyboard={keyboards[0]} language="en" notation="anglo" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(exportSongPdf).toHaveBeenCalledOnce());
    expect(screen.getByRole("button")).toBeDisabled();
    fireEvent.click(screen.getByRole("button"));
    expect(exportSongPdf).toHaveBeenCalledOnce();
    rerender(<ChordReferenceButton keyboard={keyboards[1]} language="fr" notation="fr" />);
    expect(vi.mocked(exportSongPdf).mock.calls[0][0]).toMatchObject({
      keyboardName: keyboards[0].name, language: "en",
      pages: [expect.objectContaining({ title: "C chords" }), ...Array(11).fill(expect.anything())],
    });
    rejectExport(new Error("Offline"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Impossible de générer");
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(exportSongPdf).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(vi.mocked(exportSongPdf).mock.calls[1][0].keyboardName).toBe(keyboards[1].name);
  });
});
