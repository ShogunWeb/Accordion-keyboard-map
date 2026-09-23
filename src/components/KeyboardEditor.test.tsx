import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { blankRow, CUSTOM_KEYBOARDS_KEY, serializeKeyboardFile } from "../data/customKeyboards";

vi.mock("../serviceWorker", () => ({ registerServiceWorker: vi.fn(), activateServiceWorkerUpdate: vi.fn() }));
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("akm-settings", JSON.stringify({ language: "fr", notation: "fr" }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const stored = () => JSON.parse(localStorage.getItem(CUSTOM_KEYBOARDS_KEY)!).keyboards;

describe("keyboard editor in the application", () => {
  it("creates 3 rows of up to 14 buttons, validates notes, updates the explorer and restores the selection", () => {
    const { unmount } = render(<App />);
    click("Mes claviers"); click("+ Clavier vierge");
    change("Nom du clavier", "Mon accordéon"); change("Nombre de rangs", "3");
    for (const row of [1, 2, 3]) {
      const count = screen.getByLabelText(`Touches — Rang ${row}`);
      expect(within(count).getAllByRole("option").map(option => option.getAttribute("value")))
        .toEqual(["5", "6", "7", "8", "9", "10", "11", "12", "13", "14"]);
      const offset = screen.getByLabelText(`Décalage vertical — Rang ${row}`);
      expect(within(offset).getAllByRole("option").map(option => option.getAttribute("value")))
        .toEqual(["-3", "-2", "-1", "0", "1", "2", "3"]);
      fireEvent.change(count, { target: { value: "14" } });
    }
    change("Rang 1, touche 1, Poussé", "Do4");
    change("Rang 1, touche 1, Tiré", "H4");
    expect(screen.getByLabelText("Rang 1, touche 1, Tiré")).toHaveAttribute("aria-invalid", "true");
    click("Enregistrer le clavier");
    expect(screen.getByRole("alert")).toHaveTextContent("Vérifiez");
    expect(localStorage.getItem(CUSTOM_KEYBOARDS_KEY)).toBeNull();
    change("Rang 1, touche 1, Tiré", "Ré#4");
    change("Décalage vertical — Rang 2", "-1");
    click("Enregistrer le clavier");
    expect(stored()[0].rows.map((r: { buttons: unknown[] }) => r.buttons.length)).toEqual([14, 14, 14]);
    expect(stored()[0].rows[0].buttons[0]).toEqual({ index: 1, push: "C4", pull: "D#4" });
    expect(stored()[0].rows[1].offsetY).toBe(-1);
    click("Utiliser ce clavier");
    expect(document.querySelectorAll(".keyboard-card svg circle")).toHaveLength(42);
    expect(document.querySelectorAll('.keyboard-card svg path[fill="#4A90E2"]')).toHaveLength(1);
    unmount(); render(<App />);
    expect(document.querySelectorAll(".keyboard-card svg circle")).toHaveLength(42);
    expect(JSON.parse(localStorage.getItem("akm-settings")!).keyboardId).toBe(stored()[0].id);
  });

  it("keeps drafts across navigation, confirms destructive reductions and copies without changing built-ins", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<App />); click("Mes claviers"); click("Créer une copie");
    const source = screen.getByLabelText("Rang 3, touche 1, Poussé");
    expect(source).toHaveValue("Eb4");
    change("Nombre de rangs", "2");
    expect(confirm).toHaveBeenCalled();
    expect(screen.getByLabelText("Nombre de rangs")).toHaveValue("3");
    change("Touches — Rang 1", "5");
    expect(screen.getByLabelText("Touches — Rang 1")).toHaveValue("11");
    change("Nom du clavier", "Brouillon");
    click("Mes morceaux"); click("Mes claviers");
    expect(screen.getByLabelText("Nom du clavier")).toHaveValue("Brouillon");
    click("+ Clavier vierge");
    expect(screen.getByLabelText("Nom du clavier")).toHaveValue("Brouillon");
    confirm.mockReturnValue(true);
    change("Nombre de rangs", "2");
    change("Touches — Rang 1", "5");
    click("Enregistrer le clavier");
    expect(stored()[0].rows[0].buttons).toHaveLength(5);
    expect(stored()[0].rows).toHaveLength(2);
    expect(stored()[0].id).toMatch(/^custom-/);
    click("Clavier");
    expect(document.querySelectorAll(".keyboard-card svg circle")).toHaveLength(34);
  });

  it("previews imports before saving, preserves existing layouts on collision and rejects an invalid file", async () => {
    render(<App />); click("Mes claviers");
    const incoming = { id: "custom-import", name: "Importé", rows: [blankRow(), blankRow()] };
    const chooseFile = (raw: string) => {
      const file = new File([raw], "keyboards.akm.json");
      Object.defineProperty(file, "text", { value: async () => raw });
      fireEvent.change(screen.getByLabelText("Importer des claviers"), { target: { files: [file] } });
    };
    chooseFile(serializeKeyboardFile([incoming]));
    await screen.findByRole("region", { name: "Claviers à importer" });
    expect(localStorage.getItem(CUSTOM_KEYBOARDS_KEY)).toBeNull();
    click("Annuler l’import");
    expect(localStorage.getItem(CUSTOM_KEYBOARDS_KEY)).toBeNull();
    for (let i = 0; i < 2; i++) {
      chooseFile(serializeKeyboardFile([incoming]));
      await screen.findByRole("region", { name: "Claviers à importer" });
      click("Ajouter ces claviers");
    }
    expect(stored().map((k: { name: string }) => k.name)).toEqual(["Importé", "Importé (2)"]);
    chooseFile('{"version":2}');
    expect(await screen.findByRole("alert")).toHaveTextContent("Impossible de lire");
    expect(stored()).toHaveLength(2);
  });

  it("preserves the draft after a quota failure and retries saving", () => {
    render(<App />); click("Mes claviers"); click("+ Clavier vierge");
    change("Nom du clavier", "À conserver");
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Full", "QuotaExceededError"); });
    click("Enregistrer le clavier");
    expect(screen.getByRole("alert")).toHaveTextContent("a échoué");
    expect(screen.getByLabelText("Nom du clavier")).toHaveValue("À conserver");
    expect(screen.getByRole("button", { name: "Utiliser ce clavier" })).toBeDisabled();
    write.mockRestore(); click("Enregistrer le clavier");
    expect(stored()[0].name).toBe("À conserver");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
