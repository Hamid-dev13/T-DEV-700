# Tailwind v4.0.0 + Vite setup (React)

This project has been normalized to run with:
- React 18.3.1
- React DOM 18.3.1
- Vite 5.4.11
- @vitejs/plugin-react 4.3.4
- tailwindcss 4.0.0
- @tailwindcss/vite 4.0.0

### Key changes
- Replaced old Tailwind `@tailwind base/components/utilities` with a single `@import "tailwindcss";` in your main CSS.
- Added `@tailwindcss/vite` to `vite.config` and enabled it.
- Removed `postcss.config.*` (not needed).
- If a `tailwind.config.*` was present and contained more than just `content`, it was renamed to `tailwind.config.*.migrated` for reference.
- `package.json` is pinned to exact versions and includes Node engine `>=18`.

### Dev commands
```bash
npm ci            # or npm install
npm run dev       # start dev
npm run build     # build for production
npm run preview   # preview build
```
