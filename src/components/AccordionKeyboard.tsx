import React from "react";
import type { KeyboardRow } from "../data/keyboards";
import { formatNoteLabel, toPitchClass } from "../utils/noteUtils";

/**
 * Props for the `AccordionKeyboard` SVG renderer.
 */
export interface KeyboardProps {
  rows: KeyboardRow[];
  /** Pitch classes (0-11) to highlight on matching push/pull halves. */
  highlightNotes?: number[];
  /** Optional mapping from pitch class to a preferred label (to respect user-selected accidental). */
  highlightLabels?: Record<number, string>;
  /** Desired note notation for display. */
  notation?: "anglo" | "fr";
}

/**
 * Renders a diatonic accordion keyboard as an SVG.
 * Each button is split into push/pull halves, halves matching `highlightNotes`
 * get accent colors, and labels respect the current notation.
 */
export const AccordionKeyboard: React.FC<KeyboardProps> = ({
  rows,
  highlightNotes = [],
  highlightLabels = {},
  notation = "anglo"
}) => {
  const buttonSize = 50;
  const buttonSpacingY = buttonSize + 10;
  const buttonSpacingX = 60;
  const paddingBottom = 40;
  const paddingTop = 0;

  const maxButtons = Math.max(...rows.map(r => r.buttons.length));
  const svgHeight = paddingBottom + maxButtons * buttonSpacingY + paddingTop;
  const svgWidth = rows.length * buttonSpacingX + 100;

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: "100%", height: "auto" }}
    >
      {rows.map((row, rIdx) =>
        row.buttons.map((btn, bIdx) => {
          const x = svgWidth - (rIdx + 1) * buttonSpacingX;

          const y = svgHeight - (
            paddingBottom +
            bIdx * buttonSpacingY +
            (row.offsetY * buttonSize) / 2
          );

          // Determine whether either half of the button should be highlighted
          const pushNote = btn.push.replace(/[0-9]/g, '');
          const pullNote = btn.pull.replace(/[0-9]/g, '');
          const pushPc = toPitchClass(pushNote);
          const pullPc = toPitchClass(pullNote);
          const pushHighlighted = highlightNotes.includes(pushPc ?? -1);
          const pullHighlighted = highlightNotes.includes(pullPc ?? -1);
          const pushLabelRaw = pushHighlighted && pushPc !== undefined ? (highlightLabels[pushPc] ?? pushNote) : pushNote;
          const pullLabelRaw = pullHighlighted && pullPc !== undefined ? (highlightLabels[pullPc] ?? pullNote) : pullNote;
          const pushLabel = formatNoteLabel(pushLabelRaw, notation);
          const pullLabel = formatNoteLabel(pullLabelRaw, notation);

          return (
            <g key={`${rIdx}-${bIdx}`} transform={`translate(${x},${y})`}>
              {/* cercle */}
              <circle cx={0} cy={0} r={buttonSize / 2} fill="#eee" stroke="#333" strokeWidth={2} />

              {/* demi-disques */}
              <path
                d={`M0 0 L0 -${buttonSize/2} A${buttonSize/2} ${buttonSize/2} 0 0 1 0 ${buttonSize/2} Z`}
                fill={pullHighlighted ? "#F5A623" : "#ccc"} // tiré
              />
              <path
                d={`M0 0 L0 ${buttonSize/2} A${buttonSize/2} ${buttonSize/2} 0 0 1 0 -${buttonSize/2} Z`}
                fill={pushHighlighted ? "#4A90E2" : "#fff"} // poussé
              />

              {/* notes dans les demi-disques */}
              <text x={-buttonSize/4} y={0} fontSize="10" textAnchor="middle" fill="#000">{pushLabel}</text>
              <text x={buttonSize/4} y={0} fontSize="10" textAnchor="middle" fill="#000">{pullLabel}</text>

              {/* numéro du bouton juste à droite */}
              <text x={buttonSize/2 + 2} y={0} fontSize="12" textAnchor="start" fill="#000">{btn.index}</text>
            </g>
          );
        })
      )}
    </svg>
  );
};
