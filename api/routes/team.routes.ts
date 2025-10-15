import { Router } from "express";
import { isAuth } from "../middleware/isAuth";
import { isAdmin } from "../middleware/isAdmin";
import { addTeamController, addTeamUserController, deleteTeamController, removeTeamUserController, retrieveMyTeamsController, retrieveTeamController, retrieveTeamsController, retrieveTeamUsersController, updateTeamController } from "../controllers/team.controller";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Team:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         managerId:
 *           type: string
 *           format: uuid
 *         startHour:
 *           type: number
 *           format: float
 *         endHour:
 *           type: number
 *           format: float
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateTeamRequest:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - manager_id
 *         - start_hour
 *         - end_hour
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         manager_id:
 *           type: string
 *           format: uuid
 *         start_hour:
 *           type: number
 *           format: float
 *         end_hour:
 *           type: number
 *           format: float
 *     UpdateTeamRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         manager_id:
 *           type: string
 *           format: uuid
 *         start_hour:
 *           type: number
 *           format: float
 *         end_hour:
 *           type: number
 *           format: float
 *     AddTeamUserRequest:
 *       type: object
 *       required:
 *         - user_id
 *       properties:
 *         user_id:
 *           type: string
 *           format: uuid
 *     RemoveTeamUserRequest:
 *       type: object
 *       required:
 *         - user_id
 *       properties:
 *         user_id:
 *           type: string
 *           format: uuid
 */

/**
 * @swagger
 * /teams:
 *   get:
 *     summary: Récupérer toutes les équipes
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des équipes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Team'
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get("/teams", isAuth, retrieveTeamsController);

/**
 * @swagger
 * /teams/{id}:
 *   get:
 *     summary: Récupérer une équipe par ID
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'équipe
 *     responses:
 *       200:
 *         description: Équipe trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get("/teams/:id", isAuth, retrieveTeamController);

/**
 * @swagger
 * /teams:
 *   post:
 *     summary: Créer une nouvelle équipe (Admin uniquement)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTeamRequest'
 *     responses:
 *       200:
 *         description: Équipe créée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *       400:
 *         description: Champs requis manquants
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé (admin requis)
 *       500:
 *         description: Erreur serveur
 */
router.post("/teams", isAuth, isAdmin, addTeamController);

/**
 * @swagger
 * /teams/{id}:
 *   put:
 *     summary: Mettre à jour une équipe
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'équipe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTeamRequest'
 *     responses:
 *       200:
 *         description: Équipe mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.put("/teams/:id", isAuth, updateTeamController);

/**
 * @swagger
 * /teams/{id}:
 *   delete:
 *     summary: Supprimer une équipe (Admin uniquement)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'équipe
 *     responses:
 *       200:
 *         description: Équipe supprimée
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé (admin requis)
 *       500:
 *         description: Erreur serveur
 */
router.delete("/teams/:id", isAuth, isAdmin, deleteTeamController);

/**
 * @swagger
 * /teams/{id}/users:
 *   get:
 *     summary: Récupérer les utilisateurs d'une équipe
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'équipe
 *     responses:
 *       200:
 *         description: Liste des utilisateurs de l'équipe
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get("/teams/:id/users", isAuth, retrieveTeamUsersController);

/**
 * @swagger
 * /teams/{id}/users:
 *   post:
 *     summary: Ajouter un utilisateur à une équipe (Admin uniquement)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'équipe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddTeamUserRequest'
 *     responses:
 *       200:
 *         description: Utilisateur ajouté à l'équipe
 *       400:
 *         description: Champs requis manquants
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé (admin requis)
 *       500:
 *         description: Erreur serveur
 */
router.post("/teams/:id/users", isAuth, isAdmin, addTeamUserController);

/**
 * @swagger
 * /teams/{id}/users:
 *   delete:
 *     summary: Retirer un utilisateur d'une équipe (Admin uniquement)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'équipe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RemoveTeamUserRequest'
 *     responses:
 *       200:
 *         description: Utilisateur retiré de l'équipe
 *       400:
 *         description: Champs requis manquants
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé (admin requis)
 *       500:
 *         description: Erreur serveur
 */
router.delete("/teams/:id/users", isAuth, isAdmin, removeTeamUserController);

/**
 * @swagger
 * /user/teams:
 *   get:
 *     summary: Récupérer mes équipes
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de mes équipes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Team'
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get("/user/teams", isAuth, retrieveMyTeamsController);

export default router;
