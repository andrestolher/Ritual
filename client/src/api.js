const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
export async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { credentials: "include", headers: { "Content-Type": "application/json", ...options.headers }, ...options, body: options.body && JSON.stringify(options.body) });
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error || "No se pudo completar la acción"); }
  return response.status === 204 ? null : response.json();
}
export { API };
