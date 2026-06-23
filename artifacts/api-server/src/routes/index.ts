import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import barbershopsRouter from "./barbershops";
import barbersRouter from "./barbers";
import servicesRouter from "./services";
import appointmentsRouter from "./appointments";
import productsRouter from "./products";
import ordersRouter from "./orders";
import paymentsRouter from "./payments";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(barbershopsRouter);
router.use(barbersRouter);
router.use(servicesRouter);
router.use(appointmentsRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(paymentsRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);

export default router;
