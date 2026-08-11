import { Resend } from "resend";

function client() {
  if (!process.env.RESEND_API_KEY) {
    const error = new Error("El servicio de correo no está configurado");
    error.statusCode = 503;
    throw error;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

const from = () => process.env.EMAIL_FROM || "Ritual <no-reply@ritual.andrestolher.com>";
const appUrl = () => process.env.APP_URL || process.env.CLIENT_URL || "http://localhost:5173";

export async function sendVerificationEmail(email, name, token) {
  const url = `${appUrl()}/auth/verify?token=${encodeURIComponent(token)}`;
  await client().emails.send({
    from: from(),
    to: email,
    subject: "Verifica tu correo en Ritual",
    html: `<p>Hola ${escapeHtml(name)},</p><p>Confirma tu correo para comenzar a usar Ritual:</p><p><a href="${url}">Verificar mi correo</a></p><p>Este enlace caduca en 24 horas.</p>`
  });
}

export async function sendResetEmail(email, name, token) {
  const url = `${appUrl()}/?reset=${encodeURIComponent(token)}`;
  await client().emails.send({
    from: from(),
    to: email,
    subject: "Restablece tu contraseña de Ritual",
    html: `<p>Hola ${escapeHtml(name)},</p><p>Solicitaste cambiar tu contraseña:</p><p><a href="${url}">Crear nueva contraseña</a></p><p>Este enlace caduca en una hora. Si no lo solicitaste, ignora este mensaje.</p>`
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}
