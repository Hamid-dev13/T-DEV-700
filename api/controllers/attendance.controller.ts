import { Request, Response } from "express";
import { calculateDelay } from "../services/attendance.service";

/**
 * GET /attendance/delay?date=2025-10-13
 */
export async function getDelayController(req: Request, res: Response) {
  try {
    const user_id = req.user_id!;
    const { date } = req.query;

    // Par défaut : aujourd'hui
    const targetDate = date ? new Date(date as string) : new Date();

    const delayMinutes = await calculateDelay(user_id, targetDate);

    if (delayMinutes === null) {
      return res.status(200).json({
        date: targetDate.toISOString().split('T')[0],
        status: "absent",
        delay_minutes: null,
      });
    }

    let status: string;
    if (delayMinutes > 0) {
      status = "late";
    } else if (delayMinutes < 0) {
      status = "early";
    } else {
      status = "on_time";
    }

    return res.status(200).json({
      date: targetDate.toISOString().split('T')[0],
      status,
      delay_minutes: delayMinutes,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}