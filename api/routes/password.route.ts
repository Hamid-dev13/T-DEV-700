import { Router } from "express";
import { requestPasswordResetTokenController, resetPasswordController } from "../controllers/password.controller";
import { isMailAvailable } from "../middleware/isMailAvailable";

const router = Router();

router.post("/user/request-password-reset", isMailAvailable, requestPasswordResetTokenController);
router.post("/user/reset-password", resetPasswordController);

export default router;
