import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";

export interface PdfCard {
  label: string;
  svg: SVGSVGElement;
}

export type SongPdfOptions = {
  title: string;
  keyboardName: string;
  language: "en" | "fr";
} & (
  | { cards: PdfCard[]; pages?: never }
  | { pages: Array<{ title: string; cards: PdfCard[] }>; cards?: never }
);

const MARGIN = 12;
const CARD_GAP = 8;
const MAX_CARDS_PER_PAGE = 4;

/** Keep French accents while staying within the built-in PDF font's WinAnsi set. */
function pdfText(value: string): string {
  return value
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .replace(/♯/g, "#")
    .replace(/♭/g, "b")
    .replace(/[^\u0020-\u007e\u00a0-\u00ffŒœŠšŸŽžƒˆ˜–—‘’‚“”„†‡•…‰‹›€]/gu, "?")
    .trim();
}

function limitedLines(pdf: jsPDF, value: string, width: number, maxLines: number): string[] {
  const lines = pdf.splitTextToSize(pdfText(value), width) as string[];
  if (lines.length <= maxLines) return lines;

  const visible = lines.slice(0, maxLines);
  let lastLine = visible[maxLines - 1].trimEnd();
  while (lastLine.length && pdf.getTextWidth(`${lastLine}...`) > width) {
    lastLine = lastLine.slice(0, -1).trimEnd();
  }
  visible[maxLines - 1] = `${lastLine}...`;
  return visible;
}

function filename(title: string, language: SongPdfOptions["language"]): string {
  const name = title
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._ -]/g, "-")
    .replace(/[\s-]+/g, "-")
    .slice(0, 100)
    .replace(/^[._-]+|[._-]+$/g, "");
  return `${name || (language === "fr" ? "accords" : "chords")}.pdf`;
}

function prepareSvg(source: SVGSVGElement) {
  const svg = source.cloneNode(true) as SVGSVGElement;
  const viewBox = (svg.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
  const width = viewBox.length === 4 ? viewBox[2] : Number(svg.getAttribute("width"));
  const height = viewBox.length === 4 ? viewBox[3] : Number(svg.getAttribute("height"));
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("The keyboard SVG has invalid dimensions.");
  }

  // Export independently of the responsive screen size and surrounding UI fonts.
  svg.removeAttribute("style");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("font-family", "Helvetica");
  svg.setAttribute("font-weight", "normal");
  svg.style.fontFamily = "Helvetica";
  svg.style.fontWeight = "normal";
  svg.querySelectorAll("text").forEach(text => {
    text.setAttribute("font-family", "Helvetica");
    text.setAttribute("font-weight", "normal");
    text.style.fontFamily = "Helvetica";
    text.style.fontWeight = "normal";
  });
  return { svg, width, height };
}

/**
 * Download a vector A4 landscape sheet with aspect-ratio-based pagination. Import this module on demand so the PDF
 * dependencies are separate from the application's initial JavaScript bundle.
 */
export async function exportSongPdf({ title, keyboardName, cards, pages, language }: SongPdfOptions): Promise<void> {
  if (pages && (pages.length === 0 || pages.some(page => page.cards.length === 0 || page.cards.length > MAX_CARDS_PER_PAGE))) {
    throw new Error("Explicit PDF pages must contain between one and four keyboards.");
  }
  const allCards = pages ? pages.flatMap(page => page.cards) : cards!;
  if (allCards.length === 0) {
    throw new Error("Add at least one chord before exporting a song.");
  }

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  const songTitle = title.trim() || (language === "fr" ? "Morceau sans titre" : "Untitled song");
  const pushLabel = language === "fr" ? "Poussé (gauche)" : "Push (left)";
  const pullLabel = language === "fr" ? "Tiré (droite)" : "Pull (right)";

  pdf.setProperties({ title: songTitle, subject: keyboardName, creator: "Accordion Keyboard Map" });

  // Measure the shared header once so long titles also affect available space.
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  const pageTitleLines = pages?.map(page => limitedLines(pdf, page.title, contentWidth, 2));
  const titleLines = limitedLines(pdf, songTitle, contentWidth, 2);
  const maxTitleLines = pageTitleLines ? Math.max(...pageTitleLines.map(lines => lines.length)) : titleLines.length;
  const titleY = 14;
  const keyboardY = titleY + (maxTitleLines - 1) * 6 + 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  const keyboardLines = limitedLines(pdf, keyboardName, contentWidth, 2);
  const legendY = keyboardY + (keyboardLines.length - 1) * 4 + 6;
  const labelY = legendY + 8;
  const svgY = labelY + 10; // Room for two lines of chord name.
  const maxSvgHeight = pageHeight - MARGIN - 5 - svgY;

  const preparedCards = allCards.map(card => ({ label: card.label, ...prepareSvg(card.svg) }));
  // Fit to the usable height first. Never shrink keyboards further merely to
  // squeeze in another column; use the widest aspect ratio for a stable layout.
  const widestAtFullHeight = Math.max(...preparedCards.map(card => maxSvgHeight * card.width / card.height));
  // Explicit pages keep chord families together, scaling down if necessary.
  const cardsPerPage = pages ? Math.max(...pages.map(page => page.cards.length)) : Math.max(1, Math.min(
    MAX_CARDS_PER_PAGE,
    allCards.length,
    Math.floor((contentWidth + CARD_GAP) / (widestAtFullHeight + CARD_GAP))
  ));
  const cardWidth = (contentWidth - CARD_GAP * (cardsPerPage - 1)) / cardsPerPage;
  let offset = 0;
  const preparedPages = pages
    ? pages.map(page => {
      const group = preparedCards.slice(offset, offset + page.cards.length);
      offset += page.cards.length;
      return group;
    })
    : Array.from({ length: Math.ceil(allCards.length / cardsPerPage) }, (_, index) =>
      preparedCards.slice(index * cardsPerPage, (index + 1) * cardsPerPage));
  const pageCount = preparedPages.length;

  for (let page = 0; page < pageCount; page++) {
    if (page > 0) pdf.addPage();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.setTextColor(25, 35, 45);
    (pageTitleLines?.[page] ?? titleLines).forEach((line, index) => pdf.text(line, pageWidth / 2, titleY + index * 6, { align: "center" }));

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    keyboardLines.forEach((line, index) => pdf.text(line, pageWidth / 2, keyboardY + index * 4, { align: "center" }));
    const y = legendY;

    pdf.setFontSize(9);
    const pushWidth = pdf.getTextWidth(pushLabel);
    const legendWidth = 5 + pushWidth + 9 + 5 + pdf.getTextWidth(pullLabel);
    const legendX = (pageWidth - legendWidth) / 2;
    pdf.setFillColor("#4A90E2");
    pdf.rect(legendX, y - 2.5, 3, 3, "F");
    pdf.text(pushLabel, legendX + 5, y);
    pdf.setFillColor("#F5A623");
    pdf.rect(legendX + 5 + pushWidth + 9, y - 2.5, 3, 3, "F");
    pdf.text(pullLabel, legendX + 5 + pushWidth + 9 + 5, y);

    const pageCards = preparedPages[page];
    // Keep the same scale on the last page and center any partial group.
    const groupWidth = pageCards.length * cardWidth + (pageCards.length - 1) * CARD_GAP;
    const groupX = (pageWidth - groupWidth) / 2;

    for (let column = 0; column < pageCards.length; column++) {
      const card = pageCards[column];
      const cardX = groupX + column * (cardWidth + CARD_GAP);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor(25, 35, 45);
      const labelLines = limitedLines(pdf, card.label, cardWidth, 2);
      labelLines.forEach((line, index) => pdf.text(line, cardX + cardWidth / 2, labelY + index * 5, { align: "center" }));

      const { svg, width, height } = card;
      const ratio = Math.min(cardWidth / width, maxSvgHeight / height);
      const exportWidth = width * ratio;
      const exportHeight = height * ratio;
      pdf.setFont("helvetica", "normal");
      await svg2pdf(svg, pdf, {
        x: cardX + (cardWidth - exportWidth) / 2,
        y: svgY,
        width: exportWidth,
        height: exportHeight,
        loadExternalStyleSheets: false,
        loadImages: false,
      });
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(90, 90, 90);
    pdf.text(`${page + 1} / ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: "center" });
  }

  await pdf.save(filename(songTitle, language), { returnPromise: true });
}
