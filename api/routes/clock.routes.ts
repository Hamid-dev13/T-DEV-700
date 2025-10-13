import { Router } from "express";
import { isAuth } from "../middleware/isAuth";
import { isAdmin } from "../middleware/isAdmin";
import { 
  reportTimeController, 
  retrieveReportTimeSummaryController,
  testDateController  // 👈 AJOUTEZ ICI
} from "../controllers/clock.controller";
import { getDelayController } from "../controllers/attendance.controller"; 

const router = Router();

router.post("/clocks", isAuth, reportTimeController);
router.get("/users/:id/clocks", isAuth, retrieveReportTimeSummaryController);
router.get("/attendance/delay", isAuth, getDelayController); 
router.get("/test-date", testDateController);  // 👈 Pas besoin de isAuth pour le test

export default router;