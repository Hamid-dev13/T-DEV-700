import { Router } from "express";
import { isAuth } from "../middleware/isAuth";
import { 
  addClockForMemberController,
  deleteClockForMemberController,
  reportTimeController, 
  retrieveReportTimeSummaryController,
  updateClockForMemberController,

} from "../controllers/clock.controller";
import { getDelayController } from "../controllers/attendance.controller"; 

const router = Router();

router.post("/clocks", isAuth, reportTimeController);
router.get("/users/:id/clocks", isAuth, retrieveReportTimeSummaryController);
router.get("/attendance/delay", isAuth, getDelayController);

router.post("/users/:id/clocks", isAuth, addClockForMemberController);
router.patch("/users/:id/clocks", isAuth, updateClockForMemberController);
router.delete("/users/:id/clocks", isAuth, deleteClockForMemberController);

export default router;