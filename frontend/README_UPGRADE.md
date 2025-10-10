# Migration to Tailwind CSS v4.1 (Vite + React)

This project was migrated from Tailwind v3 to **Tailwind v4.1** using the official guidance.

## What changed

- **Dependencies**
  - Added `tailwindcss@^4.1` and `@tailwindcss/vite@^4.1` (Vite plugin).
  - Removed `autoprefixer` and `postcss` dev dependencies — v4 handles this internally when using the Vite plugin.

- **Build config**
  - Updated `vite.config.js` to include the Tailwind Vite plugin: `tailwindcss()`.

- **CSS setup**
  - Replaced `@tailwind base/components/utilities` with a single:
    ```css
    @import "tailwindcss";
    ```
  - Added an `@theme` block in `src/index.css` to define your custom tokens:
    colors (`--color-ink`, `--color-sea`, ...),
    a custom shadow (`--shadow-glow`), and a custom radius override (`--radius-2xl`).

- **Removed files**
  - `tailwind.config.cjs` and `postcss.config.js` are no longer needed in v4 (CSS-first config).

## After pulling the changes

1. Install deps:
   ```bash
   npm install
   ```
2. Start dev:
   ```bash
   npm run dev
   ```

If you later need PostCSS (e.g., with frameworks that require it), use `@tailwindcss/postcss` and follow the v4 docs.