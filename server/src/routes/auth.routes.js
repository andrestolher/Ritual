import { Router } from "express";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import passport from "passport";
import prisma from "../prisma/client.js";
import { createToken, normalizeEmail, publicUser, validationError } from "../auth.js";
import { isEmailConfigured, sendResetEmail, sendVerificationEmail } from "../services/email.js";

const router = Router();
const CLIENT_URL = () => process.env.CLIENT_URL || "http://localhost:5173";
const tokenExpiry = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000);

router.post("/register", async (req, res, next) => {
  try {
    if (!isEmailConfigured()) { const error = new Error("El servicio de correo no está configurado"); error.statusCode = 503; throw error; }
    const email = normalizeEmail(req.body.email);
    const name = String(req.body.name || "").trim();
    const password = String(req.body.password || "");
    if (!/^\S+@\S+\.\S+$/.test(email) || !name) throw validationError("Nombre y correo válidos son obligatorios");
    if (password.length < 8) throw validationError("La contraseña debe tener al menos 8 caracteres");
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.googleId && !existing.passwordHash) throw validationError("Esta cuenta ya usa Google. Entra con Google para vincularla.");
    if (existing?.emailVerified) throw validationError("Ya existe una cuenta con este correo");
    const token = createToken();
    const data = { name, passwordHash: await bcrypt.hash(password, 12), emailVerified: false, verificationTokenHash: token.hash, verificationExpiresAt: tokenExpiry(24) };
    const user = existing ? await prisma.user.update({ where: { id: existing.id }, data }) : await prisma.user.create({ data: { ...data, email } });
    await sendVerificationEmail(user.email, user.name, token.raw);
    res.status(202).json({ message: "Te enviamos un enlace para verificar tu correo" });
  } catch (error) { next(error); }
});

router.get("/verify", async (req, res) => {
  const hash = req.query.token ? createHash("sha256").update(String(req.query.token)).digest("hex") : "";
  const user = hash ? await prisma.user.findFirst({ where: { verificationTokenHash: hash } }) : null;
  if (!user || !user.verificationExpiresAt || user.verificationExpiresAt < new Date()) return res.redirect(`${CLIENT_URL()}/?auth=verification-failed`);
  const verified = await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, verificationTokenHash: null, verificationExpiresAt: null } });
  req.login(verified, (error) => error ? res.redirect(`${CLIENT_URL()}/?auth=verification-failed`) : res.redirect(`${CLIENT_URL()}/?verified=1`));
});

router.post("/login", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash || !(await bcrypt.compare(String(req.body.password || ""), user.passwordHash))) throw validationError("Correo o contraseña incorrectos");
    if (!user.emailVerified) throw validationError("Verifica tu correo antes de iniciar sesión");
    req.login(user, (error) => error ? next(error) : res.json({ user: publicUser(user) }));
  } catch (error) { next(error); }
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    if (!isEmailConfigured()) { const error = new Error("El servicio de correo no está configurado"); error.statusCode = 503; throw error; }
    const email = normalizeEmail(req.body.email);
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.passwordHash && user.emailVerified) {
      const token = createToken();
      await prisma.user.update({ where: { id: user.id }, data: { resetTokenHash: token.hash, resetExpiresAt: tokenExpiry(1) } });
      await sendResetEmail(user.email, user.name, token.raw);
    }
    res.json({ message: "Si existe una cuenta verificable, recibirás instrucciones por correo" });
  } catch (error) { next(error); }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const token = String(req.body.token || "");
    const password = String(req.body.password || "");
    if (password.length < 8) throw validationError("La contraseña debe tener al menos 8 caracteres");
    const hash = createHash("sha256").update(token).digest("hex");
    const user = await prisma.user.findFirst({ where: { resetTokenHash: hash } });
    if (!user || !user.resetExpiresAt || user.resetExpiresAt < new Date()) throw validationError("El enlace de recuperación no es válido o expiró");
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 12), resetTokenHash: null, resetExpiresAt: null } });
    res.json({ message: "Contraseña actualizada" });
  } catch (error) { next(error); }
});

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { failureRedirect: `${CLIENT_URL()}/?auth=failed` }), (_req, res) => res.redirect(CLIENT_URL()));
router.post("/logout", (req, res, next) => req.logout((error) => error ? next(error) : req.session.destroy(() => res.status(204).end())));
router.get("/me", (req, res) => res.json({ user: req.user ? publicUser(req.user) : null }));
export default router;
