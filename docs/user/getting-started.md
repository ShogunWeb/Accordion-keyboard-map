# Getting Started

This guide helps new users understand how to use the Accordion Keyboard Visualizer.

## What the App Does

The application allows you to:

- View different accordion right-hand keyboard layouts  
- Highlight notes that belong to a chosen **chord** or **scale**  
- See where each note appears in **push** or **pull** direction  
- Compare keyboards and learn musical structures visually


## Opening the Application

### Web deployment

If you are using a hosted version (e.g., GitHub Pages or OVH):

1. Open the URL of the application in your browser  
2. No installation is required  
3. It works on desktop, tablet, and mobile

### Local development

If you run it locally:

```bash
npm install
npm run dev
```

Then open the URL printed in the terminal (usually `http://localhost:5173`).


## Using a small screen

On a phone, the keyboard fills the available height automatically. A compact
column beside it contains the controls:

- **Menu**: open Keyboard, My songs, My keyboards or Settings.
- **Current chord/scale**: choose Chord or Scale, its root and type, then tap
  **Done**. Highlights update immediately while choosing.
- **+ / −**: enlarge the keyboard to read the notes, then scroll inside the drawing.
- **Fit to screen**: return to the complete keyboard and reset its scroll position.
- **⋯ (More actions)**: add the chord to a song, show/hide the legend, or download
  the complete chord reference PDF.

The fitted drawing follows changes in available height, including browser bars
and device rotation. It starts fitted when opening a keyboard; desktop zoom is
kept separately. Larger zoom makes the notes easier to read, with scrolling inside
the keyboard. Settings and selection panels close with their close button, by
tapping outside, or with Escape when using a physical keyboard.

## Choosing a Keyboard Layout

1. Open **Settings** (through **Menu** on a phone) and use the **Keyboard** selector
2. Choose a built-in or saved custom right-hand layout
3. The keyboard display updates immediately  

Each button displays:

- **Left half** → push note  
- **Right half** → pull note  
- **Number** → button index (starting from the bottom)


## Highlighting a Chord or a Scale

1. Select **Mode**:
   - `Chord`
   - `Scale`
2. Select:
   - **Root note** (C, D, E, F#, …)
   - **Type** (maj, min, 7, major, dorian, …)
3. The highlights update automatically.

Highlighted notes:

- **Blue** → push note  
- **Orange** → pull note  


## Understanding Push / Pull

On a button accordion, the note often changes depending on bellows direction:

- **Push** (bellows closing) = left half of each button  
- **Pull** (bellows opening) = right half  

The legend below the keyboard explains the color scheme (normal vs highlighted state).



## Resetting Highlights

To change or reset highlights:

- Select another chord or scale; highlights update automatically.
- Your last selection is restored when you reload the page.


## Creating your own keyboard

Open **My keyboards** (**Mes claviers** in French), then choose **Blank keyboard**
or select a starting layout and **Create a copy**. Built-in models stay unchanged.

1. Name the keyboard and choose **2 or 3 rows**.
2. Choose **5 to 14 buttons per row** and adjust each row's vertical offset in
   half-button units, from −3 to +3. A positive offset moves the row up.
3. Enter each button's **Push** and **Pull** notes. English (`C`, `F#4`, `Bb3`)
   and French (`Do`, `Fa#4`, `Sib3`) input are accepted. Octave 0–8 is optional;
   leave a note blank if unknown. Invalid notes are marked in red.
4. Check the live preview. Row 1 is on the right; button 1 is at the bottom.
5. Choose **Save keyboard**, then **Use this keyboard** to explore its chords
   and scales. It is also available in song selectors and PDF exports.

On a phone, the editor shows one row at a time: choose **Row 1**, **Row 2** or
**Row 3**. Other rows retain their notes. **Show preview** reveals the complete
keyboard; **Save keyboard** remains available at the bottom. When a draft is
open, **Choose or import a keyboard** expands the library controls.

To edit it later, choose it under **Edit a saved keyboard**. Saving also updates
existing songs using that layout. Drafts survive switching views, but are not
saved when closing the app. Removing buttons containing notes asks for confirmation.

Use **Export this keyboard** for the current draft or **Export all keyboards**
for the saved custom library. **Import keyboards** previews the JSON file before
**Add these keyboards** saves it. Existing layouts are kept; collisions create
copies. Files are limited to 256 KB.

Keyboards and songs have separate JSON exports. On another device, import the
keyboard file first, then the song file. If a song refers to an unavailable ID,
choose its replacement in the song import preview. Keep both exports as backups:
clearing browser data removes the saved library. A storage error keeps the draft
available for export or another save attempt.

## Downloading a complete chord reference

In the **Keyboard** view, select your keyboard and note notation in **Settings**,
then use **Download chord reference (PDF)** below the keyboard on desktop,
or inside **⋯ (More actions)** on a phone.

The download contains **12 A4 landscape pages**, one per chromatic root, with
**four complete keyboards per page**: major, minor, dominant 7th and minor 7th.
Each keyboard highlights all matching push/pull notes, just like the explorer.
The reference includes C, Db, D, Eb, E, F, F#, G, Ab, A, Bb and B (or their French
names); equivalent sharp/flat roots are not repeated. Highlighted notes show
available positions, not a prescribed fingering or a guarantee that the whole
chord is playable in one bellows direction.

The PDF uses the selected keyboard model, interface language and note notation.
This action does not create songs or change your library. Wide layouts are
scaled to keep the four variants together. The PDF exporter loads on first use;
if a download fails, reconnect and try again.

## Backing up and sharing songs

In **My songs**, use **Export this song** to download the selected song, or
**Export all songs** to back up your library. The `.akm.json` file contains the
song titles, ordered unique chords and associated keyboard models. It can be
opened again for editing; **Download PDF** produces the separate printable sheet.

To restore or transfer songs:

1. Choose **Import songs** and select an exported `.akm.json` file.
2. Review the songs in the preview. If a keyboard is unavailable, choose its
   replacement; the app will recalculate the chord positions on that keyboard.
3. Choose **Add these songs**. Existing songs are kept. Matching titles receive
   a numbered suffix, so importing a file again creates additional copies.

Songs stay in the browser's local storage. Keep the exported file to move them
to another device or restore them after clearing site data. There is no automatic
synchronization, and the file does not include custom keyboard definitions or
chosen fingerings. Importing does not change your display preferences.

Files are limited to 2 MB. Invalid or unsupported files are rejected before any
songs are added. If the browser cannot save imported changes, a warning appears;
export those songs before closing the page.

## Tips for Practice

- Use scale mode to explore where the notes of a key live on your keyboard  
- Use chord mode to identify good fingerings and voicings  
- Compare layouts if you play multiple instruments or tunings  



## Contribution Ideas (No Coding Required)

You don’t need to be a developer to help improve this project!
Here are several valuable ways you can contribute:

* **Report bugs**
  If something looks wrong, behaves strangely, or doesn’t load as expected, open an issue describing what happened.

* **Suggest new features**
  If you have ideas for new display modes, presets, button layouts, or customization options, feel free to propose them.

* **Improve documentation**
  Help refine the explanations, clarify the user guide, or suggest topics that should be documented.

* **Test the app on different devices**
  Mobile, tablet, different browsers, different screen sizes — your feedback helps improve usability.

* **Provide keyboard presets**
  If you play a specific accordion model, you can contribute its keyboard layout (notes per row and push/pull values).

* **Suggest UI or UX improvements**
  Tell us what feels intuitive, confusing, too small, too hidden, etc.

* **Share musical knowledge**
  Ideas for useful chord sets, scale lists, learning tips, or visualization approaches are all welcome.

* **Spread the word**
  If the tool helps you, feel free to share it with musicians, accordion communities, or teachers.


