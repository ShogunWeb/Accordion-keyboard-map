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


## Choosing a Keyboard Layout

1. Use the **Keyboard** selector at the top  
2. Choose one of the built‑in right‑hand layouts  
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
3. Click **Apply**

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

- Select another chord/scale and click **Apply**, or  
- Reload the page to clear all selections.


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


