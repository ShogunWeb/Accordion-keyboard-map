import { useEffect, useRef, useState } from "react";
import type { KeyboardDefinition, KeyboardRow } from "../data";
import { blankRow, downloadKeyboardFile, MAX_BUTTONS_PER_ROW, MIN_BUTTONS_PER_ROW, MIN_ROW_OFFSET, MAX_ROW_OFFSET, MAX_KEYBOARD_FILE_BYTES, normalizeKeyboardNote, parseKeyboardFile, validateCustomKeyboard } from "../data/customKeyboards";
import { newKeyboardId } from "../hooks/useKeyboards";
import type { useKeyboards } from "../hooks/useKeyboards";
import type { NoteNotation } from "../utils/noteUtils";
import { AccordionKeyboard } from "./AccordionKeyboard";
import "./KeyboardEditor.css";

const translations = {
  en: {
    title: "My keyboards", subtitle: "Create a 2 or 3 row keyboard, with 5 to 14 buttons per row.",
    new: "Blank keyboard", template: "Starting keyboard", copy: "Create a copy", copySuffix: "copy",
    open: "Edit a saved keyboard", choose: "Choose a keyboard", name: "Keyboard name", rows: "Number of rows",
    row: "Row", right: "right", middle: "middle", left: "left", count: "Buttons", offset: "Vertical offset",
    offsetHint: "In half-button units. Positive values move the row up.",
    orientation: "Rows run from right to left. Button 1 is at the bottom; the tables follow the same order as the preview.",
    notesHint: "Enter C, F#4, Bb3 or French names (Do, Ré…). Octave 0–8 is optional. Leave an unknown note blank.",
    button: "Button", push: "Push", pull: "Pull", preview: "Preview", save: "Save keyboard", use: "Use this keyboard",
    export: "Export this keyboard", exportAll: "Export all keyboards", import: "Import keyboards", reading: "Reading…",
    saved: "Keyboard saved in this browser.", dirty: "Unsaved changes", cancel: "Cancel changes",
    discard: "Discard unsaved changes?", remove: "The removed buttons contain notes. Remove them?",
    invalid: "Check the keyboard name and notes. Use 2 or 3 rows, 5–14 buttons per row and a whole offset from −3 to +3.",
    invalidNote: "Invalid note", importPreview: "Keyboards to import", importConfirm: "Add these keyboards", dismiss: "Cancel import",
    importHint: "Existing keyboards are kept. If an ID is already used, a new copy is created.",
    imported: "Keyboards imported.", fileError: "Unable to read this keyboard file. Expected a version 1 keyboard export, at most 256 KB.",
    exportError: "The file could not be downloaded. Please try again.",
    storageInvalid: "Saved keyboards cannot be read. The original data is preserved. You can still edit and export a keyboard, but saving is disabled.",
    storageUnavailable: "Browser storage is unavailable. You can still edit and export a keyboard.",
    storageWrite: "Saving failed. Your draft is still here; export it or try saving again.",
    editHint: "Saving changes also updates the keyboards displayed in songs using this layout.",
    empty: "Start with a blank keyboard or copy an existing layout. Your keyboards are stored in this browser; export JSON files to back them up or share them.",
  },
  fr: {
    title: "Mes claviers", subtitle: "Créez un clavier de 2 ou 3 rangs, avec 5 à 14 touches par rang.",
    new: "Clavier vierge", template: "Clavier de départ", copy: "Créer une copie", copySuffix: "copie",
    open: "Modifier un clavier enregistré", choose: "Choisir un clavier", name: "Nom du clavier", rows: "Nombre de rangs",
    row: "Rang", right: "droite", middle: "milieu", left: "gauche", count: "Touches", offset: "Décalage vertical",
    offsetHint: "En demi-touches. Une valeur positive décale le rang vers le haut.",
    orientation: "Les rangs vont de droite à gauche. La touche 1 est en bas ; les tableaux suivent le même ordre que l’aperçu.",
    notesHint: "Saisissez Do, Fa#4, Sib3 ou les noms anglais (C, D…). L’octave de 0 à 8 est facultative. Laissez vide une note inconnue.",
    button: "Touche", push: "Poussé", pull: "Tiré", preview: "Aperçu", save: "Enregistrer le clavier", use: "Utiliser ce clavier",
    export: "Exporter ce clavier", exportAll: "Exporter tous les claviers", import: "Importer des claviers", reading: "Lecture…",
    saved: "Clavier enregistré dans ce navigateur.", dirty: "Modifications non enregistrées", cancel: "Annuler les modifications",
    discard: "Abandonner les modifications non enregistrées ?", remove: "Les touches retirées contiennent des notes. Les supprimer ?",
    invalid: "Vérifiez le nom du clavier et les notes. Utilisez 2 ou 3 rangs, 5 à 14 touches par rang et un décalage entier de −3 à +3.",
    invalidNote: "Note invalide", importPreview: "Claviers à importer", importConfirm: "Ajouter ces claviers", dismiss: "Annuler l’import",
    importHint: "Les claviers existants sont conservés. Si un identifiant est déjà utilisé, une nouvelle copie est créée.",
    imported: "Claviers importés.", fileError: "Impossible de lire ce fichier de claviers. Utilisez un export de claviers en version 1, de 256 Ko maximum.",
    exportError: "Le fichier n’a pas pu être téléchargé. Veuillez réessayer.",
    storageInvalid: "Les claviers enregistrés sont illisibles. Les données originales sont conservées. Vous pouvez modifier et exporter un clavier, mais l’enregistrement est désactivé.",
    storageUnavailable: "Le stockage du navigateur est indisponible. Vous pouvez modifier et exporter un clavier.",
    storageWrite: "L’enregistrement a échoué. Votre brouillon est conservé ; exportez-le ou réessayez d’enregistrer.",
    editHint: "Enregistrer les modifications actualise aussi les claviers affichés dans les morceaux qui utilisent ce modèle.",
    empty: "Partez d’un clavier vierge ou copiez un modèle existant. Vos claviers sont conservés dans ce navigateur ; exportez les fichiers JSON pour les sauvegarder ou les partager.",
  },
};

type Library = ReturnType<typeof useKeyboards>;
export function KeyboardEditor({ library, language, notation, selectedKeyboardId, onUse }: {
  library: Library; language: "en" | "fr"; notation: NoteNotation; selectedKeyboardId: string; onUse: (id: string) => void;
}) {
  const t = translations[language];
  const [draft, setDraft] = useState<KeyboardDefinition | null>(null);
  const [baseline, setBaseline] = useState("");
  const [templateId, setTemplateId] = useState(selectedKeyboardId);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [reading, setReading] = useState(false);
  const [pending, setPending] = useState<KeyboardDefinition[] | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const dirty = draft !== null && JSON.stringify(draft) !== baseline;
  const saved = library.customKeyboards.find(k => k.id === draft?.id);
  const storageMessage = library.storageError === "invalid" ? t.storageInvalid
    : library.storageError === "unavailable" ? t.storageUnavailable : t.storageWrite;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function open(keyboard: KeyboardDefinition, isSaved = false) {
    if (dirty && !window.confirm(t.discard)) return;
    const next = structuredClone(keyboard);
    setDraft(next);
    setBaseline(isSaved ? JSON.stringify(next) : "");
    setError(""); setStatus("");
  }
  function update(next: KeyboardDefinition) { setDraft(next); setError(""); setStatus(""); }
  function changeRow(index: number, row: KeyboardRow) {
    if (draft) update({ ...draft, rows: draft.rows.map((item, i) => i === index ? row : item) });
  }
  function validDraft(): KeyboardDefinition | null {
    try { return validateCustomKeyboard(draft); }
    catch { setError(t.invalid); return null; }
  }
  function exportKeyboards(keyboards: KeyboardDefinition[]) {
    try { downloadKeyboardFile(keyboards); setError(""); }
    catch { setError(t.exportError); }
  }

  return <section className="keyboard-editor" aria-labelledby="keyboard-editor-title">
    <div><h2 id="keyboard-editor-title">{t.title}</h2><p className="songbook-subtitle">{t.subtitle}</p></div>
    <div className="panel-card editor-library">
      <p className="songbook-subtitle">{t.empty}</p>
      <div className="editor-start">
        <button type="button" className="song-button" onClick={() => open({ id: newKeyboardId(), name: "", rows: [blankRow(0, 11), blankRow(1, 10)] })}>+ {t.new}</button>
        <label className="field"><span>{t.template}</span><select value={templateId} onChange={e => setTemplateId(e.target.value)}>
          {library.keyboards.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select></label>
        <button type="button" className="song-button" onClick={() => {
          const template = library.keyboards.find(k => k.id === templateId);
          if (template) open({ ...template, id: newKeyboardId(), name: `${template.name.slice(0, 88)} (${t.copySuffix})` });
        }}>{t.copy}</button>
      </div>
      {!!library.customKeyboards.length && <label className="field"><span>{t.open}</span>
        <select value={saved?.id ?? ""} onChange={e => {
          const keyboard = library.customKeyboards.find(k => k.id === e.target.value);
          if (keyboard) open(keyboard, true);
        }}><option value="" disabled>{t.choose}</option>{library.customKeyboards.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}</select>
      </label>}
      <div className="song-actions">
        <button type="button" className="song-button" disabled={reading} onClick={() => fileInput.current?.click()}>{reading ? t.reading : t.import}</button>
        <button type="button" className="song-button" disabled={!library.customKeyboards.length} onClick={() => exportKeyboards(library.customKeyboards)}>{t.exportAll}</button>
        <input ref={fileInput} type="file" hidden accept=".json,application/json" aria-label={t.import} onChange={async e => {
          const file = e.target.files?.[0]; e.target.value = "";
          if (!file) return;
          setReading(true); setError(""); setStatus(""); setPending(null);
          try {
            if (file.size > MAX_KEYBOARD_FILE_BYTES) throw new Error("Too large");
            setPending(parseKeyboardFile(await file.text()));
          } catch { setError(t.fileError); }
          finally { setReading(false); }
        }} />
      </div>
    </div>
    {library.storageError && <p className="song-notice error" role="alert">{storageMessage}</p>}
    {error && <p className="song-notice error" role="alert">{error}</p>}
    {status && <p className="song-notice" role="status">{status}</p>}
    {pending && <section className="panel-card editor-library" aria-label={t.importPreview}>
      <h3>{t.importPreview}</h3><p className="songbook-subtitle">{t.importHint}</p>
      <ul>{pending.map(k => <li key={k.id}>{k.name} · {k.rows.map(r => r.buttons.length).join(" / ")}</li>)}</ul>
      <div className="song-actions">
        <button type="button" className="song-button primary" onClick={() => {
          if (library.importKeyboards(pending)) { setPending(null); setStatus(t.imported); }
        }}>{t.importConfirm}</button>
        <button type="button" className="song-button" onClick={() => setPending(null)}>{t.dismiss}</button>
      </div>
    </section>}
    {draft && <form className="editor-form" noValidate onSubmit={e => {
      e.preventDefault(); const keyboard = validDraft();
      if (keyboard && library.saveKeyboard(keyboard)) {
        setDraft(keyboard); setBaseline(JSON.stringify(keyboard)); setStatus(t.saved); setError("");
      }
    }}>
      <div className="panel-card editor-library">
        <div className="editor-metadata">
          <label className="field"><span>{t.name}</span><input required maxLength={100} value={draft.name} onChange={e => update({ ...draft, name: e.target.value })} /></label>
          <label className="field"><span>{t.rows}</span><select value={draft.rows.length} onChange={e => {
            const count = Number(e.target.value);
            if (count < draft.rows.length && draft.rows.slice(count).some(r => r.buttons.some(b => b.push || b.pull)) && !window.confirm(t.remove)) return;
            update({ ...draft, rows: count === 3 ? [...draft.rows, blankRow(2)] : draft.rows.slice(0, 2) });
          }}><option value={2}>2</option><option value={3}>3</option></select></label>
        </div>
        <p className="songbook-subtitle">{t.orientation}</p><p className="songbook-subtitle">{t.notesHint}</p>
        {saved && <p className="songbook-subtitle">{t.editHint}</p>}
        <div className="song-actions">
          <button type="submit" className="song-button primary">{t.save}</button>
          <button type="button" className="song-button" disabled={!saved || dirty} onClick={() => onUse(saved!.id)}>{t.use}</button>
          <button type="button" className="song-button" onClick={() => { const keyboard = validDraft(); if (keyboard) exportKeyboards([keyboard]); }}>{t.export}</button>
          <button type="button" className="song-button" disabled={!dirty} onClick={() => {
            if (!window.confirm(t.discard)) return;
            setDraft(saved ? structuredClone(saved) : null); setBaseline(saved ? JSON.stringify(saved) : ""); setError(""); setStatus("");
          }}>{t.cancel}</button>
        </div>
        {dirty && <p className="songbook-subtitle">{t.dirty}</p>}
      </div>
      <div className="editor-workspace">
        <div className="editor-rows">
          {draft.rows.map((row, rowIndex) => <fieldset className="panel-card editor-row" key={rowIndex}>
            <legend>{t.row} {rowIndex + 1} · {rowIndex === 0 ? t.right : rowIndex === draft.rows.length - 1 ? t.left : t.middle}</legend>
            <label className="field"><span>{t.count} — {t.row} {rowIndex + 1}</span><select value={row.buttons.length} onChange={e => {
              const count = Number(e.target.value);
              if (row.buttons.slice(count).some(b => b.push || b.pull) && !window.confirm(t.remove)) return;
              changeRow(rowIndex, { ...row, buttons: Array.from({ length: count }, (_, i) => row.buttons[i] ?? { index: i + 1, push: "", pull: "" }) });
            }}>{Array.from({ length: MAX_BUTTONS_PER_ROW - MIN_BUTTONS_PER_ROW + 1 }, (_, i) => i + MIN_BUTTONS_PER_ROW).map(count => <option key={count} value={count}>{count}</option>)}</select></label>
            <label className="field"><span>{t.offset} — {t.row} {rowIndex + 1}</span><select value={row.offsetY} onChange={e => changeRow(rowIndex, { ...row, offsetY: Number(e.target.value) })}>
              {Array.from({ length: MAX_ROW_OFFSET - MIN_ROW_OFFSET + 1 }, (_, i) => i + MIN_ROW_OFFSET).map(offset => <option key={offset} value={offset}>{offset > 0 ? "+" : ""}{offset}</option>)}
            </select></label>
            <p className="editor-offset-hint">{t.offsetHint}</p>
            <table><thead><tr><th scope="col">N°</th><th scope="col">{t.push}</th><th scope="col">{t.pull}</th></tr></thead>
              <tbody>{[...row.buttons].reverse().map(button => <tr key={button.index}>
                <th scope="row">{button.index}</th>
                {(["push", "pull"] as const).map(direction => {
                  const invalid = normalizeKeyboardNote(button[direction]) === null;
                  const label = `${t.row} ${rowIndex + 1}, ${t.button.toLowerCase()} ${button.index}, ${t[direction]}`;
                  return <td key={direction}><input value={button[direction]} maxLength={12} aria-label={label} aria-invalid={invalid}
                    title={invalid ? t.invalidNote : label} autoComplete="off" spellCheck={false}
                    onChange={e => changeRow(rowIndex, { ...row, buttons: row.buttons.map(b => b.index === button.index ? { ...b, [direction]: e.target.value } : b) })} /></td>;
                })}
              </tr>)}</tbody>
            </table>
          </fieldset>).reverse()}
        </div>
        <aside className="panel-card editor-preview" aria-label={t.preview}>
          <h3>{t.preview}</h3><p className="songbook-subtitle">{t.push} / {t.pull}</p>
          <AccordionKeyboard rows={draft.rows.map(row => ({ ...row, buttons: row.buttons.map(b => ({ ...b, push: normalizeKeyboardNote(b.push) ?? "", pull: normalizeKeyboardNote(b.pull) ?? "" })) }))} notation={notation} scale={0.7} />
        </aside>
      </div>
    </form>}
  </section>;
}
