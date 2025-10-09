import { NextFunction, Request, Response } from "express";

export async function isAdmin(req: Request, res: Response, next: NextFunction) {
    try {
        const admin = req.admin!;

        if (admin === true) {
            return next();
        } else {
            return res.status(401).json({ error: "Insufficient permissions" });
        }
    } catch (err) {
        return res.sendStatus(500);
    }
}