# Context and Instructions for Claude: kanishkez.github.io Notes Project

Hello Claude! You are pair programming with kanishk to help him manage, write, and improve his personal website and ML/AI study notes. Here is the complete context of the website, its architectural structure, design preferences, and rules to keep in mind.

---

## 1. Project Overview
The project is a personal portfolio website located at `https://kanishkez.github.io/`.
It contains:
* A main single-page portfolio (`index.html`) with Home, Projects, Blogs, and Notes navigation.
* A dynamically populated **Notes** listing on the landing page, built from compiled data.
* A compiled static **Notes** section containing study notes on Machine Learning, Deep Learning, Reinforcement Learning, RAG, and Transformers.

---

## 2. Technology Stack & Build Pipeline
* **Frontend**: Pure vanilla HTML5, CSS3, and Javascript (no React/Next.js/Tailwind).
* **Code & Math Styling**: KaTeX is used for ultra-fast, premium mathematical rendering. Math is defined in the source markdown with standard `$` (inline) and `$$` (display) blocks.
* **Build System**: A Node.js compiler (`build-notes.js`) parses Obsidian `.md` notes from an external iCloud vault (`/Users/kanishkk/Library/Mobile Documents/com~apple~CloudDocs/notes`) and converts them into static HTML files inside the `notes/` directory.
* **Data File**: The build script auto-generates `notes/notes-data.js` containing metadata (titles, slugs, descriptions) for all active notes, grouped by category.

---

## 3. Design Aesthetics & Colors (Mint Green Theme)
The site uses a premium, clean, scientific paper aesthetic with a soft mint green palette:
* **Background Color**: `#e6f4ed` (solid premium mint green, no grid patterns or dot background images on the body).
* **Cards & Containers (`--tile`)**: `#ffffff` (pure white, with a subtle border and very soft shadow).
* **Text / Ink Color (`--ink`)**: `#11281e` (a highly readable, deep forest green/charcoal color).
* **Muted Text (`--dim`)**: `#4c685b` (slate/sage gray for sub-elements and tags).
* **Accent Color (`--acc`)**: `#288258` (vibrant forest mint green for links, active tabs, buttons).
* **Accent Hover (`--acc-deep`)**: `#165636` (deep green for hovered states).
* **Accent Soft (`--acc-soft`)**: `#d3f0e2` (light mint background for tags and highlights).

---

## 4. Notes Section Navigation & Reading Layout
* **Accordion Toggles**: On the landing page (`index.html#notes`), notes are categorized. Clicking a category header expands a smooth accordion card to reveal the list of notes within it.
* **Centered Reading Layout**: Note pages are centered, single-column, with a maximum width of `1000px` (`.note-page`). The content flows vertically like a premium technical blog (similar to Distill.pub).
* **TOC (Table of Contents)**: Table of Contents is positioned at the top of each note page (below the header) and laid out as a responsive CSS grid on desktop screens to utilize space effectively.

---

## 5. Critical Rules & Constraints

### ⚠️ Rule 1: ABSOLUTELY NO HYPHENS (`-`) in Prose or Headings
* **Do not use hyphens** in note titles, category names, descriptions, heading text, or prose (introductions and conclusions).
* **Instead of hyphens**: Use space-separated words or single joined words (e.g. use "post training" instead of "post-training", "fine tuning" instead of "fine-tuning", "state of the art" instead of "state-of-the-art", "nonlinear" instead of "non-linear").
* **Exception**: Hyphens are allowed in code blocks (e.g. Python variable names/operators), math equations (e.g. $t - 1$ as a subtraction sign, with space pads), and URLs.

### ⚠️ Rule 2: NO EMOJIS
* **Strip all emojis** completely from note text. Notes should have a clean, casual student tone but remain mathematically and technically precise.

### ⚠️ Rule 3: Math and Image Formatting
* All mathematical variables (like $W_{hh}$, $h^{(t-1)}$, $x^{(t)}$, $\lambda$) must be wrapped in `$` so they render correctly as KaTeX math.
* Obsidian wiki-style image embeds (`![[filename.png]]`) are automatically converted by `build-notes.js` into HTML figures pointing to the local `images/` directory with URL-encoded names.

---

## 6. How to Help Kanishk
When Kanishk asks you to edit the site or write new notes:
1. **Maintain Color Scheme**: Keep the CSS variables set to the mint green theme.
2. **Review Hyphens/Emojis**: Double check that any text you generate or modify conforms strictly to the **no-hyphen** and **no-emoji** rules.
3. **LaTeX Math Accuracy**: Ensure mathematical derivations and variables are 100% correct and wrapped in `$`.
4. **Run Compiler**: Remind kanishk to run `node build-notes.js` inside the website directory whenever notes are added or updated to compile them.
