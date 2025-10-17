import { NextFunction, Request, Response } from "express";
import { transporter } from "../services/mail.service";

export async function isMailAvailable(req: Request, res: Response, next: NextFunction) {
    return transporter ? next() : res.sendStatus(503);
}