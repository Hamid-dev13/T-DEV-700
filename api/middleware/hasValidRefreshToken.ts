import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { COOKIE_REFRESH_TOKEN_KEY, getCookie } from "../utils/cookies";

export async function hasValidRefreshToken(req: Request, res: Response, next: NextFunction) {
    try {
        const refreshToken = req.headers.cookie ? getCookie(req.headers.cookie, COOKIE_REFRESH_TOKEN_KEY) : null;

        if (!refreshToken)
            return res.sendError("No refresh token provided", 401);

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as jwt.JwtPayload;

        // put token data in request
        req.user_id = decoded.user_id;

        return next();
    } catch (error: unknown) {
        return res.sendError(error, 401);
    }
}