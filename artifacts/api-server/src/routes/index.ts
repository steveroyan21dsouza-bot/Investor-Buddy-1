import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import stocksRouter from "./stocks";
import criteriaRouter from "./criteria";
import screenRouter from "./screen";
import watchlistRouter from "./watchlist";
import analyzeRouter from "./analyze";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/stocks", stocksRouter);
router.use("/criteria", criteriaRouter);
router.use("/screen", screenRouter);
router.use("/watchlist", watchlistRouter);
router.use("/analyze", analyzeRouter);
router.use("/dashboard", dashboardRouter);

export default router;
