import { Router, type IRouter } from "express";
import healthRouter from "./health";
import departmentsRouter from "./departments";
import usersRouter from "./users";
import rolesRouter from "./roles";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(departmentsRouter);
router.use(usersRouter);
router.use(rolesRouter);
router.use(dashboardRouter);

export default router;
