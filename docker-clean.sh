#!/bin/bash

echo "🧹 Nettoyage de Docker..."

# Arrêter tous les conteneurs
docker compose down

# Nettoyer les conteneurs
docker container prune -f

# Nettoyer les images orphelines
docker image prune -f

# Nettoyer les volumes non utilisés (optionnel - décommenter si nécessaire)
# docker volume prune -f

echo "✅ Nettoyage terminé!"
echo ""
echo "Vous pouvez maintenant lancer: docker compose up --build"

