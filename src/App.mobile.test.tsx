import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { exportSongPdf } from "./utils/exportSongPdf";

vi.mock("./serviceWorker", () => ({ registerServiceWorker: vi.fn(), activateServiceWorkerUpdate: vi.fn() }));
vi.mock("./utils/exportSongPdf", () => ({ exportSongPdf: vi.fn().mockResolvedValue(undefined) }));
let compact = true;
let listeners: Set<() => void>;
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const select = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => {
  compact = true;
  listeners = new Set();
  vi.spyOn(window, "matchMedia").mockImplementation(query => ({
    get matches() { return compact; }, media: query, onchange: null,
    addEventListener: (_event: string, handler: () => void) => { listeners.add(handler); },
    removeEventListener: (_event: string, handler: () => void) => { listeners.delete(handler); },
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }) as unknown as MediaQueryList);
  localStorage.clear();
  localStorage.setItem("akm-settings", JSON.stringify({ language: "fr", notation: "fr", fundamental: "D", type: "min", zoomIndex: 4 }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllMocks(); });

describe("compact mobile app", () => {
  it("starts fitted despite desktop zoom, zooms manually, then restores fit and scroll position", () => {
    render(<App />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    const stage = screen.getByRole("region", { name: /Aperçu du clavier/ });
    expect(stage).toHaveStyle({ "--keyboard-zoom": "1" });
    expect(screen.getByRole("button", { name: "Ajuster à l’écran" })).toHaveAttribute("aria-pressed", "true");
    click("Agrandir le clavier");
    expect(stage).toHaveStyle({ "--keyboard-zoom": "1.25" });
    stage.scrollTop = 100; stage.scrollLeft = 30;
    click("Ajuster à l’écran");
    expect(stage.scrollTop).toBe(0); expect(stage.scrollLeft).toBe(0);
    expect(stage).toHaveStyle({ "--keyboard-zoom": "1" });
    expect(JSON.parse(localStorage.getItem("akm-settings")!).zoomIndex).toBe(4);
  });

  it("uses one musical selector and preserves the chosen mode and type after reload", () => {
    const { unmount } = render(<App />);
    click(/Choisir un accord ou une gamme/);
    expect(screen.getByLabelText("Type")).toHaveValue("min");
    select("Type", "7"); select("Fondamentale", "E");
    click("Terminé");
    expect(screen.getByRole("button", { name: /Mi 7e/ })).toBeInTheDocument();
    click(/Choisir un accord ou une gamme/); click("Gamme");
    select("Type", "dorian"); click("Terminé");
    expect(screen.getByRole("button", { name: /Mi dorien/ })).toBeInTheDocument();
    unmount(); render(<App />);
    click(/Choisir un accord ou une gamme/);
    expect(screen.getByLabelText("Type")).toHaveValue("dorian");
    expect(screen.getByRole("button", { name: "Gamme" })).toHaveAttribute("aria-pressed", "true");
  });

  it("contains focus in the menu, closes with Escape and restores its trigger", () => {
    render(<App />);
    const menu = screen.getByRole("button", { name: /Menu/ });
    menu.focus(); fireEvent.click(menu);
    const dialog = screen.getByRole("dialog", { name: "Menu" });
    const close = within(dialog).getByRole("button", { name: "Fermer le panneau" });
    expect(close).toHaveFocus();
    expect(screen.getByRole("main", { hidden: true })).toHaveAttribute("inert");
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(within(dialog).getByRole("button", { name: "Paramètres" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab" }); expect(close).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(menu).toHaveFocus(); expect(document.body.style.overflow).toBe("");
  });

  it("keeps song creation, legend settings and the PDF reference accessible through actions", async () => {
    render(<App />);
    expect(screen.queryByRole("button", { name: /recueil/ })).not.toBeInTheDocument();
    click("Autres actions");
    fireEvent.click(screen.getByLabelText("Afficher la légende"));
    click("Télécharger le recueil d’accords (PDF)");
    await screen.findByRole("button", { name: "Télécharger le recueil d’accords (PDF)" });
    expect(exportSongPdf).toHaveBeenCalledWith(expect.objectContaining({ pages: expect.arrayContaining([expect.objectContaining({ cards: expect.any(Array) })]) }));
    click("+ Ajouter à un morceau");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    select("Titre du morceau", "Valse mobile"); click("Créer le morceau"); click("Ajouter Rem");
    expect(screen.getByRole("article", { name: "Rem" })).toBeInTheDocument();
    click(/Menu/); click("Clavier");
    expect(document.querySelector(".mobile-legend")).not.toBeInTheDocument();
  });

  it("edits one row at a time without losing the other rows, with a collapsible preview", () => {
    render(<App />); click(/Menu/); click("Mes claviers"); click("Créer une copie");
    expect(screen.getByLabelText("Rang 1, touche 1, Poussé")).toBeInTheDocument();
    expect(screen.queryByLabelText("Rang 2, touche 1, Poussé")).not.toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "Aperçu" })).not.toBeInTheDocument();
    select("Rang 1, touche 1, Poussé", "Do#4");
    click("Rang 2"); select("Rang 2, touche 1, Tiré", "Sib3");
    click("Afficher l’aperçu");
    expect(screen.getByRole("complementary", { name: "Aperçu" }).querySelectorAll("circle")).toHaveLength(34);
    click("Masquer l’aperçu"); click("Rang 1");
    expect(screen.getByLabelText("Rang 1, touche 1, Poussé")).toHaveValue("Do#4");
    click("Enregistrer le clavier");
    const keyboard = JSON.parse(localStorage.getItem("akm-custom-keyboards")!).keyboards[0];
    expect(keyboard.rows[0].buttons[0].push).toBe("C#4");
    expect(keyboard.rows[1].buttons[0].pull).toBe("Bb3");
    click("Rang 3"); vi.spyOn(window, "confirm").mockReturnValue(true);
    select("Nombre de rangs", "2");
    expect(screen.getByRole("button", { name: "Rang 2" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Rang 2, touche 1, Tiré")).toHaveValue("Bb3");
  });

  it("reacts to orientation and viewport changes without losing a musical selection", () => {
    render(<App />);
    act(() => { compact = false; listeners.forEach(listener => listener()); });
    expect(screen.getByRole("navigation", { name: "Vues" })).toBeInTheDocument();
    expect(document.querySelector(".mobile-keyboard")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choisir un accord ou une gamme" })).toHaveTextContent("Re mineur");
    act(() => { compact = true; listeners.forEach(listener => listener()); });
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Re mineur/ })).toBeInTheDocument();
  });
});
