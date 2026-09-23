import { useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

interface Props {
  children: ReactNode;
  selectionLabel: string;
  showLegend: boolean;
  text: Record<string, string>;
  onMenu: () => void;
  onSelection: () => void;
  onActions: () => void;
}

/** Fit the viewBox to the available viewport; manual zoom scrolls only the drawing. */
export function MobileKeyboard({ children, selectionLabel, showLegend, text: t, onMenu, onSelection, onActions }: Props) {
  const [zoom, setZoom] = useState(1);
  const stage = useRef<HTMLDivElement>(null);
  const fit = () => {
    setZoom(1);
    if (stage.current) { stage.current.scrollTop = 0; stage.current.scrollLeft = 0; }
  };

  return <div className="mobile-keyboard">
    <div ref={stage} className="mobile-keyboard-stage" tabIndex={0} role="region" aria-label={t.keyboardViewport}
      style={{ "--keyboard-zoom": zoom } as CSSProperties}>
      <div className="mobile-keyboard-canvas">{children}</div>
    </div>
    <div className="mobile-keyboard-controls">
      <button className="mobile-control" type="button" onClick={onMenu}><span aria-hidden="true">☰</span> {t.menu}</button>
      <button className="mobile-control primary mobile-selection" type="button" onClick={onSelection}
        aria-label={`${t.editSelection}: ${selectionLabel}`}>{selectionLabel} <span aria-hidden="true">▾</span></button>
      <div className="mobile-zoom" role="group" aria-label={t.resizeKeyboard}>
        <button className="mobile-control" type="button" onClick={() => setZoom(z => Math.max(1, z - 0.25))} disabled={zoom === 1} aria-label={t.zoomOut}>−</button>
        <button className="mobile-control" type="button" onClick={() => setZoom(z => Math.min(2.5, z + 0.25))} disabled={zoom === 2.5} aria-label={t.zoomIn}>+</button>
      </div>
      <button className="mobile-control" type="button" onClick={fit} aria-pressed={zoom === 1}>{t.fitScreen}</button>
      <button className="mobile-control" type="button" onClick={onActions} aria-label={t.moreActions}><span aria-hidden="true">⋯</span></button>
      {showLegend && <div className="mobile-legend" aria-label={t.legend}>
        <span><i className="push-swatch" aria-hidden="true" />{t.legendPush}</span>
        <span><i className="pull-swatch" aria-hidden="true" />{t.legendPull}</span>
      </div>}
    </div>
  </div>;
}
