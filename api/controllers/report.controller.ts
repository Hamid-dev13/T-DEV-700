import { Request, Response } from "express";
import { getReportForUser } from "../services/report.service";
import { retrieveMainTeamForUser } from "../services/team.service";
import { sendError } from "../utils/format";

export async function getReportsForUserController(req: Request, res: Response) {
  try {
    let { user, report, from, to } = req.query ?? {};
    if (!user || !report || !from || !to)
      throw new Error("Missing required fields: user, report, from, to");

    const user_id = user as string;
    const report_type = report as string;
    const fromDate = new Date(from as string);
    if (isNaN(fromDate.getTime())) return sendError(res, "Invalid Date \"from\"", 400);
    fromDate.setHours(0, 0, 0, 0)
    const toDate = new Date(to as string);
    if (isNaN(toDate.getTime())) return sendError(res, "Invalid Date \"to\"", 400);
    toDate.setHours(0, 0, 0, 0)

    const sender_id = req.user_id!;

    // Permettre à un utilisateur de voir ses propres rapports
    if (user_id !== sender_id) {
      // Vérifier si le sender est manager de l'équipe de l'utilisateur cible
      const targetUserTeam = await retrieveMainTeamForUser(user_id);
      
      if (!targetUserTeam) {
        return sendError(res, "User is not in any team", 404);
      }

      if (!(req.admin || targetUserTeam.managerId === sender_id))
        return sendError(res, "Insufficient permissions", 401);
    }

    const reports = await getReportForUser(user_id, report_type, fromDate, toDate);
    
    return res.status(200).json(reports);
  } catch (err) {
    return sendError(res, err);
  }
}