# Tests Frontend - Guide Complet

## 🚀 Lancer les Tests

```bash
npm test                # Tous les tests
npm run test:watch      # Mode watch
npm run test:ui         # Interface UI
npm run test:coverage   # Couverture
```

## 📁 Organisation des Tests

Tous les tests sont organisés par type :

### Tests d'Intégration
📂 `src/__tests__/integration/`
- `auth-flow.test.tsx` - Flux d'authentification
- `dashboard.test.tsx` - Dashboard (à créer)
- `team-management.test.tsx` - Gestion d'équipe (à créer)

### Tests Unitaires des Pages
📂 `src/pages/`
- `AccountPage.test.tsx`
- `ClockPage.test.tsx`
- `DashboardPage.test.tsx`
- `Login.test.tsx`
- `MemberDetailsPage.test.tsx`
- `TeamManagePage.test.tsx`

### Tests Unitaires des Composants
📂 `src/components/`
- `Layout.test.tsx`

### Tests Unitaires des Utilitaires
📂 `src/utils/`
- `api.test.ts` - Fonctions d'appel API

### Test Principal
📂 `src/`
- `App.test.tsx`

## 🛠️ Helpers de Test

📂 `src/__tests__/helpers/`
- `renderWithProviders.tsx` - Render avec AuthProvider et Router
- `mockData.ts` - Données mockées réutilisables

### Utilisation

```tsx
import { renderWithProviders } from '@/__tests__/helpers/renderWithProviders'
import { mockUser, mockTeam } from '@/__tests__/helpers/mockData'

// Render avec providers
renderWithProviders(<MyComponent />)

// Utiliser les mocks
vi.mocked(api.getSession).mockResolvedValue(mockUser)
```

## 📝 Écrire un Test

```tsx
import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/helpers/renderWithProviders'

describe('MonComposant', () => {
  it('devrait afficher le contenu', async () => {
    renderWithProviders(<MonComposant />)
    
    await waitFor(() => {
      expect(screen.getByText('Contenu')).toBeInTheDocument()
    })
  })
})
```

## ⚠️ Bonnes Pratiques

### 1. Toujours utiliser renderWithProviders
```tsx
// ✅ Correct
renderWithProviders(<Component />)

// ❌ Incorrect (erreur useNavigate)
render(<Component />)
```

### 2. Textes fragmentés
```tsx
// ✅ Pour textes fragmentés
const elements = screen.queryAllByText(/texte/i)
expect(elements.length).toBeGreaterThan(0)
```

### 3. Opérations asynchrones
```tsx
// ✅ Toujours utiliser waitFor
await waitFor(() => {
  expect(screen.getByText('Chargé')).toBeInTheDocument()
}, { timeout: 5000 })
```

## 📊 État Actuel

**Objectif : 95%+ de réussite**

Les tests sont configurés pour valider :
- Authentification et autorisation
- Navigation et routing
- Formulaires et validation
- Appels API et gestion d'erreurs
- Affichage conditionnel selon les rôles

## 🐛 Debugging

### Mode UI (Recommandé)
```bash
npm run test:ui
```
Interface graphique interactive pour explorer les tests.

### Logs
Les `console.log` sont visibles dans la sortie des tests.

## 📈 Couverture de Code

Objectifs :
- Statements: > 80%
- Branches: > 75%  
- Functions: > 80%
- Lines: > 80%

Fichiers exclus de la couverture :
- `node_modules/`
- `src/test/`
- `**/*.config.*`
- `**/*.d.ts`
