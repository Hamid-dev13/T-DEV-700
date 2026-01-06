import { Request, Response } from "express";
import { getReportForUser } from "../services/report.service";
import { retrieveMainTeamForUser } from "../services/team.service";

export async function getReportsForUserController(req: Request, res: Response) {
  try {
    let { user, report, from, to } = req.query ?? {};
    if (!user || !report || !from || !to)
      throw new Error("Missing required fields: user, report, from, to");

    const user_id = user as string;
    const report_type = report as string;
    const fromDate = new Date(from as string);
    if (isNaN(fromDate.getTime())) return res.sendError("Invalid Date \"from\"", 400);
    fromDate.setHours(0, 0, 0, 0)
    const toDate = new Date(to as string);
    if (isNaN(toDate.getTime())) return res.sendError("Invalid Date \"to\"", 400);
    toDate.setHours(0, 0, 0, 0)

    const sender_id = req.user_id!;

    // Allow users to fetch their own reports
    if (user_id !== sender_id) {
      // Check if the sender is the manager of the target user's team
      const targetUserTeam = await retrieveMainTeamForUser(user_id);
      
      if (!targetUserTeam)
        return res.sendError("User is not in any team", 404);

      if (!(req.admin || targetUserTeam.managerId === sender_id))
        return res.sendError("Insufficient permissions", 403);
    }

    const reports = await getReportForUser(user_id, report_type, fromDate, toDate);
    
    return res.status(200).json(reports);
  } catch (err) {
    return res.sendError(err);
  }
}