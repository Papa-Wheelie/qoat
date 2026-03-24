# Design System Strategy: Editorial Purity

## 1. Overview & Creative North Star
**The Creative North Star: "The Curated Canvas"**
This design system moves beyond functional utility into the realm of editorial excellence. It treats the interface not as a software application, but as a high-end digital gallery. We reject the "template" look characterized by rigid grids and heavy borders. Instead, we embrace **intentional asymmetry**, extreme whitespace, and a high-contrast typographic scale that guides the user’s eye with authority.

By leveraging the "Apple-like" breathing room, the system creates a sense of luxury and calm. The visual signature is defined by large, bold headings that command attention, punctuated by soft, pastel accents that feel light and intentional. This is a system built on the philosophy that "Quality" is felt through what is omitted as much as what is included.

---

## 2. Colors
Our palette is rooted in a "near-white" foundation to provide a warm, premium feel that pure #FFFFFF often lacks.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section should sit directly against a `surface` background to create a logical break. Use vertical whitespace (referencing the Spacing Scale) as your primary separator.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper. 
- **Base Layer:** `surface` (#f9f9f7) 
- **Secondary Tier:** `surface-container-low` (#f4f4f2) for large content areas.
- **Elevation Tier:** `surface-container-lowest` (#ffffff) for floating cards and high-priority interactive elements.

### The "Glass & Soul" Principle
To prevent the UI from feeling "flat" or "stock," use **Glassmorphism** for floating headers or navigation bars. Apply a `backdrop-blur` of 20px to semi-transparent surface colors. For primary CTAs, introduce a subtle tonal gradient from `primary` (#000000) to `primary-container` (#3c3b3b) at a 135-degree angle; this adds "visual soul" and a sense of depth that a flat hex code cannot achieve.

---

## 3. Typography
We use **Plus Jakarta Sans** across the board to maintain a modern, geometric, yet approachable voice.

- **Display Scales (Display-LG to Display-SM):** Used for "Hero" moments. Use `-0.02em` letter spacing to increase the sense of high-end editorial density.
- **Headlines (Headline-LG to Headline-SM):** Set in #111111 with a bold weight. These are the anchors of your layout.
- **Body (Body-LG to Body-MD):** Use #111111 for primary reading and #888888 (on-surface-variant) for supporting descriptions. 
- **Label (Label-MD to Label-SM):** Always uppercase with `+0.05em` letter spacing when used for metadata to create a "caption" feel.

---

## 4. Elevation & Depth
In this system, depth is a matter of **Tonal Layering**, not structural shadows.

- **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background. This creates a natural, soft lift that feels "built-in" rather than "pasted on."
- **Ambient Shadows:** Shadows are reserved only for elements that truly "hover" (like Tooltips or floating FABs). Use an extra-diffused blur (24px - 40px) with a very low opacity (4%-6%). The shadow color must be a tint of `on-surface` (#1a1c1b), never pure black.
- **The Ghost Border:** If accessibility requires a container edge, use the `outline-variant` token at **15% opacity**. This creates a "Ghost Border" that defines space without adding visual noise.

---

## 5. Components

### Buttons
- **Primary:** Background: `primary` (#000000), Text: `on-primary` (#ffffff), Radius: `xl` (1.5rem / 24px) for a pill-shape or `12px` per request. 
- **Secondary:** Background: `secondary-container`, Text: `on-secondary-container`. Use for secondary actions that require an accent pop.
- **Tertiary:** No background. Text: `primary`. Use for low-emphasis actions like "Cancel."

### Input Fields
- **Container:** `surface-container-lowest` (#ffffff).
- **Border:** `outline-variant` (#EBEBEB), Radius: `12px`.
- **Padding:** `4` (1.4rem) on all sides to ensure the input feels airy and premium.
- **State:** On focus, transition the border to `primary` (#000000) with a 2px stroke.

### Selection Chips
- Use `secondary-fixed` (#7fd6c2) for Mint, `tertiary-container` (#a3607a) for Pink, and custom Sky Blue.
- **Interaction:** Chips should "grow" slightly (scale 1.05) on hover to provide tactile feedback without needing a heavy shadow.

### Cards & Lists
- **Rule:** Absolute prohibition of divider lines. 
- Use the `10` or `12` spacing tokens to separate list items.
- For cards, use `surface-container-highest` for a "pressed" state or `surface-container-lowest` for a "raised" state.

---

## 6. Do's and Don'ts

### Do
- **Embrace Asymmetry:** Offset a headline to the left while keeping the body text centered to create a dynamic, editorial feel.
- **Use "Mega-Margins":** Don't be afraid of the `16` (5.5rem) or `20` (7rem) spacing tokens for top/bottom padding in hero sections.
- **Tint your Grays:** Ensure your supporting text (#888888) is slightly warm to match the #F7F7F5 background.

### Don't
- **Don't use 100% Black for everything:** Use #111111 for headings to avoid "optical vibration" against the off-white background.
- **Don't use 1px dividers:** If you feel the need for a line, use a 4px `surface-container-highest` bar instead, or simply increase the whitespace.
- **Don't crowd the corners:** With a 12px/24px radius, ensure inner content has at least 24px of padding so the content doesn't "choke" at the curves.