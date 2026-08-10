import { Router } from "express";
import { createHabit, deleteHabit, habitStats, listHabits, logHabit, updateHabit } from "../controllers/habits.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();
router.use(requireAuth);
router.route("/").get(listHabits).post(createHabit);
router.route("/:id").patch(updateHabit).delete(deleteHabit);
router.post("/:id/log", logHabit);
router.get("/:id/stats", habitStats);
export default router;
