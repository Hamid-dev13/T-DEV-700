import { Response } from "express";

export function sendError(res: Response, error?: any | null, code?: number | null) {
  code = code || 500;
  if (error instanceof Error)
    error = error.message
  return error ? res.status(code).json({ error }) : res.sendStatus(code);
}