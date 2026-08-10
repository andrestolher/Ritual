import { Router } from "express";
import quotes from "../data/quotes.json" with { type: "json" };

const router = Router();
router.get("/quote-of-day", (_req, res) => {
  const start = new Date(Date.UTC(new Date().getFullYear(), 0, 0));
  const day = Math.floor((Date.now() - start.getTime()) / 86_400_000);
  res.json(quotes[day % quotes.length]);
});
export default router;
