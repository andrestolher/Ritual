import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./prisma/client.js";
import authRoutes from "./routes/auth.routes.js";
import habitRoutes from "./routes/habits.routes.js";
import quoteRoutes from "./routes/quotes.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET || "development-secret", resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" } }));
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => { try { done(null, await prisma.user.findUnique({ where: { id } })); } catch (error) { done(error); } });
passport.use(new GoogleStrategy({ clientID: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET, callbackURL: process.env.GOOGLE_CALLBACK_URL }, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error("Google no proporcionó un correo electrónico"));
    const user = await prisma.user.upsert({ where: { googleId: profile.id }, update: { email, name: profile.displayName || email }, create: { googleId: profile.id, email, name: profile.displayName || email } });
    done(null, user);
  } catch (error) { done(error); }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use("/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api", quoteRoutes);

if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, "..", "..", "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => { res.sendFile(path.join(distPath, "index.html")); });
}

app.use((error, _req, res, _next) => { console.error(error); res.status(error.message?.includes("cadena") || error.message?.includes("seleccionado") ? 400 : 500).json({ error: error.message || "Error interno" }); });
app.listen(process.env.PORT || 4000, () => console.log(`API ready on port ${process.env.PORT || 4000}`));
