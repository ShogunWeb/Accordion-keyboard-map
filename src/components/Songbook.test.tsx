import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Songbook } from "./Songbook";
import { useSongbook } from "../hooks/useSongbook";
import { downloadSongFile, serializeSongFile } from "../utils/songTransfer";

vi.mock("../utils/songTransfer", async importOriginal => ({
  ...await importOriginal<typeof import("../utils/songTransfer")>(), downloadSongFile: vi.fn(),
}));
const incoming = { title: "Valse", keyboardId: "GC", chords: [{ root: "A", type: "min" }] };
function Harness() {
  const book = useSongbook();
  const [id, setId] = useState<string | null>(null);
  return <Songbook book={book} activeSongId={id} onActiveSongChange={setId} defaultKeyboardId="GC"
    initialChord={{ root: "C", type: "maj" }} language="fr" notation="anglo" />;
}
function chooseFile(raw: string) {
  const file = new File([raw], "songs.akm.json", { type: "application/json" });
  Object.defineProperty(file, "text", { value: async () => raw });
  fireEvent.change(screen.getByLabelText("Importer des morceaux"), { target: { files: [file] } });
}
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
afterEach(cleanup);

describe("song file exchange UI", () => {
  it("previews an import, adds it on confirmation and offers both export scopes", async () => {
    render(<Harness />);
    chooseFile(serializeSongFile([incoming]));
    const preview = await screen.findByRole("region", { name: "Morceaux à importer" });
    expect(within(preview).getByText("Valse")).toBeInTheDocument();
    expect(localStorage.getItem("akm-songbook")).toBeNull();
    fireEvent.click(within(preview).getByRole("button", { name: "Ajouter ces morceaux" }));
    expect(screen.getByRole("article", { name: "Am" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("akm-songbook")!).songs).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Exporter ce morceau" }));
    expect(downloadSongFile).toHaveBeenLastCalledWith([expect.objectContaining({ ...incoming, chords: [expect.objectContaining(incoming.chords[0])] })], "Valse");
    fireEvent.click(screen.getByRole("button", { name: "Tout exporter" }));
    expect(downloadSongFile).toHaveBeenLastCalledWith([expect.objectContaining({ ...incoming, chords: [expect.objectContaining(incoming.chords[0])] })]);
  });

  it("requires resolving unknown keyboards before adding songs", async () => {
    render(<Harness />);
    chooseFile(serializeSongFile([{ ...incoming, keyboardId: "foreign-layout" }]));
    const preview = await screen.findByRole("region", { name: "Morceaux à importer" });
    const add = within(preview).getByRole("button", { name: "Ajouter ces morceaux" });
    expect(add).toBeDisabled();
    fireEvent.change(within(preview).getByRole("combobox"), { target: { value: "DG" } });
    expect(add).toBeEnabled();
    fireEvent.click(add);
    expect(JSON.parse(localStorage.getItem("akm-songbook")!).songs[0].keyboardId).toBe("DG");
  });

  it("supports cancellation and rejects invalid files without writing anything", async () => {
    render(<Harness />);
    chooseFile(serializeSongFile([incoming]));
    const preview = await screen.findByRole("region", { name: "Morceaux à importer" });
    fireEvent.click(within(preview).getByRole("button", { name: "Annuler" }));
    expect(screen.queryByRole("region", { name: "Morceaux à importer" })).not.toBeInTheDocument();
    chooseFile('{"format":"other"}');
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("invalide"));
    expect(localStorage.getItem("akm-songbook")).toBeNull();
  });
});
