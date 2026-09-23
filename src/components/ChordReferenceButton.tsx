import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { KeyboardDefinition } from "../data";
import type { NoteNotation } from "../utils/noteUtils";
import { chordReferencePages } from "../utils/chordReference";
import { getSelectionHighlights } from "../utils/musicUtils";
import { AccordionKeyboard } from "./AccordionKeyboard";
import "./ChordReferenceButton.css";

const text = {
  fr: {
    button: "Télécharger le recueil d’accords (PDF)",
    busy: "Génération du recueil…",
    detail: "12 pages paysage · majeur, mineur, 7e et mineur 7",
    title: "Recueil d’accords",
    error: "Impossible de générer le PDF. Vérifiez votre connexion et réessayez.",
  },
  en: {
    button: "Download chord reference (PDF)",
    busy: "Generating chord reference…",
    detail: "12 landscape pages · major, minor, 7th and minor 7th",
    title: "Chord reference",
    error: "Could not generate the PDF. Check your connection and try again.",
  },
};

interface Props {
  keyboard: KeyboardDefinition;
  language: "en" | "fr";
  notation: NoteNotation;
}

export function ChordReferenceButton({ keyboard, language, notation }: Props) {
  const [busy, setBusy] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState(false);
  const staging = useRef<HTMLDivElement>(null);
  const t = text[language];
  const pages = chordReferencePages(language, notation);

  async function download() {
    if (busy) return;
    setError(false);
    try {
      // Render the same complete SVGs as the explorer, then snapshot the selected
      // layout and notation before the asynchronous module load/download.
      flushSync(() => { setBusy(true); setRendering(true); });
      const svgs = Array.from(staging.current!.querySelectorAll("svg"));
      if (svgs.length !== 48) throw new Error("Incomplete chord reference");
      const pdfPages = pages.map((page, index) => ({
        title: page.title,
        cards: page.chords.map((chord, column) => ({
          label: chord.label,
          svg: svgs[index * 4 + column].cloneNode(true) as SVGSVGElement,
        })),
      }));
      setRendering(false);
      const { exportSongPdf } = await import("../utils/exportSongPdf");
      await exportSongPdf({
        title: `${t.title} - ${keyboard.name}`,
        keyboardName: keyboard.name,
        pages: pdfPages,
        language,
      });
    } catch {
      setError(true);
    } finally {
      setRendering(false);
      setBusy(false);
    }
  }

  return <div className="chord-reference">
    <button className="song-button" type="button" disabled={busy} onClick={download}>
      {busy ? t.busy : t.button}
    </button>
    <p className="chord-reference-detail">{t.detail}</p>
    <span className="sr-only" role="status">{busy ? t.busy : ""}</span>
    {error && <p className="song-notice error" role="alert">{t.error}</p>}
    {rendering && <div hidden ref={staging} aria-hidden="true">
      {pages.flatMap(page => page.chords).map(chord =>
        <AccordionKeyboard key={`${chord.root}-${chord.type}`} rows={keyboard.rows}
          notation={notation} {...getSelectionHighlights("chord", chord.root, chord.type)} />
      )}
    </div>}
  </div>;
}
