## Font Stack Update

- Unified every page and shared component to use the custom Arima Madurai stack:
  `'Arima Madurai', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif`.
- Defined the stack once in `assets/global-fonts.css` via CSS variables:
  - `--font-base` for all body text and UI elements.
  - `--font-display` (alias of `--font-base`) for headings.
  - `--font-mono` reserved for code snippets.
- Registered Arima Madurai in `assets/global-fonts.css` so the font is always served from `assets/arima-madurai.medium.ttf` with browser fallbacks.
- Replaced hard-coded font declarations across component and page styles with `var(--font-base)` or `var(--font-display)`, ensuring consistency in:
  - `components/buttons.css`, `header.css`, `footer.css`, `cards.css`
  - Core pages under `pages/` and the landing page in `homepage/index.html`
  - Legacy samples such as `pages/simulation/test_fbp.html`
- Updated the root `index.html` loader page to rely on the same stack.

**Result:** All text now renders with a single, readable sans-serif family across navigation, buttons, headings, and content, eliminating the font mismatches seen during page transitions.
