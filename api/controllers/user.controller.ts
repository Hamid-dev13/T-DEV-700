import { Request, Response } from "express";
import { addUser, deleteUser, loginUser, retrieveUser, retrieveUsers, updateUser } from "../services/user.service";
import { sendError } from "../utils/format";
import { retreiveTeamsForUserWithManager } from "../services/team.service";

export async function loginUserController(req: Request, res: Response) {
  try {
    console.log('[LOGIN] Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('[LOGIN] Request body:', JSON.stringify(req.body, null, 2));

    const body = req.body;
    const { email, password } = body ?? {};

    console.log('[LOGIN] Extracted email:', email);
    console.log('[LOGIN] Password provided:', !!password);
    console.log('[LOGIN] Password length:', password?.length);

    if (!email || !password) {
      console.log('[LOGIN] Missing fields - email:', !!email, 'password:', !!password);
      return sendError(res, "Missing required fields", 400)
    }

    console.log('[LOGIN] Attempting to authenticate user:', email);
    const { token, user } = await loginUser({ email, password });
    console.log('[LOGIN] Authentication successful for:', email);

    return res.status(200)
      .cookie("token", token, {
        httpOnly: true,
        secure: true, // Must be true for sameSite: 'none'
        sameSite: 'none', // Required for cross-origin cookies
        maxAge: 24 * 60 * 60 * 1000 // 24 heures
      })
      .json(user);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("Invalid credentials") ? 401 : 500;
    console.log('[LOGIN] Authentication failed:', message);
    return res.status(status).json({ error: message });
  }
}

export async function retrieveMyUserController(req: Request, res: Response) {
  try {
    const user_id = req.user_id!;
    const user = await retrieveUser(user_id);
    return res.status(200).json(user);
  } catch (err) {
    return res.sendStatus(500);
  }
}

export async function retrieveOtherUserController(req: Request, res: Response) {
  try {
    const user_id = req.params.id!;
    const user = await retrieveUser(user_id);
    return res.status(200).json(user);
  } catch (err) {
    return res.sendStatus(500);
  }
}

export async function retrieveUsersController(req: Request, res: Response) {
  try {
    const users = await retrieveUsers();
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
      return sendError(res, "Missing required fields", 400)
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
    const { first_name, last_name, email, password, phone } = body ?? {};
    console.log(first_name, last_name, email, password, phone)
    const user = await updateUser(id, { first_name, last_name, email, password, phone });
    return res.status(200).json(user);
  } catch (err) {
    return res.sendStatus(500);
  }
}

export async function updateOtherUserController(req: Request, res: Response) {
  try {
    const id = req.params.id!;
    const body = req.body;
    const { first_name, last_name, email, password, phone } = body ?? {};

    const user = await updateUser(id, { first_name, last_name, email, password, phone });
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
