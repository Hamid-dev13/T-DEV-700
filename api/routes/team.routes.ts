import { Router } from "express";
import { isAuth } from "../middleware/isAuth";
import { isAdmin } from "../middleware/isAdmin";
import { addTeamController, addTeamMemberController, deleteTeamController, removeTeamMemberController, retrieveMyTeamsController, retrieveTeamController, retrieveTeamsController, retrieveTeamUsersController, retrieveUserTeamsController, updateTeamController } from "../controllers/team.controller";

const router = Router();

router.get("/teams", isAuth, retrieveTeamsController);
router.get("/teams/:id", isAuth, retrieveTeamController);
router.post("/teams", isAuth, isAdmin, addTeamController);
router.put("/teams/:id", isAuth, updateTeamController);
router.delete("/teams/:id", isAuth, isAdmin, deleteTeamController);

router.get("/teams/:id/users", isAuth, retrieveTeamUsersController);
router.post("/teams/:id/users", isAuth, isAdmin, addTeamMemberController);
router.delete("/teams/:id/users", isAuth, isAdmin, removeTeamMemberController);

router.get("/user/teams", isAuth, retrieveMyTeamsController);
router.get("/users/:id/teams", isAuth, retrieveUserTeamsController);

export default router;
