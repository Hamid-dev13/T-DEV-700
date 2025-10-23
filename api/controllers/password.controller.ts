import { Request, Response } from "express";
import { sendPasswordResetToken } from "../services/mail.service";
import { changePasswordWithToken } from "../services/password.service";
import { sendError } from "../utils/format";

export async function requestPasswordResetTokenController(req: Request, res: Response) {
  try {
    const body = req.body;
    let { email } = body ?? {};
    if (!email)
      throw new Error("Missing required field \"email\"")

    await sendPasswordResetToken(email);
    return res.sendStatus(200);
  } catch (err) {
    return res.sendStatus(500);
  }
}

export async function resetPasswordController(req: Request, res: Response) {
  try {
    const body = req.body;
    let { password, token } = body ?? {};

    await changePasswordWithToken(password, token);
    return res.sendStatus(200);
  } catch (err) {
    return sendError(res, err);
  }
}