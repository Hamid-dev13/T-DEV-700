# Frontend Auth/Pointage — Dark+Yellow (React + Vite + Tailwind v4)

Correctif build Tailwind v4 : plus de `@apply` de classes custom à l'intérieur d'autres classes.
Utilise uniquement des utilitaires Tailwind dans `@apply`.

## Usage
npm i
npm run dev
npm run build

## 🔑 Login email/mot de passe + Backend

- Écran **Login** ajouté (`src/pages/Login.jsx`) avec champs **email** et **password**.
- Le front bascule automatiquement :
  - **Sans backend** (pas de `VITE_API_BASE_URL`) → données locales (seed), démo immédiate.
  - **Avec backend** (`VITE_API_BASE_URL=https://api.example.com`) → appels `fetch` via `src/utils/apiClient.js`.
- Les contextes `AuthContext` et `DataContext` utilisent désormais `src/utils/api.js` qui route vers **l’API réelle** ou la **fake API** selon la config.
