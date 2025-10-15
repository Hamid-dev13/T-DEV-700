import { Router } from "express";
import { isAuth } from "../middleware/isAuth";
import { isAdmin } from "../middleware/isAdmin";
import { 
  reportTimeController, 
  retrieveReportTimeSummaryController,

} from "../controllers/clock.controller";
import { getDelayController } from "../controllers/attendance.controller"; 

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Clock:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         at:
 *           type: string
 *           format: date-time
 *     ReportTimeSummaryRequest:
 *       type: object
 *       required:
 *         - from
 *         - to
 *       properties:
 *         from:
 *           type: string
 *           format: date
 *           description: Date de début (format YYYY-MM-DD)
 *         to:
 *           type: string
 *           format: date
 *           description: Date de fin (format YYYY-MM-DD)
 *     DelayResponse:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [absent, late, early, on_time]
 *         delay_minutes:
 *           type: number
 *           nullable: true
 */

/**
 * @swagger
 * /clocks:
 *   post:
 *     summary: Pointer (clock in/out)
 *     description: Enregistre l'heure d'arrivée ou de départ de l'utilisateur connecté
 *     tags: [Clocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pointage enregistré
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Clock'
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.post("/clocks", isAuth, reportTimeController);

/**
 * @swagger
 * /users/{id}/clocks:
 *   get:
 *     summary: Récupérer le résumé des pointages d'un utilisateur
 *     description: Récupère tous les pointages d'un utilisateur dans une période donnée
 *     tags: [Clocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReportTimeSummaryRequest'
 *     responses:
 *       200:
 *         description: Liste des pointages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 format: date-time
 *       400:
 *         description: Paramètres manquants ou invalides
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get("/users/:id/clocks", isAuth, retrieveReportTimeSummaryController);

/**
 * @swagger
 * /attendance/delay:
 *   get:
 *     summary: Calculer le retard/avance pour une date donnée
 *     description: Calcule le retard ou l'avance de l'utilisateur par rapport à l'heure de début de son équipe
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date à vérifier (format YYYY-MM-DD). Par défaut, aujourd'hui.
 *     responses:
 *       200:
 *         description: Statut de présence et retard calculé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DelayResponse'
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get("/attendance/delay", isAuth, getDelayController); 
 

export default router;