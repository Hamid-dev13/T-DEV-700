import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { COOKIE_ACCESS_TOKEN_KEY, getCookie } from "../utils/cookies";


export async function isAuth(req: Request, res: Response, next: NextFunction) {
    try {
        // get token from auth header or from cookies
        let token: string | null = null;

        // try from auth bearer header
        const auth = req.headers.authorization;

        const prefix = "Bearer "
        if (auth && auth.startsWith(prefix)) {
            token = auth.substring(prefix.length);
        }

        // try from cookies
        if (!token && req.headers.cookie) {
            token = getCookie(req.headers.cookie, COOKIE_ACCESS_TOKEN_KEY);
        }

        if (token) {
            // verify
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err, decoded) => {
                if (err) {
                    return res.sendError("Invalid Token", 401);
                }

                const payload = decoded as jwt.JwtPayload;

                // put token data in request
                req.user_id = payload.user_id;
                req.admin = payload.admin;

                return next();
            })
        } else {
            return res.sendError("Invalid Token", 401);
        }

    } catch(error: any) {
        return res.sendError(error, 401);
    }
}