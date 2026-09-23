# Custom keyboards and JSON exchange

`useKeyboards()` owns the custom keyboard catalog, loaded synchronously before
`useSongbook()` validates saved keyboard references. The combined built-in and
custom catalog is passed to the explorer, songbook and song validation. Built-in
layouts remain immutable; the editor creates copies with `custom-…` IDs.

## Version 1 file

```json
{
  "format": "accordion-keyboard-map/keyboards",
  "version": 1,
  "keyboards": [
    {
      "id": "custom-example",
      "name": "My two-row keyboard",
      "rows": [
        { "offsetY": 0, "buttons": [
          { "index": 1, "push": "C4", "pull": "D4" },
          { "index": 2, "push": "E4", "pull": "F4" },
          { "index": 3, "push": "G4", "pull": "A4" },
          { "index": 4, "push": "C5", "pull": "B4" },
          { "index": 5, "push": "E5", "pull": "D5" }
        ] },
        { "offsetY": 1, "buttons": [
          { "index": 1, "push": "G3", "pull": "A3" },
          { "index": 2, "push": "B3", "pull": "C4" },
          { "index": 3, "push": "D4", "pull": "E4" },
          { "index": 4, "push": "G4", "pull": "F#4" },
          { "index": 5, "push": "B4", "pull": "A4" }
        ] }
      ]
    }
  ]
}
```

- Exactly 2 or 3 rows, each with 5–14 buttons; different row lengths are allowed.
- Rows are ordered right to left; buttons bottom to top, with consecutive
  indices starting at 1. Tables display that order spatially in reverse, so the
  top button appears at the top of the table.
- `offsetY` is an integer from −3 to +3, in half-button units. Positive values
  move a row upward. This is the same coordinate convention as built-in layouts.
- Names are trimmed, nonempty, at most 100 characters. IDs start with `custom-`
  followed by 1–100 ASCII letters, digits or hyphens. Duplicate IDs within a
  file are rejected.
- Notes may be empty (unknown). English/French names and Unicode accidentals
  are accepted on entry/import, then normalized to ASCII letter names, with
  zero, one or two sharps/flats and an optional octave from 0 to 8. Enharmonic
  spelling is preserved. Octaves are stored but the shared renderer displays
  pitch classes, as it does for built-in layouts.
- Imports/exports are limited to 256 KiB. An import must contain at least one
  keyboard. Validation rejects the entire file on any invalid record, format,
  or version. Only whitelisted fields are retained.

Import previews require confirmation before writing. Free IDs are preserved
so separately imported songs can refer to the same keyboard. ID collisions
create fresh IDs; name collisions receive numbered suffixes. Imports never
replace local layouts. Import keyboard files before song files on a new device.
If a song's ID does not match an available layout, the existing song import UI
requires an explicit replacement. Song files do not embed keyboard definitions.

## Persistence and editing

Local storage key `akm-custom-keyboards` uses `{ version: 1, keyboards: [...] }`,
without the portable format marker. Loading never writes. Unreadable data is
preserved and writes are disabled for that session. Failed writes leave the
saved catalog intact and retain the editor draft for retry or JSON export;
unsaved keyboards cannot be selected by songs or the explorer.

Editing a saved keyboard preserves its ID and updates all views referring to
it. The editor remains mounted across view changes so drafts are not discarded.
Switching drafts, cancelling changes, or removing nonempty buttons/rows asks
for confirmation; a dirty draft also registers a browser unload warning.
There is no deletion UI, account, server, or cross-tab synchronization.

Tests cover layout validation, JSON round trips, ID collisions, storage errors,
custom song references, editor navigation, and selection restoration. Browser
checks should also cover responsive layout and real JSON/PDF downloads.
