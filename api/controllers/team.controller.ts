import { Request, Response } from "express";
import { addTeam, deleteTeam, isTeamManager, retrieveTeam, retrieveTeams, updateTeam } from "../services/team.service";

export async function retrieveTeamController(req: Request, res: Response) {
  try {
    const team_id = req.params.id!;
    const team = await retrieveTeam(team_id);
    return res.status(200).json(team);
  } catch (err) {
    console.log(err)
    return res.sendStatus(500);
  }
}

export async function retrieveTeamsController(req: Request, res: Response) {
  try {
    const teams = await retrieveTeams();
    return res.status(200).json(teams);
  } catch (err) {
    console.log(err)
    return res.sendStatus(500);
  }
}

export async function addTeamController(req: Request, res: Response) {
  try {
    const body = req.body as any;
    const { name, description, start_hour, end_hour, manager } = body ?? {};
    if (!name || !description || !start_hour || !end_hour)
      return res.status(400).json({ error: "Missing required fields" });
    if (start_hour > end_hour)
        return res.sendStatus(400);

    const team = await addTeam({ name, description, start_hour, end_hour, manager_id: manager });
    return res.status(200).json(team);
  } catch (err) {
    return res.sendStatus(500);
  }
}

export async function updateTeamController(req: Request, res: Response) {
  try {
    const team_id = req.params.id!;
    const user_id = req.user_id!;
    const is_admin = req.admin!;
    const body = req.body as any;
    const { name, description, start_hour, end_hour } = body ?? {};

    if (is_admin || await isTeamManager(user_id, team_id)) {
      const team = await updateTeam(team_id, { name, description, start_hour, end_hour });
      return res.status(200).json(team);
    } else {
      return res.status(401).json({ error: "Insufficient permissions" });
    }
  } catch (err) {
    return res.sendStatus(500);
  }
}

export async function deleteTeamController(req: Request, res: Response) {
  try {
    const team_id = req.params.id!;
    await deleteTeam(team_id);
    return res.sendStatus(200);
  } catch (err) {
    return res.sendStatus(500);
  }
}

export async function retrieveTeamUsersController(req: Request, res: Response) {
  try {
    const team_id = req.params.id!;

    // const users = await retrieveTeamUsers(team_id);
    
    // return res.status(200).json(users);
    return res.status(200).json();
  } catch (err) {
    return res.sendStatus(500);
  }
}

export async function addTeamUserController(req: Request, res: Response) {
  try {
    const team_id = req.params.id!;
    
    return res.status(200).json();
  } catch (err) {
    return res.sendStatus(500);
  }
}

export async function removeTeamUserController(req: Request, res: Response) {
  try {
    const team_id = req.params.id!;
    
    return res.status(200).json();
  } catch (err) {
    return res.sendStatus(500);
  }
}
