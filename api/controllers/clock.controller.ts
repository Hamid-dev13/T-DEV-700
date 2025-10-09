import { Request, Response } from "express";
import { reportTime, retrieveReportTimeSummary } from "../services/clock.service";

export async function reportTimeController(req: Request, res: Response) {
  try {
    const user_id = req.user_id!;

    const log = await reportTime(user_id);
    return res.status(200).json(log);
  } catch (err) {
    console.log(err)
    return res.sendStatus(500);
  }
}

export async function retrieveReportTimeSummaryController(req: Request, res: Response) {
  try {
    const user_id = req.user_id!;
    const results = await retrieveReportTimeSummary(user_id);
    return res.status(200).json(results);
  } catch (err) {
    console.log(err)
    return res.sendStatus(500);
  }
}
