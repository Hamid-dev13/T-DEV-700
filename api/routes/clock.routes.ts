import { Router } from "express";
import { isAuth } from "../middleware/isAuth";
import { 
  addClockForMemberController,
  deleteClockForMemberController,
  getDaysOffForUserController,
  reportTimeController, 
  retrieveReportTimeSummaryController,
  updateClockForMemberController,

} from "../controllers/clock.controller";

const router = Router();

router.post("/clocks", isAuth, reportTimeController);
router.get("/users/:id/clocks", isAuth, retrieveReportTimeSummaryController);

router.post("/users/:id/clocks", isAuth, addClockForMemberController);
router.patch("/users/:id/clocks", isAuth, updateClockForMemberController);
router.delete("/users/:id/clocks", isAuth, deleteClockForMemberController);

router.get("/users/:id/days-off", isAuth, getDaysOffForUserController);

export default router;