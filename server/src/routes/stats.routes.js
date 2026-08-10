import { Router } from "express";
import { overview } from "../controllers/stats.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();
router.use(requireAuth);
router.get("/overview", overview);
export default router;
