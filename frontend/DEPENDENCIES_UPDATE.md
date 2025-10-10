# Frontend dependencies update (Vite 7 + Tailwind plugin 4.1)

- Updated `vite` to `^7.1.9`
- Updated `@tailwindcss/vite` to `^4.1.14` (supports Vite 7)
- Updated `@vitejs/plugin-react` to `^5.0.3`
- Bumped `tailwindcss` to `^4.1.0`

> Important: run `npm install` locally to regenerate `package-lock.json`, commit it, then `docker build` will succeed with the existing Dockerfile (which runs `npm ci`).

- Added runtime deps: `react-router-dom@^6` and `recharts@^2` (required by src/main.jsx and ChartCard.jsx)

- Fixed `src/components/ChartCard.jsx`: removed duplicate JSX attributes and simplified Recharts markup.

- Pinned versions: react-router-dom@6.26.x, recharts@2.12.x; set packageManager to npm@11.6.2.

- Added `scripts/ensure-deps.cjs` and a `prebuild` hook to auto-install `react-router-dom` and `recharts` if missing during Docker build.
