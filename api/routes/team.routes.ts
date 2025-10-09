import { Router } from "express";
import { isAuth } from "../middleware/isAuth";
import { isAdmin } from "../middleware/isAdmin";
import { addTeamController, addTeamUserController, deleteTeamController, removeTeamUserController, retrieveTeamController, retrieveTeamsController, retrieveTeamUsersController, updateTeamController } from "../controllers/team.controller";

const router = Router();

router.get("/teams", isAuth, retrieveTeamsController);
router.get("/teams/:id", isAuth, retrieveTeamController);
router.post("/teams", isAuth, isAdmin, addTeamController);
router.put("/teams/:id", isAuth, updateTeamController);
router.delete("/teams/:id", isAuth, isAdmin, deleteTeamController);

router.get("/teams/:id/users", isAuth, retrieveTeamUsersController);
router.post("/teams/:id/users", isAuth, isAdmin, addTeamUserController);
router.delete("/teams/:id/users", isAuth, isAdmin, removeTeamUserController);

export default router;
