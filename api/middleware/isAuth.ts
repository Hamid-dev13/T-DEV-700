import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getCookie } from "../utils/cookie";


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
            token = getCookie(req.headers.cookie, "token");
        }

        if (token) {
            // verify
            jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
                if (err) {
                    return res.status(401).json({ message: "Invalid Token" });
                }

                const payload = decoded as jwt.JwtPayload;

                // put token data in request
                req.user_id = payload.user_id;
                req.admin = payload.admin;

                return next();
            })
        } else {
            return res.status(401).json({ error: "Invalid Token" });
        }

    } catch(error) {
        return res.status(401).json({ error: "Invalid Token" });
    }
}