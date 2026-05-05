import { Router, type IRouter } from "express";
import healthRouter from "./health";
import speakupRouter from "./speakup";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/speakup", speakupRouter);

export default router;
