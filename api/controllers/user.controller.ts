import { Request, Response } from "express";
import { addUser, clearRefreshTokenForUser, deleteUser, generateAccessToken, loginUser, retrieveUser, retrieveUserSafe, retrieveUsersSafe, updateUser } from "../services/user.service";
import { ACCESS_TOKEN_COOKIE_OPTS, COOKIE_ACCESS_TOKEN_KEY, COOKIE_REFRESH_TOKEN_KEY, getCookie, REFRESH_TOKEN_COOKIE_OPTS } from "../utils/cookies";

export async function loginUserController(req: Request, res: Response) {
  try {
    const body = req.body;
    const { email, password } = body ?? {};
    if (!email || !password) return res.sendError("Missing required fields", 400);

    const { accessToken, refreshToken, user } = await loginUser({ email, password });

    res.cookie(COOKIE_ACCESS_TOKEN_KEY, accessToken, ACCESS_TOKEN_COOKIE_OPTS);
    res.cookie(COOKIE_REFRESH_TOKEN_KEY, refreshToken, REFRESH_TOKEN_COOKIE_OPTS);

    return res.status(200).json(user);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("Invalid credentials") ? 401 : 500;
    console.log('[LOGIN] Authentication failed:', message);
    return res.status(status).json({ error: message });
  }
}

export async function refreshTokenController(req: Request, res: Response) {
  try {
    const user_id = req.user_id!;
    const refreshToken = req.headers.cookie ? getCookie(req.headers.cookie, COOKIE_REFRESH_TOKEN_KEY) : null;

    const user = await retrieveUser(user_id);

    if (!user || !user.refreshToken)
      return res.sendError("Refresh token not found", 401);

    if (user.refreshToken !== refreshToken)
      return res.sendError("Invalid refresh token", 401);

    const newAccessToken = generateAccessToken(user);

    res.cookie(COOKIE_ACCESS_TOKEN_KEY, newAccessToken, ACCESS_TOKEN_COOKIE_OPTS);

    return res.sendStatus(200);
  } catch (err) {
    return res.sendError(err);
  }
}

export async function logoutUserController(req: Request, res: Response) {
  res.clearCookie(COOKIE_ACCESS_TOKEN_KEY);
  res.clearCookie(COOKIE_REFRESH_TOKEN_KEY);

  try {
    const user_id = req.user_id!;
    await clearRefreshTokenForUser(user_id);

    return res.sendStatus(200);
  } catch (err) {
    return res.sendError(err);
  }
}

export async function retrieveMyUserController(req: Request, res: Response) {
  try {
    const user_id = req.user_id!;
    const user = await retrieveUserSafe(user_id);
    return res.status(200).json(user);
  } catch (err) {
    return res.sendStatus(500);
  }
}

export async function retrieveOtherUserController(req: Request, res: Response) {
  try {
    const user_id = req.params.id!;
    const user = await retrieveUserSafe(user_id);
    return res.status(200).json(user);
  } catch (err) {
    return res.sendStatus(500);
  }
}

export async function retrieveUsersController(req: Request, res: Response) {
  try {
    const users = await retrieveUsersSafe();
    return res.status(200).json(users);
  } catch (err) {
    console.log(err)
    return res.sendStatus(500);
  }
}

export async function addUserController(req: Request, res: Response) {
  try {
    const body = req.body;
    const { first_name, last_name, email, password, phone } = body ?? {};
    if (!first_name || !last_name || !email || !password) {
      return res.sendError("Missing required fields", 400)
    }

    const user = await addUser({ first_name, last_name, email, password, phone });
    return res.status(200).json(user);
  } catch (err) {
    return res.sendStatus(500);
  }
}

export async function updateMyUserController(req: Request, res: Response) {
  try {
    const id = req.user_id!;
    const body = req.body;
    const { first_name, last_name, email, old_password, new_password, phone } = body ?? {};

    const user = await updateUser(id, { first_name, last_name, email, old_password, new_password, phone });
    return res.status(200).json(user);
  } catch (err) {
    return res.sendStatus(500);
  }
}

export async function updateOtherUserController(req: Request, res: Response) {
  try {
    const id = req.params.id!;
    const body = req.body;
    const { first_name, last_name, email, new_password, phone, admin } = body ?? {};

    // bypass_pass_check is true since this is an admin action
    const user = await updateUser(id, { first_name, last_name, email, new_password, phone, admin }, true);
    return res.status(200).json(user);
  } catch (err) {
    return res.sendStatus(500);
  }
}

export async function deleteMyUserController(req: Request, res: Response) {
  try {
    const id = req.user_id!;
    const result = await deleteUser(id);
    return res.status(200).json(result);
  } catch (err) {
    return res.sendStatus(500);
  }
}

export async function deleteOtherUserController(req: Request, res: Response) {
  try {
    const id = req.params.id!;
    const result = await deleteUser(id);
    return res.status(200).json(result);
  } catch (err) {
    return res.sendStatus(500);
  }
}
