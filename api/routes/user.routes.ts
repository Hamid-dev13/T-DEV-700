import { Router } from "express";
import { addUserController, loginUserController, retrieveUsersController, updateMyUserController, updateOtherUserController, deleteMyUserController, deleteOtherUserController, retrieveMyUserController, retrieveOtherUserController, retrieveUserTeamController } from "../controllers/user.controller";
import { isAuth } from "../middleware/isAuth";
import { isAdmin } from "../middleware/isAdmin";

const router = Router();

router.post("/user/login", loginUserController);

router.get("/user", isAuth, retrieveMyUserController);
// IMPORTANT: /users/team doit être AVANT /users/:id pour éviter que "team" soit interprété comme un ID
router.get("/users/team", isAuth, retrieveUserTeamController);
router.get("/users/:id", isAuth, retrieveOtherUserController);
router.get("/users", isAuth, retrieveUsersController);
router.post("/users", isAuth, isAdmin, addUserController);
router.put("/user", isAuth, updateMyUserController);
router.delete("/user", isAuth, deleteMyUserController);
router.put("/users/:id", isAuth, isAdmin, updateOtherUserController);
router.delete("/users/:id", isAuth, isAdmin, deleteOtherUserController);

export default router;
