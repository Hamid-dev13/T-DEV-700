#!/bin/bash

echo "🔍 Vérification du seuil de coverage minimum (40%)..."

# Exécuter les tests avec coverage
npm run test:coverage -- --run

# Extraire le pourcentage de coverage depuis le fichier JSON de coverage
if [ -f "coverage/coverage-summary.json" ]; then
  COVERAGE=$(node -e "const fs = require('fs'); const data = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8')); console.log(data.total.lines.pct.toFixed(2));")
else
  echo "❌ Fichier coverage/coverage-summary.json introuvable!"
  exit 1
fi

echo "📊 Coverage actuel: ${COVERAGE}%"

# Vérifier si le coverage est au-dessus du seuil
if (( $(echo "$COVERAGE < 40" | bc -l) )); then
  echo "❌ Coverage insuffisant! Minimum requis: 40%, actuel: ${COVERAGE}%"
  exit 1
else
  echo "✅ Coverage OK! Seuil atteint: ${COVERAGE}% >= 40%"
fi

