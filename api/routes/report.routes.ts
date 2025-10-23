import { Router } from "express";
import { isAuth } from "../middleware/isAuth";
import { getReportsForUserController } from "../controllers/report.controller";

const router = Router();

router.get("/reports", isAuth, getReportsForUserController);
 
export default router;