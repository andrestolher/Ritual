import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./prisma/client.js";
import authRoutes from "./routes/auth.routes.js";
import habitRoutes from "./routes/habits.routes.js";
import quoteRoutes from "./routes/quotes.routes.js";
import statsRoutes from "./routes/stats.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const pgPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const PgSession = connectPgSimple(session);
app.set("trust proxy", 1);
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use((req, res, next) => { if (req.path.startsWith("/api/") || req.path.startsWith("/auth")) res.set("Cache-Control", "no-store, no-cache, must-revalidate"); next(); });
app.use(session({ secret: process.env.SESSION_SECRET || "development-secret", resave: false, saveUninitialized: false, store: new PgSession({ pool: pgPool, tableName: "Session", createTableIfMissing: true }), cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 1000 * 60 * 60 * 24 * 30 } }));
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => { try { done(null, await prisma.user.findUnique({ where: { id } })); } catch (error) { done(error); } });
passport.use(new GoogleStrategy({ clientID: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET, callbackURL: process.env.GOOGLE_CALLBACK_URL }, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error("Google no proporcionó un correo electrónico"));
    if (profile._json?.email_verified === false) return done(new Error("Google no verificó este correo electrónico"));
    let user = await prisma.user.findUnique({ where: { googleId: profile.id } });
    if (!user) {
      const byEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      user = byEmail
        ? await prisma.user.update({ where: { id: byEmail.id }, data: { googleId: profile.id, emailVerified: true, name: byEmail.name || profile.displayName || email } })
        : await prisma.user.create({ data: { googleId: profile.id, email: email.toLowerCase(), name: profile.displayName || email, emailVerified: true } });
    } else if (user.email !== email.toLowerCase()) {
      user = await prisma.user.update({ where: { id: user.id }, data: { email: email.toLowerCase(), emailVerified: true, name: profile.displayName || user.name } });
    }
    done(null, user);
  } catch (error) { done(error); }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use("/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api", quoteRoutes);
app.use("/api/stats", statsRoutes);

if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, "..", "..", "dist");
  app.get("/sw.js", (_req, res) => { res.set("Cache-Control", "no-store, no-cache, must-revalidate"); res.sendFile(path.join(distPath, "sw.js")); });
  app.use(express.static(distPath, { setHeaders: (res, filePath) => { if (filePath.endsWith("index.html") || filePath.endsWith("manifest.json")) res.set("Cache-Control", "no-store, no-cache, must-revalidate"); } }));
  app.get("*", (_req, res) => { res.set("Cache-Control", "no-store, no-cache, must-revalidate"); res.sendFile(path.join(distPath, "index.html")); });
}

app.use((error, _req, res, _next) => { console.error(error); const status = error.statusCode || (error.message?.includes("cadena") || error.message?.includes("seleccionado") ? 400 : 500); res.status(status).json({ error: error.message || "Error interno" }); });
app.listen(process.env.PORT || 4000, () => console.log(`API ready on port ${process.env.PORT || 4000}`));
