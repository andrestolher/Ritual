import { createHash, randomBytes } from "node:crypto";

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function createToken() {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: createHash("sha256").update(raw).digest("hex") };
}

export function publicUser(user) {
  const { passwordHash, verificationTokenHash, verificationExpiresAt, resetTokenHash, resetExpiresAt, ...safe } = user;
  return safe;
}

export function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}
