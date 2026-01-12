# Time Manager

Application complète de gestion du temps et des effectifs construite avec des technologies web modernes. Ce projet permet aux organisations de suivre les heures de travail des employés, gérer les équipes, générer des rapports de performance et traiter les demandes de congés de manière efficace.

**Repository:** [https://github.com/Hamid-dev13/T-DEV-700](https://github.com/Hamid-dev13/T-DEV-700)

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Stack technologique](#stack-technologique)
- [Fonctionnalités principales](#fonctionnalités-principales)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Développement](#développement)
- [Tests](#tests)
- [Déploiement en production](#déploiement-en-production)
- [Documentation API](#documentation-api)
- [Schéma de base de données](#schéma-de-base-de-données)
- [Pipeline CI/CD](#pipeline-cicd)
- [Structure du projet](#structure-du-projet)
- [Variables d'environnement](#variables-denvironnement)

## Vue d'ensemble

Time Manager est une application monorepo qui fournit une solution complète pour le suivi du temps et la gestion des effectifs. Elle se compose de trois services principaux :

- **API (Backend)**: API RESTful construite avec Express.js et TypeScript
- **Frontend**: Application React destinée aux employés
- **Admin**: Tableau de bord administratif pour les managers et les RH

L'application prend en charge plusieurs rôles utilisateurs (admin, manager, employé), la gestion d'équipes, le pointage en temps réel, les rapports KPI, la gestion des congés et le déploiement automatisé via GitHub Actions.

## Architecture

### Architecture système

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│   Frontend      │────────▶│   Backend API   │────────▶│   PostgreSQL    │
│   (React)       │         │   (Express.js)  │         │   (Supabase)    │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                           │
        │                           │
        ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │
│   Admin Panel   │         │   Service SMTP  │
│   (React)       │         │   (Nodemailer)  │
│                 │         │                 │
└─────────────────┘         └─────────────────┘
```

### Flux applicatif

1. **Authentification**: Authentification basée sur JWT avec tokens d'accès et de rafraîchissement
2. **Autorisation**: Contrôle d'accès basé sur les rôles (Admin, Manager, Utilisateur)
3. **Suivi du temps**: Fonctionnalité de pointage entrée/sortie avec support des fuseaux horaires (Paris)
4. **Rapports**: Calculs KPI incluant les retards, présence, temps de pause et départs anticipés
5. **Gestion d'équipe**: Structure d'équipe hiérarchique avec permissions des managers
6. **Gestion des congés**: Workflow de soumission et d'approbation des demandes de congés

## Stack technologique

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js 5
- **Langage**: TypeScript 5
- **Base de données**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **Authentification**: JWT (jsonwebtoken)
- **Email**: Nodemailer
- **Documentation API**: Swagger/OpenAPI
- **Logging**: Winston + express-winston
- **Tests**: Jest + Supertest (>99% de couverture)

### Frontend
- **Framework**: React 18/19
- **Build Tool**: Vite 5/7
- **Routing**: React Router v7
- **Styling**: Tailwind CSS 4
- **Icônes**: Lucide React
- **Tests**: Vitest + React Testing Library (minimum 40% de couverture)

### DevOps
- **Conteneurisation**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Registry d'images**: Docker Hub
- **Déploiement**: VPS avec déploiement automatisé
- **Reverse Proxy**: Configuré pour le déploiement en production

## Fonctionnalités principales

### Gestion des utilisateurs
- Inscription et authentification des utilisateurs
- Contrôle d'accès basé sur les rôles (Admin, Manager, Employé)
- Gestion de profil
- Fonctionnalité de réinitialisation de mot de passe avec vérification email

### Suivi du temps
- Fonctionnalité de pointage entrée/sortie
- Gestion automatique des fuseaux horaires (fuseau horaire de Paris)
- Visualisation de l'historique des pointages
- Modification des entrées de pointage avec approbation du manager

### Gestion d'équipe
- Créer et gérer des équipes
- Assigner des managers aux équipes
- Ajouter/retirer des membres d'équipe
- Configuration des heures de travail de l'équipe (heures de début/fin)
- Permissions des managers pour l'accès aux données des membres de l'équipe

### Rapports et analyses
- Calculs KPI :
  - **Retard**: Temps d'arrivée après l'heure prévue
  - **Présence**: Temps total au travail
  - **Temps de pause**: Pauses prises pendant les heures de travail
  - **Départ anticipé**: Temps de départ avant l'heure prévue
- Plages de dates personnalisables
- Rapports d'équipe et individuels
- Capacités d'export

### Gestion des congés
- Soumission de demande de période de congé
- Workflow d'approbation Manager/Admin
- Filtrage des périodes de congé dans les rapports
- Exclusion automatique des entrées de pointage pendant les congés approuvés

### Fonctionnalités administratives
- Opérations CRUD sur les utilisateurs
- Opérations CRUD sur les équipes
- Rapports et analyses globaux
- Surveillance de l'état du système
- Gestion des jours fériés

## Prérequis

- **Node.js**: 20.x ou supérieur
- **npm**: 9.x ou supérieur
- **Docker**: 20.x ou supérieur
- **Docker Compose**: 2.x ou supérieur
- **PostgreSQL**: 14+ (ou compte Supabase)
- **Git**: 2.x ou supérieur

## Installation

### 1. Cloner le repository

```bash
git clone https://github.com/Hamid-dev13/T-DEV-700.git
cd T-DEV-700
```

### 2. Configuration de l'environnement

Créer un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

Éditer `.env` avec votre configuration :

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://username:password@host:port/database
ACCESS_TOKEN_SECRET='votre_secret_access_token'
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET='votre_secret_refresh_token'
REFRESH_TOKEN_EXPIRES_IN=7d

PASSWORD_RESET_TOKEN_EXPIRATION=30

# Configuration SMTP optionnelle
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USE_SSL=false
SMTP_USERNAME=votre_email@example.com
SMTP_PASSWORD=votre_mot_de_passe
SMTP_FROM=noreply@example.com

# Configuration des ports
FRONTEND_HOST_PORT=3001
FRONTEND_CONTAINER_PORT=5173
BACKEND_HOST_PORT=5001
BACKEND_CONTAINER_PORT=3001
ADMIN_HOST_PORT=3002
ADMIN_CONTAINER_PORT=5173

# URLs API
VITE_API_URL=http://localhost:5001
API_URL=http://localhost:5001

# CORS
WEBSITE_URL=http://localhost:3001
ADMIN_WEBSITE_URL=http://localhost:3002
```

### 3. Configuration de la base de données

Assurez-vous que votre base de données PostgreSQL est en cours d'exécution et accessible. L'application exécutera automatiquement les migrations au démarrage.

## Développement

### Démarrer tous les services

Depuis la racine du projet :

```bash
# Démarrer tous les services en mode développement
npm run dev

# Démarrer avec reconstruction
npm run dev:build

# Voir les logs de tous les services
npm run dev:logs

# Arrêter tous les services
npm run dev:stop
```

Les services seront disponibles à :
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5001
- **Panneau Admin**: http://localhost:3002
- **Documentation API**: http://localhost:5001/api-docs

### Développement de services individuels

#### Backend (API)

```bash
cd api

# Installer les dépendances
npm install

# Démarrer le serveur de développement avec hot-reload
npm run dev

# Compiler TypeScript
npm run build

# Exécuter le build de production
npm run serve

# Générer les migrations Drizzle
npm run db:generate

# Pousser les changements de schéma vers la base de données
npm run db:push
```

#### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Build pour la production
npm run build

# Prévisualiser le build de production
npm run preview
```

#### Admin

```bash
cd admin

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Build pour la production
npm run build

# Prévisualiser le build de production
npm run preview

# Linter la base de code
npm run lint
```

### Migrations de base de données

```bash
# Depuis la racine du projet
npm run db:migrate

# Ou depuis le répertoire api
cd api
npm run db:generate  # Générer les fichiers de migration
npm run db:push      # Appliquer les migrations à la base de données
```

### Nettoyer l'environnement de développement

```bash
# Arrêter les services et supprimer les volumes (ATTENTION : supprime toutes les données)
npm run clean
```

## Tests

### Tests Backend

Le backend dispose d'une couverture de tests complète (>99%) utilisant Jest et Supertest.

```bash
cd api

# Exécuter tous les tests
npm test

# Exécuter les tests avec couverture
npm run test:coverage

# Exécuter les tests en mode watch
npm run test:watch

# Exécuter les tests en mode verbose
npm run test:verbose

# Exécuter les tests pour CI/CD
npm run test:ci
```

**Exigences de couverture :**
- Statements: 99%
- Branches: 90%
- Functions: 100%
- Lines: 100%

**Structure des tests :**
```
api/__tests__/
├── controllers/    # Tests des contrôleurs HTTP
├── services/       # Tests de la logique métier
├── middlewares/    # Tests des middlewares Express
├── utils/          # Tests des fonctions utilitaires
├── index.test.ts   # Tests d'initialisation du serveur
└── setup.ts        # Configuration des tests
```

### Tests Frontend

Le frontend utilise Vitest et React Testing Library avec une exigence de couverture minimale de 40%.

```bash
cd frontend

# Exécuter les tests
npm run test

# Exécuter les tests avec UI
npm run test:ui

# Exécuter les tests avec couverture
npm run test:coverage

# Vérifier le seuil de couverture
npm run test:coverage:check
```

**Fichiers de tests :**
```
frontend/src/__tests__/
├── pages/          # Tests des composants de page
├── utils/          # Tests des fonctions utilitaires
└── setup.ts        # Configuration des tests
```

### Tests Admin

```bash
cd admin

# Exécuter les tests
npm run test

# Exécuter les tests avec UI
npm run test:ui

# Exécuter les tests avec couverture
npm run test:coverage
```

## Déploiement en production

### Build Docker de production

Le projet inclut des configurations Docker prêtes pour la production avec des builds multi-étapes et des health checks.

```bash
# Builder et démarrer les conteneurs de production
docker-compose -f docker-compose.prod.yml up -d

# Voir les logs
docker-compose -f docker-compose.prod.yml logs -f

# Arrêter les conteneurs
docker-compose -f docker-compose.prod.yml down
```

**Images de production :**
- Backend: `hamidledev/monapp-backend:main`
- Frontend: `hamidledev/monapp-frontend:main`
- Admin: `hamidledev/monapp-admin:main`

### Déploiement manuel

1. Builder les images Docker :
```bash
docker build -t time-manager-backend:latest ./api --target production
docker build -t time-manager-frontend:latest ./frontend --target production --build-arg VITE_API_URL=https://votre-api-url.com
docker build -t time-manager-admin:latest ./admin --target production --build-arg VITE_API_URL=https://votre-api-url.com
```

2. Pousser vers le registry :
```bash
docker tag time-manager-backend:latest votre-registry/time-manager-backend:latest
docker push votre-registry/time-manager-backend:latest
# Répéter pour frontend et admin
```

3. Déployer sur le serveur :
```bash
docker pull votre-registry/time-manager-backend:latest
docker pull votre-registry/time-manager-frontend:latest
docker pull votre-registry/time-manager-admin:latest
docker-compose -f docker-compose.prod.yml up -d
```

## Documentation API

### Swagger/OpenAPI

La documentation API interactive est disponible à `/api-docs` lorsque le backend est en cours d'exécution.

**Accès :** http://localhost:5001/api-docs

### Endpoints principaux

#### Authentification
- `POST /user/login` - Connexion utilisateur
- `POST /user/logout` - Déconnexion utilisateur
- `POST /user/refresh` - Rafraîchir le token d'accès

#### Utilisateurs
- `GET /user` - Obtenir le profil de l'utilisateur actuel
- `GET /users` - Obtenir tous les utilisateurs (admin uniquement)
- `GET /users/:id` - Obtenir un utilisateur par ID
- `POST /users` - Créer un utilisateur (admin uniquement)
- `PUT /user` - Mettre à jour son propre profil
- `PUT /users/:id` - Mettre à jour un utilisateur (admin uniquement)
- `DELETE /user` - Supprimer son propre compte
- `DELETE /users/:id` - Supprimer un utilisateur (admin uniquement)

#### Gestion des pointages
- `GET /clocks` - Obtenir les entrées de pointage
- `GET /clocks/:id` - Obtenir une entrée de pointage par ID
- `POST /clocks` - Pointer l'entrée
- `PUT /clocks/:id` - Mettre à jour une entrée de pointage
- `DELETE /clocks/:id` - Supprimer une entrée de pointage

#### Équipes
- `GET /teams` - Obtenir toutes les équipes
- `GET /teams/:id` - Obtenir une équipe par ID
- `GET /teams/:id/members` - Obtenir les membres de l'équipe
- `POST /teams` - Créer une équipe (admin uniquement)
- `PUT /teams/:id` - Mettre à jour une équipe
- `DELETE /teams/:id` - Supprimer une équipe (admin uniquement)
- `POST /teams/:id/members` - Ajouter un membre à l'équipe
- `DELETE /teams/:id/members/:userId` - Retirer un membre de l'équipe

#### Rapports
- `GET /reports/:type` - Générer un rapport KPI
  - Types : `lateness`, `presence`, `pause_times`, `earlyness`
  - Paramètres de requête : `start_date`, `end_date`, `user_id`

#### Périodes de congé
- `GET /leave_periods` - Obtenir les périodes de congé
- `GET /leave_periods/:id` - Obtenir une période de congé par ID
- `POST /leave_periods` - Créer une période de congé
- `PUT /leave_periods/:id/accept` - Accepter une période de congé (manager/admin)
- `DELETE /leave_periods/:id` - Supprimer une période de congé

#### Réinitialisation de mot de passe
- `POST /password/reset` - Demander une réinitialisation de mot de passe
- `POST /password/reset/:token` - Réinitialiser le mot de passe avec un token

#### Health Check
- `GET /health` - État de santé du système

## Schéma de base de données

### Users (Utilisateurs)
```typescript
{
  id: UUID (PK)
  firstName: VARCHAR(100)
  lastName: VARCHAR(100)
  email: VARCHAR(255) UNIQUE
  password: VARCHAR(255)
  admin: BOOLEAN
  phone: VARCHAR(20)
  refreshToken: VARCHAR(512)
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

### Teams (Équipes)
```typescript
{
  id: UUID (PK)
  name: VARCHAR(100) UNIQUE
  start_hour: TIME
  end_hour: TIME
  manager_id: UUID (FK -> users.id)
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

### Clocks (Pointages)
```typescript
{
  id: UUID (PK)
  user_id: UUID (FK -> users.id, CASCADE)
  at: TIMESTAMP
}
```

### User_Teams (Table de jonction)
```typescript
{
  id: UUID (PK)
  user_id: UUID (FK -> users.id, CASCADE)
  team_id: UUID (FK -> teams.id, CASCADE)
  UNIQUE(user_id, team_id)
}
```

### Leave_Periods (Périodes de congé)
```typescript
{
  id: UUID (PK)
  user_id: UUID (FK -> users.id, CASCADE)
  start_date: DATE
  end_date: DATE
  accepted: BOOLEAN
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

### Password_Reset_Tokens (Tokens de réinitialisation)
```typescript
{
  id: UUID (PK)
  user_id: UUID (FK -> users.id, CASCADE)
  token: VARCHAR(255) UNIQUE
  expiresAt: TIMESTAMP
  createdAt: TIMESTAMP
}
```

### Public_Holidays (Jours fériés)
```typescript
{
  id: UUID (PK)
  date: DATE UNIQUE
  name: VARCHAR(255)
  createdAt: TIMESTAMP
}
```

## Pipeline CI/CD

Le projet utilise GitHub Actions pour l'intégration et le déploiement continus.

### Étapes du workflow

#### 1. Tests Frontend (sur push vers main)
- Exécution : Push vers la branche `main`
- Vérifications : Couverture de code minimum 40%
- Sorties : Artifact de rapport de couverture (rétention de 90 jours)

#### 2. Build et Push Docker
- Exécution : Push vers les branches `main`, `dev`, `CICD`
- Dépend de : Réussite des tests frontend
- Actions :
  - Build des images Docker pour backend, frontend et admin
  - Push des images vers Docker Hub
  - Tag de la branche `main` comme `:main` et `:latest`
  - Utilisation du cache GitHub Actions pour des builds plus rapides

#### 3. Déploiement VPS (sur push vers main)
- Exécution : Push vers la branche `main` uniquement
- Dépend de : Réussite des tests et du build Docker
- Actions :
  - SSH vers le VPS
  - Pull du dernier code depuis GitHub
  - Pull des nouvelles images Docker depuis Docker Hub
  - Redémarrage des conteneurs avec les nouvelles images
  - Nettoyage des anciennes images

### Secrets GitHub requis

```
DOCKER_USERNAME       # Nom d'utilisateur Docker Hub
DOCKER_TOKEN          # Token d'accès Docker Hub
SSH_HOST              # Adresse IP du VPS
SSH_USER              # Nom d'utilisateur SSH
SSH_PRIVATE_KEY       # Clé privée SSH
SSH_PORT              # Port SSH (par défaut : 22)
```

### Fichiers de workflow

- `.github/workflows/ci.yml` - Pipeline CI/CD principal
- `.github/workflows/ci-build.yml` - Configurations de build supplémentaires
- `.github/workflows/cd-deploy-prod.yml` - Déploiement en production

## Structure du projet

```
T-DEV-700/
├── api/                          # Service backend
│   ├── __tests__/                # Fichiers de tests Jest
│   ├── config/                   # Fichiers de configuration
│   │   └── swagger.config.ts     # Config documentation API
│   ├── controllers/              # Gestionnaires de requêtes
│   ├── db/                       # Client de base de données
│   │   └── client.ts             # Connexion Drizzle DB
│   ├── drizzle/                  # Migrations de base de données
│   ├── middleware/               # Middlewares Express
│   │   ├── isAuth.ts             # Authentification JWT
│   │   ├── isAdmin.ts            # Autorisation admin
│   │   └── isMailAvailable.ts    # Vérification service mail
│   ├── models/                   # Schémas Drizzle ORM
│   │   ├── user.model.ts
│   │   ├── team.model.ts
│   │   ├── clock.model.ts
│   │   ├── user_team.model.ts
│   │   ├── leave_period.model.ts
│   │   ├── password.model.ts
│   │   └── public_holiday.model.ts
│   ├── routes/                   # Définitions de routes Express
│   │   ├── user.routes.ts
│   │   ├── team.routes.ts
│   │   ├── clock.routes.ts
│   │   ├── report.routes.ts
│   │   ├── leave_period.route.ts
│   │   └── password.route.ts
│   ├── services/                 # Couche de logique métier
│   │   ├── user.service.ts
│   │   ├── team.service.ts
│   │   ├── clock.service.ts
│   │   ├── report.service.ts
│   │   ├── leave_period.service.ts
│   │   ├── password.service.ts
│   │   └── mail.service.ts
│   ├── swagger/                  # Spécifications OpenAPI
│   ├── types/                    # Définitions de types TypeScript
│   ├── utils/                    # Fonctions utilitaires
│   │   ├── password.ts           # Hachage/validation mots de passe
│   │   ├── timezone.ts           # Utilitaires date/fuseau horaire
│   │   ├── cookie.ts             # Parser de cookies
│   │   └── format.ts             # Formateur de réponses
│   ├── Dockerfile
│   ├── drizzle.config.ts
│   ├── index.ts                  # Point d'entrée de l'application
│   ├── jest.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                     # Application utilisateur
│   ├── src/
│   │   ├── __tests__/            # Fichiers de tests Vitest
│   │   ├── components/           # Composants React
│   │   ├── context/              # Contexte React (auth, etc.)
│   │   ├── pages/                # Composants de page
│   │   ├── utils/                # Fonctions utilitaires
│   │   ├── App.tsx               # Composant racine
│   │   ├── main.tsx              # Point d'entrée de l'application
│   │   └── router.ts             # Définitions de routes
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── vitest.config.ts
│
├── admin/                        # Tableau de bord administratif
│   ├── src/
│   │   ├── components/           # Composants React
│   │   ├── context/              # Contexte React
│   │   ├── pages/                # Composants de page
│   │   ├── utils/                # Fonctions utilitaires
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── .github/
│   └── workflows/                # Workflows GitHub Actions
│       ├── ci.yml
│       ├── ci-build.yml
│       └── cd-deploy-prod.yml
│
├── .env                          # Variables d'environnement (non versionné)
├── .env.example                  # Template d'environnement
├── .gitignore
├── CLAUDE.md                     # Instructions assistant IA
├── docker-compose.dev.yml        # Configuration Docker développement
├── docker-compose.prod.yml       # Configuration Docker production
├── package.json                  # Package.json racine
└── README.md                     # Ce fichier
```

## Variables d'environnement

### Variables requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NODE_ENV` | Mode d'environnement | `development` ou `production` |
| `PORT` | Port du serveur backend | `3001` |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `ACCESS_TOKEN_SECRET` | Secret JWT pour token d'accès | `chaine_securisee_aleatoire` |
| `REFRESH_TOKEN_SECRET` | Secret JWT pour token de rafraîchissement | `chaine_securisee_aleatoire` |
| `WEBSITE_URL` | URL frontend pour CORS | `http://localhost:3001` |
| `ADMIN_WEBSITE_URL` | URL admin pour CORS | `http://localhost:3002` |
| `API_URL` | URL de l'API backend | `http://localhost:5001` |

### Variables optionnelles

| Variable | Description | Défaut |
|----------|-------------|--------|
| `ACCESS_TOKEN_EXPIRES_IN` | Durée de vie du token d'accès | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Durée de vie du token de rafraîchissement | `7d` |
| `PASSWORD_RESET_TOKEN_EXPIRATION` | Durée token de réinitialisation (minutes) | `30` |
| `SMTP_HOST` | Nom d'hôte du serveur SMTP | - |
| `SMTP_PORT` | Port du serveur SMTP | - |
| `SMTP_USE_SSL` | Utiliser SSL pour SMTP | `false` |
| `SMTP_USERNAME` | Utilisateur d'authentification SMTP | - |
| `SMTP_PASSWORD` | Mot de passe d'authentification SMTP | - |
| `SMTP_FROM` | Adresse email de l'expéditeur | - |

### Configuration des ports

| Variable | Description | Défaut |
|----------|-------------|--------|
| `FRONTEND_HOST_PORT` | Port hôte frontend | `3001` |
| `FRONTEND_CONTAINER_PORT` | Port conteneur frontend | `5173` |
| `BACKEND_HOST_PORT` | Port hôte backend | `5001` |
| `BACKEND_CONTAINER_PORT` | Port conteneur backend | `3001` |
| `ADMIN_HOST_PORT` | Port hôte admin | `3002` |
| `ADMIN_CONTAINER_PORT` | Port conteneur admin | `5173` |

## Contribution

### Workflow de développement

1. Forker le repository
2. Créer une branche de fonctionnalité : `git checkout -b feature/nom-de-votre-fonctionnalite`
3. Effectuer vos modifications
4. Exécuter les tests : `npm test`
5. Commiter vos modifications : `git commit -m "Ajouter votre fonctionnalité"`
6. Pousser vers la branche : `git push origin feature/nom-de-votre-fonctionnalite`
7. Créer une Pull Request

### Style de code

- **Backend** : TypeScript avec mode strict activé
- **Frontend/Admin** : React avec TypeScript
- **Formatage** : Indentation et conventions de nommage cohérentes
- **Linting** : Configuration ESLint (admin uniquement)

### Exigences de tests

- Backend : Maintenir >99% de couverture de tests
- Frontend : Maintenir minimum 40% de couverture de tests
- Tous les tests doivent passer avant fusion
- Ajouter des tests pour les nouvelles fonctionnalités

### Messages de commit

Suivre le format de commit conventionnel :

```
feat: ajouter la page de profil utilisateur
fix: résoudre le bug d'authentification
docs: mettre à jour la documentation API
test: ajouter les tests du service clock
refactor: améliorer la logique de gestion d'équipe
```

## Licence

Ce projet fait partie du cursus Epitech et est destiné à des fins éducatives.

---

**Auteur :** Hamid
**Repository :** [https://github.com/Hamid-dev13/T-DEV-700](https://github.com/Hamid-dev13/T-DEV-700)
**Dernière mise à jour :** Janvier 2026
