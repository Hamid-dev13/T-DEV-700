import { Router } from "express";
import { isAuth } from "../middleware/isAuth";
import { addLeavePeriodForMyUserController, addLeavePeriodForUserController, deleteLeavePeriodForMyUserController, deleteLeavePeriodForUserController, retrieveLeavePeriodsForMyUserController, retrieveLeavePeriodsForUserController, updateLeavePeriodForUserController } from "../controllers/leave_period.controller";

const router = Router();

router.get("/user/leave-periods", isAuth, retrieveLeavePeriodsForMyUserController);
router.post("/user/leave-periods", isAuth, addLeavePeriodForMyUserController);
router.delete("/user/leave-periods/:id", isAuth, deleteLeavePeriodForMyUserController);

router.get("/users/:id/leave-periods", isAuth, retrieveLeavePeriodsForUserController);
router.post("/users/:id/leave-periods", isAuth, addLeavePeriodForUserController);
router.put("/users/:user_id/leave-periods/:leave_id", isAuth, updateLeavePeriodForUserController);
router.delete("/users/:user_id/leave-periods/:leave_id", isAuth, deleteLeavePeriodForUserController);

export default router;