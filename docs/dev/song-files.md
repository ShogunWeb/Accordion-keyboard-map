# Song exchange format

Use a versioned UTF-8 JSON file (`*.akm.json`) to back up or share editable
song sheets. This format stores musical intent and a keyboard reference.
The app recalculates every highlighted position from the chord and keyboard.
PDF remains the printable format.

## Version 1

```json
{
  "format": "accordion-keyboard-map/songs",
  "version": 1,
  "songs": [
    {
      "title": "Valse d’été",
      "keyboardId": "GC",
      "chords": [
        { "root": "A", "type": "min" },
        { "root": "D", "type": "min" },
        { "root": "E", "type": "7" }
      ]
    }
  ]
}
```

- `songs` contains one or more songs, in file order.
- `title` is a nonempty string; surrounding whitespace is trimmed on import.
- `keyboardId` references a layout from the application's keyboard catalog.
- `chords` preserves display order, with no duplicate root/type pairs. An empty
  chord array is allowed for an unfinished song.
- Roots and chord types use the values in `src/utils/musicUtils.ts`, regardless
  of UI language or note notation. Enharmonic spellings such as A# and Bb are
  distinct and preserved. A repeated identical chord is invalid.
- Local song/chord IDs, UI preferences, SVGs, computed highlights, keyboard
  definitions and selected fingerings are not included.

A plain string such as `Am Dm E7` loses the song's name and keyboard reference
and needs a separate notation parser. Saving selected button positions would
bind the musical data to one layout. Structured root/type values let users
change keyboards while keeping the same chords. If manual fingerings are
introduced later, add a separately versioned representation rather than
reinterpreting the meaning of version 1.

## Import behavior

`src/utils/songTransfer.ts` implements validation, serialization and download.
No additional dependency or server is used. Files are limited to 2 MiB; exports
are validated against the same rules so the app cannot generate a file that
its importer would reject. Invalid JSON, a different format marker, unsupported
versions, invalid records/chords, or duplicates reject the whole file.

The UI previews song names, chord counts and keyboards before adding anything.
An unknown keyboard ID requires an explicit replacement from the installed
catalog; every song using that unknown ID gets the selected replacement. The
file does not embed a custom keyboard layout. Import a [keyboard file](keyboard-files.md)
first on another device to make custom layouts available. Matching IDs refer to the local
catalog version, so stable keyboard IDs remain important.

`useSongbook.importSongs()` revalidates resolved data and adds the entire batch
in one state/storage update. Songs and chords receive fresh IDs. Existing songs
are preserved; title collisions receive numbered suffixes such as `Valse (2)`.
Importing the same file twice creates additional copies rather than merging or
replacing previous data. If storage fails, the normal warning is displayed and
the imported songs remain available in memory for export.

The local `akm-songbook` storage envelope is a separate internal format and is
not accepted as an exchange file. Format versions must be handled explicitly
when evolving the exchange schema.

## Checks

- `songTransfer.test.ts`: round trips, musical spelling/order, schema errors,
  unknown keyboard references and size limits.
- `useSongbook.test.ts`: additive batch import, collision handling, fresh IDs,
  atomic rejection and quota failure.
- `Songbook.test.tsx`: preview/confirmation, cancellation, remapping and export
  scope (download itself mocked).
- Browser: download a single song and a library, import into a fresh browser,
  compare musical data, reload, import again without overwriting, then try an
  invalid file and an unknown keyboard. Verify mobile layout.
