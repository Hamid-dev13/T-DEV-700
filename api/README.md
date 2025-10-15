# API Tests

## 🧪 Suite de tests complète avec Jest

Cette API dispose d'une suite de tests complète avec une couverture de code >99%.

### Structure des tests

```
__tests__/
├── controllers/      # Tests des contrôleurs HTTP
├── services/         # Tests de la logique métier
├── middlewares/      # Tests des middlewares Express
├── utils/            # Tests des fonctions utilitaires
├── index.test.ts     # Tests du serveur principal
└── setup.ts          # Configuration globale des tests
```

## 📋 Commandes disponibles

### Lancer tous les tests
```bash
npm test
```

### Lancer les tests avec couverture de code
```bash
npm run test:coverage
```

### Lancer les tests en mode watch (redémarrage automatique)
```bash
npm run test:watch
```

### Lancer les tests en mode verbose (sortie détaillée)
```bash
npm run test:verbose
```

### Lancer les tests pour CI/CD
```bash
npm run test:ci
```

## 📊 Couverture de code

La configuration Jest exige les seuils de couverture suivants:

- **Statements**: 99%
- **Branches**: 90%
- **Functions**: 100%
- **Lines**: 100%

### Rapport de couverture

Après avoir lancé `npm run test:coverage`, vous trouverez:

- **Terminal**: Résumé de la couverture
- **HTML**: `coverage/index.html` - Rapport détaillé navigable
- **LCOV**: `coverage/lcov.info` - Pour intégration CI/CD
- **JSON**: `coverage/coverage-summary.json` - Données de couverture

## 🎯 Ce qui est testé

### Controllers (100% couverture)
- ✅ Validation des entrées
- ✅ Gestion des erreurs
- ✅ Retours HTTP corrects
- ✅ Authentification et autorisation

### Services (100% couverture)
- ✅ Logique métier
- ✅ Interactions avec la base de données (mockées)
- ✅ Validation des données
- ✅ Gestion des erreurs

### Middlewares (100% couverture)
- ✅ Authentification JWT
- ✅ Vérification des droits admin
- ✅ Gestion des tokens (headers et cookies)

### Utils (100% couverture)
- ✅ Hachage et vérification de mots de passe
- ✅ Extraction de cookies
- ✅ Calculs de dates et périodes

## 🔧 Configuration

### jest.config.js

La configuration Jest inclut:
- TypeScript support avec `ts-jest`
- Mocks automatiques
- Timeout de 10 secondes par test
- Exclusions: `index.ts`, `routes/`, `models/`, `types/`

### Fichiers exclus de la couverture

Les fichiers suivants sont exclus car ce sont des définitions de schéma ou points d'entrée:
- `index.ts` - Point d'entrée du serveur
- `routes/**` - Définitions de routes (testées via integration)
- `models/**` - Schémas Drizzle ORM
- `types/**` - Définitions de types TypeScript

## 🚀 Intégration CI/CD

Pour intégrer les tests dans votre pipeline CI/CD, utilisez:

```bash
npm run test:ci
```

Cette commande:
- Lance les tests en mode CI
- Génère les rapports de couverture
- Limite les workers pour les environnements CI
- Sort avec un code d'erreur si les tests échouent

## ✨ Bonnes pratiques

1. **Lancez les tests avant chaque commit**
   ```bash
   npm test
   ```

2. **Vérifiez la couverture régulièrement**
   ```bash
   npm run test:coverage
   ```

3. **Utilisez le mode watch pendant le développement**
   ```bash
   npm run test:watch
   ```

4. **Tous les tests doivent passer avant un merge**

## 📝 Ajouter de nouveaux tests

1. Créez un fichier `*.test.ts` dans `__tests__/`
2. Suivez la structure existante
3. Mockez les dépendances externes (DB, services externes)
4. Testez les cas nominaux ET les cas d'erreur
5. Vérifiez que la couverture reste >99%

## 🐛 Débogage

Pour déboguer un test spécifique:

```bash
npm test -- __tests__/path/to/your.test.ts --verbose
```

Pour voir plus de détails:

```bash
npm run test:verbose
```