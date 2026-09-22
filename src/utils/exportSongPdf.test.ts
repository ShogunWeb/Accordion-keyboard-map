import { afterEach, describe, expect, it, vi } from "vitest";
import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import { exportSongPdf } from "./exportSongPdf";

vi.mock("svg2pdf.js", () => ({ svg2pdf: vi.fn() }));
afterEach(() => vi.restoreAllMocks());

function keyboardSvg(width = 235, height = 734) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("style", "max-width:100%;height:auto");
  svg.innerHTML = '<text font-size="10" x="10" y="20">Sol#</text>';
  return svg;
}

async function captureExport(sources: SVGSVGElement[], title = "Valse d’automne") {
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
    for (const source of sources) expect(svg).not.toBe(source);
    expect(svg.querySelector("text")?.getAttribute("font-family")).toBe("Helvetica");
    expect(svg.querySelector("text")?.textContent).toBe("Sol#");
    return pdf;
  });
  await exportSongPdf({
    title,
    keyboardName: "Séráfini 3 rangs - basses Darwin",
    cards: sources.map((svg, index) => ({ label: `Accord ${index + 1}`, svg })),
    language: "fr",
  });
  const pageWidth = generatedPdf!.internal.pageSize.getWidth();
  const pageHeight = generatedPdf!.internal.pageSize.getHeight();
  expect(pageWidth).toBeCloseTo(297, 1);
  expect(pageHeight).toBeCloseTo(210, 1);
  for (const [index, card] of rendered.entries()) {
    const [, , width, height] = sources[index].getAttribute("viewBox")!.split(" ").map(Number);
    expect(card.x).toBeGreaterThanOrEqual(11.99);
    expect(card.x + card.width).toBeLessThanOrEqual(pageWidth - 11.99);
    expect(card.y).toBeGreaterThan(35);
    expect(card.y + card.height).toBeLessThanOrEqual(pageHeight - 16.99);
    expect(card.width / card.height).toBeCloseTo(width / height);
    const previous = rendered[index - 1];
    if (previous?.page === card.page) {
      expect(card.x - previous.x - previous.width).toBeGreaterThanOrEqual(7.99);
    }
  }
  expect(save).toHaveBeenCalledOnce();
  expect(save.mock.calls[0][0]).toMatch(/^[a-zA-Z0-9._-]+\.pdf$/);
  return { rendered, pageWidth, pageCount: generatedPdf!.getNumberOfPages() };
}

describe("exportSongPdf landscape layout", () => {
  it("fits four vertical keyboards per page, preserves source SVGs and centers a lone last chord", async () => {
    const source = keyboardSvg();
    const original = source.outerHTML;
    const { rendered, pageWidth, pageCount } = await captureExport(Array(5).fill(source), "Été : le cœur de l’accordéon ".repeat(20));
    expect(pageCount).toBe(2);
    expect(rendered.map(card => card.page)).toEqual([1, 1, 1, 1, 2]);
    expect(rendered[4].x + rendered[4].width / 2).toBeCloseTo(pageWidth / 2);
    expect(rendered[4].width).toBeCloseTo(rendered[0].width);
    expect(source.outerHTML).toBe(original);
  });

  it.each([
    { width: 350, height: 700, count: 7, expectedPages: [1, 1, 1, 2, 2, 2, 3] },
    { width: 560, height: 700, count: 5, expectedPages: [1, 1, 2, 2, 3] },
    { width: 1400, height: 700, count: 2, expectedPages: [1, 2] },
  ])("adapts columns to a $width × $height keyboard without clipping", async ({ width, height, count, expectedPages }) => {
    const { rendered } = await captureExport(Array(count).fill(keyboardSvg(width, height)));
    expect(rendered.map(card => card.page)).toEqual(expectedPages);
  });

  it("centers a partial last row without changing the size of its keyboards", async () => {
    const { rendered, pageWidth } = await captureExport(Array(6).fill(keyboardSvg()));
    expect(rendered.map(card => card.page)).toEqual([1, 1, 1, 1, 2, 2]);
    expect((rendered[4].x + rendered[5].x + rendered[5].width) / 2).toBeCloseTo(pageWidth / 2);
    expect(rendered[4].width).toBeCloseTo(rendered[0].width);
    expect(rendered[5].height).toBeCloseTo(rendered[0].height);
  });

  it("uses the widest aspect ratio and ignores screen zoom when choosing columns", async () => {
    const dimensions = [[235, 734], [350, 700], [470, 1468], [350, 700]];
    const { rendered } = await captureExport(dimensions.map(([width, height]) => keyboardSvg(width, height)));
    expect(rendered.map(card => card.page)).toEqual([1, 1, 1, 2]);
    expect(rendered[0].width).toBeCloseTo(rendered[2].width);
    expect(rendered[0].height).toBeCloseTo(rendered[2].height);
  });

  it.each([1, 2, 3, 4, 8])("exports %i narrow keyboards without blank pages", async count => {
    const { pageCount } = await captureExport(Array(count).fill(keyboardSvg()));
    expect(pageCount).toBe(Math.ceil(count / 4));
  });
});
