import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import zonesRouter from "./zones";
import coordinatorsRouter from "./coordinators";
import trainersRouter from "./trainers";
import studentsRouter from "./students";
import coursesRouter from "./courses";
import locationsRouter from "./locations";
import progressRouter from "./progress";
import dashboardRouter from "./dashboard";
import auditLogsRouter from "./audit-logs";
import progressHistoryRouter from "./progress-history";

// Ensure Firestore is initialized on startup
import "@workspace/firestore";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(zonesRouter);
router.use(coordinatorsRouter);
router.use(trainersRouter);
router.use(studentsRouter);
router.use(coursesRouter);
router.use(locationsRouter);
router.use(progressRouter);
router.use(dashboardRouter);
router.use(auditLogsRouter);
router.use(progressHistoryRouter);

export default router;
