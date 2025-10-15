import { Request, Response } from "express";
import { reportTime, retrieveReportTimeSummary } from "../services/clock.service";
import { formatWithTimezone } from "../utils/timezone";

export async function reportTimeController(req: Request, res: Response) {
  try {
    const user_id = req.user_id!;

    const clock = await reportTime(user_id);
    
    // Formater la date avec le timezone
    return res.status(200).json({
      ...clock,
      at: formatWithTimezone(clock.at)  // 👈 AJOUT ICI
    });
  } catch (err) {
    console.log(err)
    return res.sendStatus(500);
  }
}

export async function retrieveReportTimeSummaryController(req: Request, res: Response) {
  try {
    const user_id = req.user_id!;
    const body = req.body;
    let { from, to } = body ?? {};  // 👈 CHANGÉ : date/days → from/to

    if (from) {
      from = new Date(from);
      from.setHours(0, 0, 0, 0);
    }

    if (to) {
      to = new Date(to);
      to.setHours(0, 0, 0, 0);
    }

    // Vérifier que from et to sont définis
    if (!from || !to) {
      return res.status(400).json({ 
        error: "Les paramètres 'from' et 'to' sont requis" 
      });
    }

    const results = await retrieveReportTimeSummary(user_id, { from, to });
    
    // Formater toutes les dates avec date-fns-tz
    const formattedResults = results.map(dateUTC => formatWithTimezone(dateUTC));
    
    return res.status(200).json(formattedResults);
  } catch (err) {
    console.log(err)
    return res.sendStatus(500);
  }
}
// Gardez aussi votre testDateController si vous voulez
export async function testDateController(req: Request, res: Response) {
  const now = new Date();
  
  return res.status(200).json({
    iso_string: now.toISOString(),
    to_string: now.toString(),
    locale_string: now.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
    with_date_fns: formatWithTimezone(now),  // 👈 NOUVEAU
    timestamp: now.getTime(),
    hours: now.getHours(),
    timezone_offset: now.getTimezoneOffset()
  });
}