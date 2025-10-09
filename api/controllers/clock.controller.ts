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
    const body = req.body;
    let { date, days } = body ?? {};

    if (date) {
      date = new Date(date);
      // set hours, minutes, seconds and milliseconds to 0, keep only the date component
      date.setHours(0); date.setMinutes(0); date.setSeconds(0); date.setMilliseconds(0);
    }

    const results = await retrieveReportTimeSummary(user_id, { date, days });
    return res.status(200).json(results);
  } catch (err) {
    console.log(err)
    return res.sendStatus(500);
  }
}
