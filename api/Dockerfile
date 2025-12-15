# ==========================================
# ÉTAPE 1 : DEPENDENCIES (installation)
# ==========================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation de TOUTES les dépendances (dev + prod)
# On en a besoin pour compiler si tu utilises TypeScript
RUN npm ci --frozen-lockfile

# ==========================================
# ÉTAPE 2 : BUILD (si TypeScript)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# On récupère les node_modules de l'étape précédente
COPY --from=dependencies /app/node_modules ./node_modules

# On copie tout le code source
COPY . .

# Compilation TypeScript
RUN npm run build

# ==========================================
# ÉTAPE 3 : PRODUCTION (image finale légère)
# ==========================================
FROM node:20-alpine AS production

# Pourquoi Alpine ? Sécurité et taille réduite !
# On installe dumb-init pour gérer proprement les signaux (arrêt gracieux)
RUN apk add --no-cache dumb-init

# Création d'un utilisateur non-root pour la sécurité
# Par défaut, les processus tournent en root = DANGER !
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# On se place dans /app
WORKDIR /app

# On change le propriétaire du dossier pour notre utilisateur nodejs
RUN chown -R nodejs:nodejs /app

# On passe à l'utilisateur non-root
USER nodejs

# Copie UNIQUEMENT des node_modules de production (pas les devDependencies)
# On va les réinstaller pour être sûr
COPY --chown=nodejs:nodejs package*.json ./
RUN npm ci --only=production --frozen-lockfile && npm cache clean --force

# Copie du code compilé TypeScript depuis l'étape builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Exposition du port
EXPOSE 3000

# HEALTHCHECK : Docker vérifie régulièrement que l'app est en vie
# Toutes les 30s, attendre 3s, timeout 10s, 3 échecs max avant "unhealthy"
# Utilise la variable PORT ou 3001 par défaut
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "const port = process.env.PORT || 3001; require('http').get(`http://localhost:${port}/health`, (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# dumb-init gère les signaux correctement (SIGTERM pour arrêt propre)
# Ensuite on lance l'application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]