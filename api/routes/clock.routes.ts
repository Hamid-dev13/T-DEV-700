import { Router } from "express";
import { isAuth } from "../middleware/isAuth";
import { isAdmin } from "../middleware/isAdmin";
import { reportTimeController, retrieveReportTimeSummaryController } from "../controllers/clock.controller";

const router = Router();

router.post("/clocks", isAuth, reportTimeController);
router.get("/users/:id/clocks", isAuth, retrieveReportTimeSummaryController);

export default router;
