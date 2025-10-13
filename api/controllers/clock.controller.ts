import { Request, Response } from "express";
import { reportTime, retrieveReportTimeSummary } from "../services/clock.service";
import { zeroOutTime } from "../utils/date";

export async function reportTimeController(req: Request, res: Response) {
  try {
    const user_id = req.user_id!;

    const clock = await reportTime(user_id);
    return res.status(200).json(clock);
  } catch (err) {
    console.log(err)
    return res.sendStatus(500);
  }
}

export async function retrieveReportTimeSummaryController(req: Request, res: Response) {
  try {
    const user_id = req.user_id!;
    const body = req.body;
    let { from, to } = body ?? {};
    if (!from || !to)
      throw new Error("Missing required fields from, to");

    from = new Date(from);
    zeroOutTime(from);

    to = new Date(to);
    zeroOutTime(to);

    const results = await retrieveReportTimeSummary(user_id, { from, to });
    return res.status(200).json(results);
  } catch (err) {
    console.log(err)
    return res.sendStatus(500);
  }
}
