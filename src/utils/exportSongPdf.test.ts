import { afterEach, describe, expect, it, vi } from "vitest";
import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import { exportSongPdf } from "./exportSongPdf";

vi.mock("svg2pdf.js", () => ({ svg2pdf: vi.fn() }));

afterEach(() => vi.restoreAllMocks());

describe("exportSongPdf", () => {
  it("keeps five complete keyboards inside three A4 pages without changing the screen SVG", async () => {
    const source = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    source.setAttribute("viewBox", "0 0 235 734");
    source.setAttribute("style", "max-width:100%;height:auto");
    source.innerHTML = '<text font-size="10" x="10" y="20">Sol#</text>';
    const original = source.outerHTML;
    const rendered: Array<{ page: number; x: number; y: number; width: number; height: number }> = [];
    let generatedPdf: jsPDF | undefined;
    const save = vi.fn().mockResolvedValue(undefined);
    vi.mocked(svg2pdf).mockImplementation(async (svg, pdf, options) => {
      generatedPdf = pdf;
      pdf.save = save as typeof pdf.save;
      rendered.push({
        page: pdf.getNumberOfPages(),
        x: options!.x!, y: options!.y!, width: options!.width!, height: options!.height!,
      });
      expect(svg).not.toBe(source);
      expect(svg.querySelector("text")?.getAttribute("font-family")).toBe("Helvetica");
      expect(svg.querySelector("text")?.textContent).toBe("Sol#");
      return pdf;
    });

    await exportSongPdf({
      title: "Été : le cœur de l’accordéon ".repeat(20),
      keyboardName: "Séráfini 3 rangs - basses Darwin",
      cards: ["Am", "Dm", "E7", "F#maj7", "Bb7"].map(label => ({ label, svg: source })),
      language: "fr",
    });

    expect(generatedPdf?.getNumberOfPages()).toBe(3);
    expect(rendered.map(card => card.page)).toEqual([1, 1, 2, 2, 3]);
    for (const card of rendered) {
      expect(card.x).toBeGreaterThanOrEqual(14);
      expect(card.x + card.width).toBeLessThanOrEqual(196.01);
      expect(card.y).toBeGreaterThan(45);
      expect(card.y + card.height).toBeLessThanOrEqual(275.01);
      expect(card.width / card.height).toBeCloseTo(235 / 734);
    }
    expect(rendered[0].x + rendered[0].width).toBeLessThan(rendered[1].x);
    expect(rendered[4].x + rendered[4].width / 2).toBeCloseTo(105, 1);
    expect(source.outerHTML).toBe(original);
    expect(save).toHaveBeenCalledOnce();
    expect(save.mock.calls[0][0]).toMatch(/^[a-zA-Z0-9._-]+\.pdf$/);
  });
});
