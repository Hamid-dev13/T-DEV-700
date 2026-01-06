import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Time Manager API',
      version: '1.0.0',
      description: `
# API de Gestion du Temps

Cette API permet de gérer :
- 👥 **Utilisateurs** : Authentification, profils, gestion des comptes
- 🏢 **Équipes** : Création et gestion des équipes de travail
- ⏰ **Pointages** : Enregistrement des heures d'arrivée/départ
- 📊 **Présence** : Calcul des retards et statistiques de présence

## Authentification

La plupart des endpoints nécessitent un token JWT. Pour l'obtenir :
1. Appelez \`POST /user/login\` avec vos identifiants
2. Récupérez le token dans le cookie \`token\`
3. Utilisez-le dans le header \`Authorization: Bearer <token>\`

## Permissions

- 🔓 **Utilisateur** : Peut gérer son propre profil et pointer
- 🔐 **Admin** : Peut gérer tous les utilisateurs et équipes
      `,
      contact: {
        name: 'Support API',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5001',
        description: process.env.NODE_ENV === 'production' ? 'Serveur de production' : 'Serveur de développement',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu via /user/login',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Users',
        description: 'Gestion des utilisateurs et authentification',
      },
      {
        name: 'Teams',
        description: 'Gestion des équipes de travail',
      },
      {
        name: 'Clocks',
        description: 'Système de pointage (clock in/out)',
      },
      {
        name: 'Attendance',
        description: 'Suivi de présence et calcul des retards',
      },
      {
        name: 'Reports',
        description: 'Génération de rapports KPI (lateness, pause_times, presence, earlyness)',
      },
      {
        name: 'Leave Periods',
        description: 'Gestion des périodes de congé et absences',
      },
      {
        name: 'Password',
        description: 'Réinitialisation de mot de passe',
      },
      {
        name: 'Health',
        description: 'Santé du système et informations API',
      },
    ],
  },
  // Chemins vers les fichiers de documentation Swagger
  apis: [
    './swagger/schemas.yaml',
    './swagger/users.yaml',
    './swagger/teams.yaml',
    './swagger/clocks.yaml',
    './swagger/reports.yaml',
    './swagger/leave_periods.yaml',
    './swagger/password.yaml',
    './swagger/health.yaml',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);