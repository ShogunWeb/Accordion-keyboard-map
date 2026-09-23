import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { Drawer } from "./components/Drawer";
import { MobileKeyboard } from "./components/MobileKeyboard";
import { useCompactLayout } from "./hooks/useCompactLayout";
import { AccordionKeyboard } from "./components/AccordionKeyboard";
import { useKeyboards } from "./hooks/useKeyboards";
import { KeyboardEditor } from "./components/KeyboardEditor";
import favicon from "/favicon.svg";
import { formatNoteLabel } from "./utils/noteUtils";
import { chordTypes, getSelectionHighlights, rootNotes } from "./utils/musicUtils";
import { ChordReferenceButton } from "./components/ChordReferenceButton";
import { Songbook } from "./components/Songbook";
import { useSongbook } from "./hooks/useSongbook";
import type { ChordSpec } from "./data/songs";
import type { NoteNotation } from "./utils/noteUtils";
import { activateServiceWorkerUpdate, registerServiceWorker } from "./serviceWorker";
import { buildVersion } from "./buildInfo";

type Language = "en" | "fr";
const STORAGE_KEY = "akm-settings";

/** Static UI translations keyed by language. */
const translations: Record<Language, Record<string, string>> = {
  en: {
    title: "Accordion Keyboard Map",
    keyboard: "Keyboard",
    mode: "Mode",
    chord: "Chord",
    scale: "Scale",
    fundamental: "Root",
    type: "Type",
    apply: "Apply",
    legend: "Legend",
    legendUnselected: "Not selected",
    legendSelected: "Selected",
    legendPush: "Push",
    legendPull: "Pull",
    settings: "Settings",
    language: "Language",
    notation: "Notation",
    notationAnglo: "C, D, E",
    notationFrench: "Do, Ré, Mi",
    feedback: "Feedback",
    feedbackPlaceholder: "Please send any feedback regarding the use of the app.",
    feedbackSend: "Send feedback",
    showLegend: "Show legend",
    updateAvailable: "New version available",
    updateNow: "Update",
    updateLater: "Later",
    buildLabel: "Build",
    explore: "Keyboard",
    songs: "My songs",
    keyboards: "My keyboards",
    addToSong: "Add to a song",
    navigation: "Views",
    menu: "Menu", moreActions: "More actions", fitScreen: "Fit to screen",
    closePanel: "Close panel", done: "Done", editSelection: "Choose a chord or scale",
    zoomIn: "Increase keyboard size", zoomOut: "Decrease keyboard size", resizeKeyboard: "Keyboard zoom",
    keyboardViewport: "Keyboard preview; scroll to explore when zoomed"
  },
  fr: {
    title: "Clavier d'accordéon",
    keyboard: "Clavier",
    mode: "Mode",
    chord: "Accord",
    scale: "Gamme",
    fundamental: "Fondamentale",
    type: "Type",
    apply: "Appliquer",
    legend: "Légende",
    legendUnselected: "Non sélectionné",
    legendSelected: "Sélectionné",
    legendPush: "Poussé",
    legendPull: "Tiré",
    settings: "Paramètres",
    language: "Langue",
    notation: "Notation",
    notationAnglo: "C, D, E",
    notationFrench: "Do, Ré, Mi",
    feedback: "Retour",
    feedbackPlaceholder: "Veuillez envoyer tout retour sur l'utilisation de l'application.",
    feedbackSend: "Envoyer",
    showLegend: "Afficher la légende",
    updateAvailable: "Nouvelle version disponible",
    updateNow: "Mettre à jour",
    updateLater: "Plus tard",
    buildLabel: "Build n°",
    explore: "Clavier",
    songs: "Mes morceaux",
    keyboards: "Mes claviers",
    addToSong: "Ajouter à un morceau",
    navigation: "Vues",
    menu: "Menu", moreActions: "Autres actions", fitScreen: "Ajuster à l’écran",
    closePanel: "Fermer le panneau", done: "Terminé", editSelection: "Choisir un accord ou une gamme",
    zoomIn: "Agrandir le clavier", zoomOut: "Réduire le clavier", resizeKeyboard: "Zoom du clavier",
    keyboardViewport: "Aperçu du clavier ; faites défiler après avoir zoomé"
  }
};

/** Scale types offered by the selector. */
const scaleTypes = ["major","minor","harmonic minor","melodic minor","dorian","phrygian","lydian","mixolydian","locrian"];
const scaleLabelsFr: Record<string, string> = {
  "major": "majeure",
  "minor": "mineure",
  "harmonic minor": "mineure harmonique",
  "melodic minor": "mineure mélodique",
  "dorian": "dorien",
  "phrygian": "phrygien",
  "lydian": "lydien",
  "mixolydian": "mixolydien",
  "locrian": "locrien"
};
const chordLabels: Record<Language, Record<string, string>> = {
  en: { maj: "major", min: "minor", "7": "7th", m7: "minor 7th", maj7: "major 7th", dim: "diminished", aug: "augmented", sus2: "sus2", sus4: "sus4" },
  fr: { maj: "majeur", min: "mineur", "7": "7e", m7: "mineur 7", maj7: "majeur 7", dim: "diminué", aug: "augmenté", sus2: "sus2", sus4: "sus4" },
};
const zoomLevels = [0.7, 0.8, 0.9, 1, 1.2] as const;

/**
 * Root UI for selecting an accordion layout and highlighting notes belonging
 * to the chosen chord or scale.
 */
export const App: React.FC = () => {
  const keyboardLibrary = useKeyboards();
  const { keyboards } = keyboardLibrary;
  const defaultKeyboard = keyboards.find(k => k.id === "image-3rangs") ?? keyboards[0];
  const [selectedKeyboardId, setSelectedKeyboardId] = useState(() => {
    try {
      const id: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")?.keyboardId;
      if (keyboards.some(k => k.id === id)) return id as string;
    } catch { /* Keep the default if saved preferences cannot be read. */ }
    return defaultKeyboard.id;
  });
  const selectedKeyboard = keyboards.find(k => k.id === selectedKeyboardId) ?? defaultKeyboard;
  const [selectionMode, setSelectionMode] = useState<"chord" | "scale">("chord");
  const [language, setLanguage] = useState<Language>("en");
  const [notation, setNotation] = useState<NoteNotation>("anglo");
  const isMobile = useCompactLayout();
  const [zoomIndex, setZoomIndex] = useState(isMobile ? 1 : 3);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<"selection" | "settings" | "navigation" | "actions">("selection");
  const [feedbackText, setFeedbackText] = useState("");
  const [showLegend, setShowLegend] = useState(true);
  const [updateRegistration, setUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const [fundamental, setFundamental] = useState("C");
  const [type, setType] = useState("maj");
  const book = useSongbook(keyboards);
  const [view, setView] = useState<"keyboard" | "songs" | "keyboards">("keyboard");
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [songDraft, setSongDraft] = useState<ChordSpec>({ root: "C", type: "maj" });

  const t = useMemo(() => translations[language], [language]);

  useEffect(() => {
    registerServiceWorker({ onUpdate: setUpdateRegistration });
  }, []);

  const { highlightNotes, highlightLabels } = useMemo(
    () => getSelectionHighlights(selectionMode, fundamental, type),
    [selectionMode, fundamental, type]
  );

  // Reset only on a user mode switch, so restored preferences keep their type.
  const changeMode = (mode: "chord" | "scale") => {
    if (mode !== selectionMode) {
      setSelectionMode(mode);
      setType(mode === "chord" ? "maj" : "major");
    }
  };

  const selectionTypeLabel = selectionMode === "chord" ? chordLabels[language][type] ?? type
    : language === "fr" ? scaleLabelsFr[type] ?? type : type;
  const selectionLabel = `${formatNoteLabel(fundamental, notation)} ${selectionTypeLabel}`;

  const zoomIn = () => setZoomIndex(i => Math.min(zoomLevels.length - 1, i + 1));
  const zoomOut = () => setZoomIndex(i => Math.max(0, i - 1));
  const openDrawer = (view: "selection" | "settings" | "navigation" | "actions") => {
    setDrawerView(view);
    setDrawerOpen(true);
  };
  const closeDrawer = () => setDrawerOpen(false);
  const navigate = (next: typeof view) => { setView(next); closeDrawer(); };
  const addToSong = () => {
    setSongDraft({ root: fundamental, type });
    navigate("songs");
  };
  const drawerTitle = drawerView === "selection" ? t.editSelection
    : drawerView === "navigation" ? t.menu : drawerView === "actions" ? t.moreActions : t.settings;

  // Keep document title in sync with language/app title
  useEffect(() => {
    document.title = t.title;
  }, [t.title]);

  // Load saved preferences on first render
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<{
          keyboardId: string;
          language: Language;
          notation: NoteNotation;
          fundamental: string;
          type: string;
          selectionMode: "chord" | "scale";
          zoomIndex: number;
          showLegend: boolean;
        }>;
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.notation) setNotation(parsed.notation);
        if (parsed.fundamental) setFundamental(parsed.fundamental);
        if (parsed.type) setType(parsed.type);
        if (parsed.selectionMode) {
          setSelectionMode(parsed.selectionMode);
        }
        if (typeof parsed.zoomIndex === "number") {
          const clamped = Math.min(Math.max(0, parsed.zoomIndex), zoomLevels.length - 1);
          setZoomIndex(clamped);
        }
        if (typeof parsed.showLegend === "boolean") {
          setShowLegend(parsed.showLegend);
        }
        return;
      }
      // No saved language: infer from browser locale
      const navLang = (navigator.language || navigator.languages?.[0] || "").toLowerCase();
      if (navLang.startsWith("fr")) {
        setLanguage("fr");
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  // Persist preferences whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          keyboardId: selectedKeyboard.id,
          language,
          notation,
          fundamental,
          type,
          selectionMode,
          zoomIndex,
          showLegend
        })
      );
    } catch {
      // storage may be unavailable (private mode)
    }
  }, [selectedKeyboard.id, language, notation, fundamental, type, selectionMode, zoomIndex, showLegend]);

  const updateAvailable = updateRegistration !== null;

  const updateApp = () => {
    if (updateRegistration) {
      activateServiceWorkerUpdate(updateRegistration);
    }
  };

  const submitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    const body = encodeURIComponent(feedbackText.trim());
    const subject = encodeURIComponent("Accordion keyboard - user feedback");
    const mailto = `mailto:accordion@shogunweb.be?subject=${subject}${body ? `&body=${body}` : ""}`;
    window.location.href = mailto;
  };

  return (
    <>
    <main className={`app-shell ${isMobile && view === "keyboard" ? "compact-explorer" : ""}`} inert={drawerOpen} tabIndex={-1}>
      <header className="top-bar">
        <div className="brand">
          <img className="brand-mark" src={favicon} alt="Accordion keyboard icon" />
          <h1 className="app-title">{t.title}</h1>
        </div>
      </header>

      {!isMobile && <nav className="app-navigation" aria-label={t.navigation}>
        <button type="button" className={view === "keyboard" ? "active" : ""} aria-current={view === "keyboard" ? "page" : undefined} onClick={() => { setView("keyboard"); closeDrawer(); }}>{t.explore}</button>
        <button type="button" className={view === "songs" ? "active" : ""} aria-current={view === "songs" ? "page" : undefined} onClick={() => { setView("songs"); closeDrawer(); }}>{t.songs}</button>
        <button type="button" className={view === "keyboards" ? "active" : ""} aria-current={view === "keyboards" ? "page" : undefined} onClick={() => { setView("keyboards"); closeDrawer(); }}>{t.keyboards}</button>
        <button className="navigation-settings" type="button" aria-label={t.settings} onClick={() => openDrawer("settings")}>⚙︎</button>
      </nav>}
      {isMobile && view !== "keyboard" && <div className="mobile-view-header">
        <button className="mobile-control" type="button" onClick={() => openDrawer("navigation")} aria-expanded={drawerOpen && drawerView === "navigation"}>☰ {t.menu}</button>
      </div>}

      <div hidden={view !== "keyboards"}>
        <KeyboardEditor library={keyboardLibrary} language={language} notation={notation} selectedKeyboardId={selectedKeyboard.id} compact={isMobile}
          onUse={id => { setSelectedKeyboardId(id); setView("keyboard"); }} />
      </div>
      {view === "songs" ? (
        <Songbook keyboards={keyboards} book={book} activeSongId={activeSongId} onActiveSongChange={setActiveSongId}
          defaultKeyboardId={selectedKeyboard.id} initialChord={songDraft} language={language} notation={notation} />
      ) : view === "keyboard" ? <section className="panel-card keyboard-card">
        {isMobile ? <MobileKeyboard key={selectedKeyboard.id} selectionLabel={selectionLabel} showLegend={showLegend} text={t}
          onMenu={() => openDrawer("navigation")} onSelection={() => openDrawer("selection")} onActions={() => openDrawer("actions")}>
          <AccordionKeyboard rows={selectedKeyboard.rows} highlightNotes={highlightNotes} highlightLabels={highlightLabels} notation={notation} />
        </MobileKeyboard> : <>
        <div className="keyboard-wrapper">
          <div className="keyboard-overlay">
            <button
              className="pill pill-button"
              type="button"
              aria-expanded={drawerOpen && drawerView === "selection"}
              aria-label={t.editSelection}
              onClick={() => openDrawer("selection")}
            >
              {selectionLabel}
            </button>
            <div className="zoom-controls" aria-label={t.resizeKeyboard}>
              <button
                className="zoom-button"
                type="button"
                onClick={zoomIn}
                disabled={zoomIndex === zoomLevels.length - 1}
                aria-label={t.zoomIn}
              >
                +
              </button>
              <button
                className="zoom-button"
                type="button"
                onClick={zoomOut}
                disabled={zoomIndex === 0}
                aria-label={t.zoomOut}
              >
                −
              </button>
            </div>
            <div className="mode-toggle" aria-label={t.mode}>
              <button
                type="button"
                className={`mode-button ${selectionMode === "chord" ? "active" : ""}`}
                onClick={() => changeMode("chord")}
              >
                {t.chord}
              </button>
              <button
                type="button"
                className={`mode-button ${selectionMode === "scale" ? "active" : ""}`}
                onClick={() => changeMode("scale")}
              >
                {t.scale}
              </button>
            </div>
          </div>
          <AccordionKeyboard
            rows={selectedKeyboard.rows}
            highlightNotes={highlightNotes}
            highlightLabels={highlightLabels}
            notation={notation}
            scale={zoomLevels[zoomIndex]}
          />
          {showLegend && (
            <div className="legend legend-inline">
              <span className="legend-text">{t.legendPush}</span>
              <span className="split-circle" aria-hidden="true">
                <span className="half left" />
                <span className="half right" />
              </span>
              <span className="legend-text">{t.legendPull}</span>
            </div>
          )}

        </div>
        {selectionMode === "chord" && <div className="keyboard-song-action">
          <button className="song-button primary" type="button" onClick={addToSong}>+ {t.addToSong}</button>
        </div>}
        <ChordReferenceButton keyboard={selectedKeyboard} language={language} notation={notation} />
        </>}
      </section> : null}
    </main>

      {drawerOpen && <Drawer title={drawerTitle} closeLabel={t.closePanel} onClose={closeDrawer}>
          {drawerView === "navigation" ? <nav className="drawer-navigation" aria-label={t.navigation}>
            <button className="song-button" type="button" aria-current={view === "keyboard" ? "page" : undefined} onClick={() => navigate("keyboard")}>{t.explore}</button>
            <button className="song-button" type="button" aria-current={view === "songs" ? "page" : undefined} onClick={() => navigate("songs")}>{t.songs}</button>
            <button className="song-button" type="button" aria-current={view === "keyboards" ? "page" : undefined} onClick={() => navigate("keyboards")}>{t.keyboards}</button>
            <button className="song-button" type="button" onClick={() => openDrawer("settings")}>{t.settings}</button>
          </nav> : drawerView === "actions" ? <div className="selector-grid">
            {selectionMode === "chord" && <button className="song-button primary" type="button" onClick={addToSong}>+ {t.addToSong}</button>}
            <label className="field checkbox-field"><span>{t.showLegend}</span>
              <input type="checkbox" checked={showLegend} onChange={e => setShowLegend(e.target.checked)} />
            </label>
            <ChordReferenceButton keyboard={selectedKeyboard} language={language} notation={notation} />
          </div> : drawerView === "selection" ? (
            <div className="selector-grid">
              <div className="toggle" role="group" aria-label={t.mode}>
                <button className={`toggle-option ${selectionMode === "chord" ? "active" : ""}`} type="button" aria-pressed={selectionMode === "chord"} onClick={() => changeMode("chord")}>{t.chord}</button>
                <button className={`toggle-option ${selectionMode === "scale" ? "active" : ""}`} type="button" aria-pressed={selectionMode === "scale"} onClick={() => changeMode("scale")}>{t.scale}</button>
              </div>
              <label className="field">
                <span>{t.fundamental}</span>
                <select value={fundamental} onChange={e => setFundamental(e.target.value)}>
                  {rootNotes.map(n => (
                    <option key={n} value={n}>{formatNoteLabel(n, notation)}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t.type}</span>
                <select value={type} onChange={e => setType(e.target.value)}>
                  {selectionMode === "chord"
                    ? chordTypes.map(tVal => <option key={tVal} value={tVal}>{chordLabels[language][tVal] ?? tVal}</option>)
                    : scaleTypes.map(tVal => (
                      <option key={tVal} value={tVal}>
                        {language === "fr" ? scaleLabelsFr[tVal] ?? tVal : tVal}
                      </option>
                    ))
                  }
                </select>
              </label>
              <button className="song-button primary" type="button" onClick={closeDrawer}>{t.done}</button>
            </div>
          ) : (
            <div className="selector-grid settings-grid">
              <label className="field">
                <span>{t.keyboard}</span>
                <select
                  value={selectedKeyboard.id}
                  onChange={e => {
                    const kb = keyboards.find(k => k.id === e.target.value);
                    if (kb) setSelectedKeyboardId(kb.id);
                  }}
                >
                  {keyboards.map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t.language}</span>
                <select value={language} onChange={e => setLanguage(e.target.value as Language)}>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </label>
              <label className="field">
                <span>{t.notation}</span>
                <div className="toggle">
                  <button
                    type="button"
                    className={`toggle-option ${notation === "anglo" ? "active" : ""}`}
                    onClick={() => setNotation("anglo")}
                  >
                    {t.notationAnglo}
                  </button>
                  <button
                    type="button"
                    className={`toggle-option ${notation === "fr" ? "active" : ""}`}
                    onClick={() => setNotation("fr")}
                  >
                    {t.notationFrench}
                  </button>
                </div>
              </label>
              <label className="field checkbox-field">
                <span>{t.showLegend}</span>
                <input
                  type="checkbox"
                  checked={showLegend}
                  onChange={e => setShowLegend(e.target.checked)}
                />
              </label>
              <form className="field feedback" onSubmit={submitFeedback}>
                <div className="feedback-header">
                  <span>{t.feedback}</span>
                  <button className="send-button" type="submit">{t.feedbackSend}</button>
                </div>
                <textarea
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder={t.feedbackPlaceholder}
                  rows={4}
                />
              </form>
              <a
                className="source-link"
                href="https://github.com/ShogunWeb/Accordion-keyboard-map"
                target="_blank"
                rel="noreferrer"
              >
                <svg className="github-mark" aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                  <path
                    fill="currentColor"
                    d="M12 2a10 10 0 0 0-3.162 19.492c.5.092.683-.217.683-.483 0-.238-.01-1.024-.014-1.858-2.782.604-3.37-1.19-3.37-1.19-.455-1.156-1.11-1.465-1.11-1.465-.908-.62.069-.608.069-.608 1.004.07 1.532 1.03 1.532 1.03.893 1.53 2.341 1.087 2.91.831.09-.647.35-1.088.636-1.339-2.22-.253-4.556-1.11-4.556-4.944 0-1.092.39-1.987 1.03-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.56 9.56 0 0 1 2.5.336c1.909-1.295 2.748-1.026 2.748-1.026.546 1.378.202 2.397.1 2.65.64.701 1.028 1.596 1.028 2.688 0 3.844-2.34 4.688-4.57 4.936.36.31.68.923.68 1.86 0 1.344-.012 2.428-.012 2.758 0 .268.18.58.688.48A10 10 0 0 0 12 2Z"
                  />
                </svg>
                <span>Source code</span>
              </a>
              <p className="build-version">{t.buildLabel} {buildVersion}</p>
            </div>
          )}
      </Drawer>}

      {updateAvailable && (
        <div className="update-toast" role="status" aria-live="polite">
          <span>{t.updateAvailable}</span>
          <div className="update-actions">
            <button className="update-button primary" type="button" onClick={updateApp}>
              {t.updateNow}
            </button>
            <button className="update-button" type="button" onClick={() => setUpdateRegistration(null)}>
              {t.updateLater}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
