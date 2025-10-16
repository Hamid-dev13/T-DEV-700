import { Request, Response } from "express";
import { getReportForUser, ReportType } from "../services/report.service";
import { isTeamManager } from "../services/team.service";

export async function getReportsForUserController(req: Request, res: Response) {
  try {
    let { user, team, report, from, to } = req.query ?? {};
    if (!user || !team || !report || !from || !to)
      throw new Error("Missing required fields: user, team, report, from, to");

    const user_id = user as string;
    const team_id = team as string;
    const report_type = report as ReportType;
    const fromDate = new Date(from as string);
    fromDate.setHours(0, 0, 0, 0)
    const toDate = new Date(to as string);
    toDate.setHours(0, 0, 0, 0)

    const sender_id = req.user_id!;
    if (!(req.admin || await isTeamManager(sender_id, team_id)))
      return res.status(401).json({ error: "Insufficient permissions" });

    const reports = await getReportForUser(user_id, team_id, report_type, fromDate, toDate);
    
    return res.status(200).json(reports);
  } catch (err) {
    console.log(err)
    return res.sendStatus(500);
  }
}