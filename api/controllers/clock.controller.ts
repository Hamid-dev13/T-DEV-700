import { Request, Response } from "express";
import { reportTime, getClocksForUser } from "../services/clock.service";
import { formatWithTimezone } from "../utils/timezone";
import { sendError } from "../utils/format";

export async function reportTimeController(req: Request, res: Response) {
  try {
    const user_id = req.user_id!;

    const clock = await reportTime(user_id);
    
    return res.status(200).json({
      ...clock,
      at: formatWithTimezone(clock.at)
    });
  } catch (err) {
    console.log(err)
    return res.sendStatus(500);
  }
}

export async function retrieveReportTimeSummaryController(req: Request, res: Response) {
  try {
    const user_id = req.params.id!;
    let { from, to } = req.query ?? {};

    if (!from || !to)
      return sendError(res, "Missing required fields 'from', 'to'", 400);

    const fromDate = new Date(from as string);
    fromDate.setHours(0, 0, 0, 0)

    const toDate = new Date(to as string);
    toDate.setHours(0, 0, 0, 0)

    const results = await getClocksForUser(user_id, { from: fromDate, to: toDate });
    
    // format dates with date-fns-tz
    const formattedResults = results.map(dateUTC => formatWithTimezone(dateUTC));
    
    return res.status(200).json(formattedResults);
  } catch (err) {
    return res.sendStatus(500);
  }
}
export async function testDateController(req: Request, res: Response) {
  const now = new Date();
  
  return res.status(200).json({
    iso_string: now.toISOString(),
    to_string: now.toString(),
    locale_string: now.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
    with_date_fns: formatWithTimezone(now),
    timestamp: now.getTime(),
    hours: now.getHours(),
    timezone_offset: now.getTimezoneOffset()
  });
}