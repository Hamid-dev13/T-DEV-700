import { Router } from "express";
import { isAuth } from "../middleware/isAuth";
import { addLeavePeriodForMyUserController, addLeavePeriodForUserController, deleteLeavePeriodForMyUserController, deleteLeavePeriodForUserController, retrieveLeavePeriodsForMyUserController, retrieveLeavePeriodsForUserController, updateLeavePeriodForUserController } from "../controllers/leave_period.controller";

const router = Router();

router.get("/user/leave_periods", isAuth, retrieveLeavePeriodsForMyUserController);
router.post("/user/leave_periods", isAuth, addLeavePeriodForMyUserController);
router.delete("/user/leave_periods/:id", isAuth, deleteLeavePeriodForMyUserController);

router.get("/users/:id/leave_periods", isAuth, retrieveLeavePeriodsForUserController);
router.post("/users/:id/leave_periods", isAuth, addLeavePeriodForUserController);
router.put("/users/:user_id/leave_periods/:leave_id", isAuth, updateLeavePeriodForUserController);
router.delete("/users/:user_id/leave_periods/:leave_id", isAuth, deleteLeavePeriodForUserController);

export default router;