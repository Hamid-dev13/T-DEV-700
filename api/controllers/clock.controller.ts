import { Request, Response } from "express";
import { addClock, getClocksForUser, removeClock, updateClock } from "../services/clock.service";
import { convertToUTC, formatWithTimezone } from "../utils/timezone";
import { sendError } from "../utils/format";
import { isManagerOfUser } from "../services/team.service";

export async function reportTimeController(req: Request, res: Response) {
  try {
    const user_id = req.user_id!;

    const clock = await addClock(user_id);
    
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
    if (isNaN(fromDate.getTime())) return sendError(res, "Invalid Date \"from\"", 400);
    fromDate.setHours(0, 0, 0, 0)

    const toDate = new Date(to as string);
    if (isNaN(toDate.getTime())) return sendError(res, "Invalid Date \"to\"", 400);
    toDate.setHours(0, 0, 0, 0)

    const results = await getClocksForUser(user_id, { from: fromDate, to: toDate });
    
    // format dates with date-fns-tz
    const formattedResults = results.map(dateUTC => formatWithTimezone(dateUTC));
    
    return res.status(200).json(formattedResults);
  } catch (err) {
    return res.sendStatus(500);
  }
}

export async function addClockForMemberController(req: Request, res: Response) {
  try {
    const sender_id = req.user_id!;
    const is_admin = req.admin!;
    const { id: user_id } = req.params ?? {};
    const { at } = req.body ?? {};

    if (!at) return sendError(res, "Missing required field \"at\"", 400);

    if (!(is_admin || await isManagerOfUser(sender_id, user_id)))
      return sendError(res, "Insufficient permissions", 401);

    const atDate = new Date(at);

    if (isNaN(atDate.getTime())) return sendError(res, "Invalid Date", 400);

    const clock = await addClock(user_id, atDate);
    return res.status(200).json(clock);
  } catch (err) {
    return sendError(res, err);
  }
}

export async function updateClockForMemberController(req: Request, res: Response) {
  try {
    const sender_id = req.user_id!;
    const is_admin = req.admin!;
    const { id: user_id } = req.params ?? {};
    const { from, to } = req.body ?? {};
    
    if (!from || !to) return sendError(res, "Missing required fields \"from\", \"to\"", 400);
    
    if (!(is_admin || await isManagerOfUser(sender_id, user_id)))
      return sendError(res, "Insufficient permissions", 401);

    const fromDate = new Date(from);
    if (isNaN(fromDate.getTime())) return sendError(res, "Invalid Date", 400);
    const toDate = new Date(to);
    if (isNaN(toDate.getTime())) return sendError(res, "Invalid Date", 400);

    const clock = await updateClock(user_id, fromDate, toDate);
    
    return res.status(200).json(clock);
  } catch (err) {
    return sendError(res, err);
  }
}

export async function deleteClockForMemberController(req: Request, res: Response) {
  try {
    const sender_id = req.user_id!;
    const is_admin = req.admin!;
    const { id: user_id } = req.params ?? {};
    const { at } = req.body ?? {};

    if (!at) return sendError(res, "Missing required field \"at\"", 400);
    
    if (!(is_admin || await isManagerOfUser(sender_id, user_id)))
      return sendError(res, "Insufficient permissions", 401);

    const atDate = new Date(at);

    if (isNaN(atDate.getTime())) return sendError(res, "Invalid Date", 400);
    
    await removeClock(user_id, atDate);
    
    return res.sendStatus(200);
  } catch (err) {
    return sendError(res, err);
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