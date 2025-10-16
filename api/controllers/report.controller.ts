import { Request, Response } from "express";
import { getReportForUser, ReportType } from "../services/report.service";
import { isTeamManager, retrieveMainTeamForUser } from "../services/team.service";
import { sendError } from "../utils/format";

export async function getReportsForUserController(req: Request, res: Response) {
  try {
    let { user, report, from, to } = req.query ?? {};
    if (!user || !report || !from || !to)
      throw new Error("Missing required fields: user, report, from, to");

    const user_id = user as string;
    const report_type = report as ReportType;
    const fromDate = new Date(from as string);
    fromDate.setHours(0, 0, 0, 0)
    const toDate = new Date(to as string);
    toDate.setHours(0, 0, 0, 0)

    const sender_id = req.user_id!;

    const team = (await retrieveMainTeamForUser(sender_id) || undefined)!;

    if (!(req.admin || team.managerId === sender_id))
      return sendError(res, "Insufficient permissions", 401);

    const reports = await getReportForUser(user_id, report_type, fromDate, toDate);
    
    return res.status(200).json(reports);
  } catch (err) {
    return sendError(res, err);
  }
}