import { Router } from "express";
import passport from "passport";

const router = Router();
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { failureRedirect: `${process.env.CLIENT_URL}/?auth=failed` }), (_req, res) => res.redirect(process.env.CLIENT_URL));
router.post("/logout", (req, res, next) => req.logout((error) => error ? next(error) : req.session.destroy(() => res.status(204).end())));
router.get("/me", (req, res) => res.json({ user: req.user || null }));
export default router;
