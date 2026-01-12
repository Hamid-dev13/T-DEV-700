import { Request, Response } from "express";
import { isManagerOfUser } from "../services/team.service";
import { LeavePeriod } from "../models/leave_period.model";
import { addLeavePeriod, deleteLeavePeriod, deleteLeavePeriodOfMyUser, retrieveLeavePeriods, updateLeavePeriod } from "../services/leave_period.service";

export async function retrieveLeavePeriodsForMyUserController(req: Request, res: Response) {
  try {
    const user_id = req.user_id!;

    const periods = await retrieveLeavePeriods(user_id);
    return res.status(200).json(periods);
  } catch (err) {
    return res.sendError(err);
  }
}

export async function retrieveLeavePeriodsForUserController(req: Request, res: Response) {
  try {
    const user_id = req.params.id!;

    const periods = await retrieveLeavePeriods(user_id);
    return res.status(200).json(periods);
  } catch (err) {
    return res.sendError(err);
  }
}

export async function addLeavePeriodForMyUserController(req: Request, res: Response) {
  try {
    const user_id = req.user_id!;
    const { start_date: start, end_date: end } = req.body ?? {};

    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) return res.sendError("Invalid Date \"start_date\"", 400);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    if (isNaN(endDate.getTime())) return res.sendError("Invalid Date \"end_date\"", 400);
    endDate.setHours(0, 0, 0, 0);
    endDate.setDate(endDate.getDate() + 1); // cover whole day

    if (endDate.getTime() - startDate.getTime() < 360000 * 24)
      return res.sendError("Invalid Dates", 400);

    // Check for overlapping leave periods
    const existingPeriods = await retrieveLeavePeriods(user_id);
    const hasOverlap = existingPeriods.some(period => {
      const periodStart = new Date(period.startDate);
      const periodEnd = new Date(period.endDate);
      return (startDate < periodEnd && endDate > periodStart);
    });

    if (hasOverlap) {
      return res.sendError("Specified dates overlap with an existing leave period", 400);
    }

    const period = await addLeavePeriod(user_id, startDate, endDate);
    return res.status(200).json(period);
  } catch (err) {
    return res.sendError(err);
  }
}

export async function addLeavePeriodForUserController(req: Request, res: Response) {
  try {
    const sender_id = req.user_id!;
    const user_id = req.params.id!;
    const is_admin = req.admin!;
    const { start_date: start, end_date: end, accepted } = req.body ?? {};

    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) return res.sendError("Invalid Date \"start_date\"", 400);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    if (isNaN(endDate.getTime())) return res.sendError("Invalid Date \"end_date\"", 400);
    endDate.setHours(0, 0, 0, 0);
    endDate.setDate(endDate.getDate() + 1); // cover whole day

    if (endDate.getTime() - startDate.getTime() < 360000 * 24)
      return res.sendError("Invalid Dates", 400);

    if (!(is_admin || await isManagerOfUser(sender_id, user_id)))
      return res.sendError("Insufficient permissions", 403);

    const period = await addLeavePeriod(user_id, startDate, endDate, accepted);
    return res.status(200).json(period);
  } catch (err) {
    return res.sendError(err);
  }
}

export async function updateLeavePeriodForUserController(req: Request, res: Response) {
  try {
    const sender_id = req.user_id!;
    const is_admin = req.admin!;
    const { user_id, leave_id } = req.params ?? {};
    const { accepted, start_date: start, end_date: end } = req.body ?? {};

    if (!(is_admin || await isManagerOfUser(sender_id, user_id)))
      return res.sendError("Insufficient permissions", 403);

    let period: LeavePeriod;

    if (is_admin) {
      const startDate = new Date(start);
      if (isNaN(startDate.getTime())) return res.sendError("Invalid Date \"start_date\"", 400);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      if (isNaN(endDate.getTime())) return res.sendError("Invalid Date \"end_date\"", 400);
      endDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() + 1); // cover whole day

      if (endDate.getTime() - startDate.getTime() < 360000 * 24)
        return res.sendError("Invalid Dates", 400);

      period = await updateLeavePeriod(leave_id, { accepted, startDate, endDate });
    } else {
      period = await updateLeavePeriod(leave_id, { accepted });
    }

    return res.status(200).json(period);
  } catch (err) {
    return res.sendError(err);
  }
}

export async function deleteLeavePeriodForMyUserController(req: Request, res: Response) {
  try {
    const user_id = req.user_id!;
    const { id: leave_id } = req.params ?? {};

    const result = await deleteLeavePeriodOfMyUser(user_id, leave_id);
    return res.status(200).json({ result });
  } catch (err) {
    return res.sendError(err);
  }
}

export async function deleteLeavePeriodForUserController(req: Request, res: Response) {
  try {
    const sender_id = req.user_id!;
    const is_admin = req.admin!;
    const { user_id, leave_id } = req.params ?? {};

    if (!(is_admin || await isManagerOfUser(sender_id, user_id)))
      return res.sendError("Insufficient permissions", 403);

    const result = await deleteLeavePeriod(leave_id);
    return res.status(200).json({ result });
  } catch (err) {
    return res.sendError(err);
  }
}
