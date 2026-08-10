export function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "No autenticado" });
  next();
}
