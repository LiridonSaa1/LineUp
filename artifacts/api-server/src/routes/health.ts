import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { checkDbConnection } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Ops/monitoring endpoint — exercises the real Supabase connection pool and
// reports its current state. Not part of the OpenAPI contract; intended for
// manual checks and uptime monitors, not the frontend.
router.get("/healthz/db", async (_req, res) => {
  const status = await checkDbConnection();
  res.status(status.connected ? 200 : 503).json(status);
});

export default router;
