import { Router } from "express";
import quotes from "../data/quotes.json" with { type: "json" };

const router = Router();
router.get("/quote-of-day", (_req, res) => {
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), 0, 1);
  const day = Math.floor((Date.now() - start) / 86_400_000);
  res.json(quotes[day % quotes.length]);
});
export default router;
