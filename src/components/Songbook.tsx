import { useRef, useState } from "react";
import { AccordionKeyboard } from "./AccordionKeyboard";
import { keyboards } from "../data";
import type { ChordSpec, Song } from "../data/songs";
import type { useSongbook } from "../hooks/useSongbook";
import { chordTypes, formatChordName, getSelectionHighlights, rootNotes } from "../utils/musicUtils";
import { formatNoteLabel } from "../utils/noteUtils";
import type { NoteNotation } from "../utils/noteUtils";
import "./Songbook.css";

const translations = {
  en: {
    title: "My songs", saved: "Saved in this browser", newSong: "New song", songName: "Song title",
    namePlaceholder: "e.g. Autumn waltz", create: "Create song", cancel: "Cancel", selectSong: "Open a song",
    keyboard: "Keyboard for this song", empty: "Create a song to collect its chords and print their keyboards.",
    emptyChords: "Add the chords used in this song. Each chord appears only once.",
    addChord: "Add a chord", editChord: "Edit chord", root: "Root", quality: "Type",
    add: "Add", save: "Save chord", duplicate: "This chord is already in the song.",
    edit: "Edit", remove: "Remove", earlier: "Move earlier", later: "Move later",
    download: "Download PDF", exporting: "Preparing PDF…", pdfHint: "A4 landscape · automatic layout",
    pdfError: "The PDF could not be created. If you are offline, reconnect and try again.",
    deleteSong: "Delete song", deleteQuestion: "Delete this song and all its chords?", confirmDelete: "Delete",
    push: "Push", pull: "Pull", chordCount: "chords", keyboardMissing: "This keyboard is unavailable. Choose another keyboard for this song.",
    storageUnavailable: "Saving is unavailable. Changes are kept for this session only; you can still download a PDF.",
    storageQuota: "Browser storage is full. Recent changes have not been saved; you can still download a PDF.",
    storageInvalid: "Saved songs could not be read. They have been preserved, but new changes cannot be saved in this browser.",
    added: "Chord added.", updated: "Chord updated.", removed: "Chord removed.", moved: "Chord order updated.",
    major: "Major", minor: "Minor", seventh: "7th", minorSeventh: "Minor 7th", majorSeventh: "Major 7th",
    diminished: "Diminished", augmented: "Augmented", sus2: "Sus2", sus4: "Sus4"
  },
  fr: {
    title: "Mes morceaux", saved: "Enregistrés dans ce navigateur", newSong: "Nouveau morceau", songName: "Titre du morceau",
    namePlaceholder: "Ex. Valse d’automne", create: "Créer le morceau", cancel: "Annuler", selectSong: "Ouvrir un morceau",
    keyboard: "Clavier de ce morceau", empty: "Créez un morceau pour rassembler ses accords et imprimer leurs claviers.",
    emptyChords: "Ajoutez les accords utilisés dans ce morceau. Chaque accord apparaît une seule fois.",
    addChord: "Ajouter un accord", editChord: "Modifier l’accord", root: "Fondamentale", quality: "Type",
    add: "Ajouter", save: "Enregistrer l’accord", duplicate: "Cet accord est déjà dans le morceau.",
    edit: "Modifier", remove: "Retirer", earlier: "Déplacer avant", later: "Déplacer après",
    download: "Télécharger le PDF", exporting: "Préparation du PDF…", pdfHint: "A4 paysage · disposition automatique",
    pdfError: "Le PDF n’a pas pu être créé. Si vous êtes hors connexion, reconnectez-vous et réessayez.",
    deleteSong: "Supprimer le morceau", deleteQuestion: "Supprimer ce morceau et tous ses accords ?", confirmDelete: "Supprimer",
    push: "Poussé", pull: "Tiré", chordCount: "accords", keyboardMissing: "Ce clavier est indisponible. Choisissez un autre clavier pour ce morceau.",
    storageUnavailable: "L’enregistrement est indisponible. Les modifications sont conservées pour cette session uniquement ; vous pouvez télécharger un PDF.",
    storageQuota: "Le stockage du navigateur est plein. Les dernières modifications ne sont pas enregistrées ; vous pouvez télécharger un PDF.",
    storageInvalid: "Les morceaux enregistrés sont illisibles. Ils ont été conservés, mais les nouvelles modifications ne peuvent pas être enregistrées dans ce navigateur.",
    added: "Accord ajouté.", updated: "Accord modifié.", removed: "Accord retiré.", moved: "Ordre des accords modifié.",
    major: "Majeur", minor: "Mineur", seventh: "7e", minorSeventh: "Mineur 7e", majorSeventh: "Majeur 7e",
    diminished: "Diminué", augmented: "Augmenté", sus2: "Sus2", sus4: "Sus4"
  }
};

type Language = keyof typeof translations;
type SongbookState = ReturnType<typeof useSongbook>;
interface SongbookProps {
  book: SongbookState;
  activeSongId: string | null;
  onActiveSongChange: (id: string) => void;
  defaultKeyboardId: string;
  initialChord: ChordSpec;
  language: Language;
  notation: NoteNotation;
}

/** Saved song library. Song state lives in App so unsaved data survives view changes. */
export function Songbook({ book, activeSongId, onActiveSongChange, defaultKeyboardId, initialChord, language, notation }: SongbookProps) {
  const t = translations[language];
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const song = book.songs.find(item => item.id === activeSongId) ?? book.songs[0];
  const storageMessage = book.storageError === "invalid" ? t.storageInvalid
    : book.storageError === "quota" ? t.storageQuota : t.storageUnavailable;

  return (
    <section className="songbook" aria-labelledby="songbook-title">
      <div className="songbook-heading">
        <div><h2 id="songbook-title">{t.title}</h2><p className="songbook-subtitle">{t.saved}</p></div>
        {song && !creating && <button className="song-button" onClick={() => setCreating(true)}>+ {t.newSong}</button>}
      </div>
      {book.storageError && <p className="song-notice error" role="alert">{storageMessage}</p>}
      {(creating || !song) && (
        <form className="song-create panel-card" onSubmit={event => {
          event.preventDefault();
          if (!newTitle.trim()) return;
          const created = book.createSong(newTitle.trim(), defaultKeyboardId);
          onActiveSongChange(created.id);
          setNewTitle("");
          setCreating(false);
        }}>
          {!song && <p className="song-empty">{t.empty}</p>}
          <label className="field"><span>{t.songName}</span>
            <input value={newTitle} onChange={event => setNewTitle(event.target.value)} placeholder={t.namePlaceholder} maxLength={100} required autoFocus />
          </label>
          <div className="song-actions">
            <button className="song-button primary" type="submit" disabled={!newTitle.trim()}>{t.create}</button>
            {song && <button className="song-button" type="button" onClick={() => setCreating(false)}>{t.cancel}</button>}
          </div>
        </form>
      )}
      {song && <>
        <label className="field song-picker"><span>{t.selectSong}</span>
          <select value={song.id} onChange={event => onActiveSongChange(event.target.value)}>
            {book.songs.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}
          </select>
        </label>
        <SongDetails key={song.id} song={song} book={book} initialChord={initialChord} language={language} notation={notation} />
      </>}
    </section>
  );
}

function SongDetails({ song, book, initialChord, language, notation }: {
  song: Song; book: SongbookState; initialChord: ChordSpec; language: Language; notation: NoteNotation;
}) {
  const t = translations[language];
  const [draft, setDraft] = useState(initialChord);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const cardsRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLFormElement>(null);
  const keyboard = keyboards.find(item => item.id === song.keyboardId);
  const duplicate = song.chords.some(chord => chord.id !== editingId && chord.root === draft.root && chord.type === draft.type);
  const label = formatChordName(draft, notation);
  const qualityLabels = [t.major, t.minor, t.seventh, t.minorSeventh, t.majorSeventh, t.diminished, t.augmented, t.sus2, t.sus4];

  const downloadPdf = async () => {
    if (!keyboard || !cardsRef.current || exporting) return;
    setExporting(true);
    setPdfError(false);
    try {
      // Capture this sheet before loading the exporter; later edits cannot alter it.
      const cards = song.chords.map(chord => {
        const card = Array.from(cardsRef.current!.children).find(element => element.getAttribute("data-chord-id") === chord.id);
        const svg = card?.querySelector("svg");
        if (!svg) throw new Error("Missing keyboard");
        return { label: formatChordName(chord, notation), svg: svg.cloneNode(true) as SVGSVGElement };
      });
      const { exportSongPdf } = await import("../utils/exportSongPdf");
      await exportSongPdf({ title: song.title, keyboardName: keyboard.name, cards, language });
    } catch {
      setPdfError(true);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="song-details">
      <div className="song-metadata panel-card">
        <label className="field"><span>{t.songName}</span>
          <input defaultValue={song.title} maxLength={100} onBlur={event => {
            const title = event.target.value.trim();
            if (title) book.renameSong(song.id, title);
            event.target.value = title || song.title;
          }} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} />
        </label>
        <label className="field"><span>{t.keyboard}</span>
          <select value={song.keyboardId} onChange={event => book.setSongKeyboard(song.id, event.target.value)}>
            {!keyboard && <option value={song.keyboardId}>{song.keyboardId}</option>}
            {keyboards.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
      </div>
      {!keyboard && <p className="song-notice error" role="alert">{t.keyboardMissing}</p>}
      <form className="chord-composer panel-card" ref={composerRef} onSubmit={event => {
        event.preventDefault();
        if (duplicate) return;
        if (editingId) {
          book.updateChord(song.id, editingId, draft);
          setEditingId(null);
          setAnnouncement(t.updated);
        } else {
          book.addChord(song.id, draft);
          setAnnouncement(t.added);
        }
      }}>
        <h3>{editingId ? t.editChord : t.addChord}</h3>
        <div className="composer-fields">
          <label className="field"><span>{t.root}</span>
            <select value={draft.root} onChange={event => setDraft({ ...draft, root: event.target.value })}>
              {rootNotes.map(root => <option value={root} key={root}>{formatNoteLabel(root, notation)}</option>)}
            </select>
          </label>
          <label className="field"><span>{t.quality}</span>
            <select value={draft.type} onChange={event => setDraft({ ...draft, type: event.target.value })}>
              {chordTypes.map((type, index) => <option value={type} key={type}>{qualityLabels[index]}</option>)}
            </select>
          </label>
          <button className="song-button primary" type="submit" disabled={duplicate}>{editingId ? t.save : `${t.add} ${label}`}</button>
          {editingId && <button className="song-button" type="button" onClick={() => setEditingId(null)}>{t.cancel}</button>}
        </div>
        {duplicate && <p className="song-notice" role="status">{t.duplicate}</p>}
      </form>
      <div className="song-sheet-heading">
        <div><h3>{song.title}</h3><p className="songbook-subtitle">{song.chords.length} {t.chordCount}</p></div>
        <div className="song-download">
          <button className="song-button primary" disabled={!song.chords.length || !keyboard || exporting} onClick={downloadPdf}>
            {exporting ? t.exporting : t.download}
          </button>
          <small>{t.pdfHint}</small>
        </div>
      </div>
      {pdfError && <p className="song-notice error" role="alert">{t.pdfError}</p>}
      <p className="sr-only" role="status">{announcement}</p>
      {song.chords.length > 0 && keyboard && <div className="song-legend" aria-label={`${t.push} / ${t.pull}`}>
        <span><i className="push-swatch" />{t.push}</span><span><i className="pull-swatch" />{t.pull}</span>
      </div>}
      {!song.chords.length && <p className="song-empty panel-card">{t.emptyChords}</p>}
      <div className="song-cards" ref={cardsRef}>
        {song.chords.map((chord, index) => {
          const name = formatChordName(chord, notation);
          const highlights = getSelectionHighlights("chord", chord.root, chord.type);
          return (
            <article className={`song-chord-card panel-card ${editingId === chord.id ? "editing" : ""}`} key={chord.id} data-chord-id={chord.id} aria-label={name}>
              <div className="chord-card-heading"><span className="chord-number">{index + 1}</span><h4>{name}</h4></div>
              <div className="chord-card-actions">
                <button className="song-button icon" aria-label={`${t.earlier} ${name}`} title={t.earlier} disabled={index === 0} onClick={() => { book.moveChord(song.id, chord.id, -1); setAnnouncement(t.moved); }}>←</button>
                <button className="song-button icon" aria-label={`${t.later} ${name}`} title={t.later} disabled={index === song.chords.length - 1} onClick={() => { book.moveChord(song.id, chord.id, 1); setAnnouncement(t.moved); }}>→</button>
                <button className="song-button" aria-label={`${t.edit} ${name}`} onClick={() => {
                  setDraft({ root: chord.root, type: chord.type });
                  setEditingId(chord.id);
                  composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  composerRef.current?.querySelector("select")?.focus({ preventScroll: true });
                }}>{t.edit}</button>
                <button className="song-button danger" aria-label={`${t.remove} ${name}`} onClick={() => {
                  book.removeChord(song.id, chord.id);
                  if (editingId === chord.id) setEditingId(null);
                  setAnnouncement(t.removed);
                }}>{t.remove}</button>
              </div>
              {keyboard && <div className="song-keyboard" role="img" aria-label={`${name} — ${keyboard.name}`}>
                <AccordionKeyboard rows={keyboard.rows} {...highlights} notation={notation} />
              </div>}
            </article>
          );
        })}
      </div>
      <div className="song-delete">
        {confirmDelete ? <div className="song-delete-confirm" role="group" aria-label={t.deleteQuestion}>
          <p>{t.deleteQuestion}</p>
          <button className="song-button" onClick={() => setConfirmDelete(false)}>{t.cancel}</button>
          <button className="song-button danger" onClick={() => book.deleteSong(song.id)}>{t.confirmDelete}</button>
        </div> : <button className="song-button danger" onClick={() => setConfirmDelete(true)}>{t.deleteSong}</button>}
      </div>
    </div>
  );
}
