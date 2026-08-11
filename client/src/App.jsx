import { useEffect, useState } from "react";
import { Check, Circle, LogOut, Sparkles, Trash2, BarChart3 } from "lucide-react";
import { API, api } from "./api";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Dialog, DialogContent } from "./components/ui/dialog";
import { HabitForm } from "./components/HabitForm";
import { HabitDetail } from "./components/HabitDetail";
import { RegisterDialog } from "./components/RegisterDialog";
import { Overview } from "./components/Overview";

const today = () => new Date().toISOString().slice(0, 10);
export default function App() {
  const [user, setUser] = useState(undefined); const [habits, setHabits] = useState([]); const [quote, setQuote] = useState(null); const [selected, setSelected] = useState(null); const [registering, setRegistering] = useState(null); const [showOverview, setShowOverview] = useState(false); const [error, setError] = useState(""); const [deleting, setDeleting] = useState(null);
  async function load() {
    try {
      const me = await api("/auth/me");
      setUser(me.user);
      if (me.user) {
        const [list, dailyQuote] = await Promise.all([api("/api/habits"), api("/api/quote-of-day")]);
        setHabits(list); setQuote(dailyQuote); setError("");
      }
    } catch (err) {
      if (!user) { setError(err.message); setUser(null); }
    }
  }
  async function refreshHabits() {
    const list = await api("/api/habits");
    setHabits(list);
    return list;
  }
  useEffect(() => { (async () => { for (let i = 0; i < 3 && !user; i++) { await load(); if (!user) await new Promise((r) => setTimeout(r, 600)); } })(); }, []);
  useEffect(() => { let active = true; function refresh() { if (document.visibilityState === "visible" && active) load(); } document.addEventListener("visibilitychange", refresh); return () => { active = false; document.removeEventListener("visibilitychange", refresh); }; }, [user]);
  useEffect(() => {
    if (!user) return;
    async function syncLocation() {
      const [view, id] = window.location.hash.slice(1).split("=");
      if (view === "overview") { setSelected(null); setShowOverview(true); return; }
      if (view === "habit" && id) {
        try {
          const list = await refreshHabits();
          setShowOverview(false);
          setSelected(list.find((habit) => habit.id === decodeURIComponent(id)) || null);
        } catch (error) { setError(error.message); }
        return;
      }
      setShowOverview(false);
      setSelected(null);
      await refreshHabits();
    }
    window.addEventListener("popstate", syncLocation);
    if (window.location.hash) syncLocation();
    return () => window.removeEventListener("popstate", syncLocation);
  }, [user]);
  async function createHabit(data) { const habit = await api("/api/habits", { method: "POST", body: data }); setHabits((current) => [...current, { ...habit, todayLog: null }]); }
  async function toggle(habit) { const completed = !habit.todayLog?.completed; const log = await api(`/api/habits/${habit.id}/log`, { method: "POST", body: { date: today(), completed } }); setHabits((current) => current.map((item) => item.id === habit.id ? { ...item, todayLog: log } : item)); }
  async function saveLog(habit, data) { const log = await api(`/api/habits/${habit.id}/log`, { method: "POST", body: { date: today(), ...data } }); setHabits((current) => current.map((item) => item.id === habit.id ? { ...item, todayLog: log } : item)); }
  function handleToggle(habit) { if (habit.unit || habit.goal != null) setRegistering(habit); else toggle(habit); }
  async function openHabit(habit) { try { const list = await refreshHabits(); window.history.pushState({ view: "habit", id: habit.id }, "", `#habit=${encodeURIComponent(habit.id)}`); setSelected(list.find((item) => item.id === habit.id) || null); } catch (error) { setError(error.message); } }
  function openOverview() { window.history.pushState({ view: "overview" }, "", "#overview"); setSelected(null); setShowOverview(true); }
  function goBack() { window.history.back(); }
  async function removeHabit() { if (!deleting) return; await api(`/api/habits/${deleting.id}`, { method: "DELETE" }); setHabits((current) => current.filter((item) => item.id !== deleting.id)); setDeleting(null); }
  async function logout() { await api("/auth/logout", { method: "POST" }); setUser(null); setHabits([]); }
  if (user === undefined) return <div className="grid min-h-screen place-items-center text-ink/50">Preparando tu espacio...</div>;
  if (!user) return <Login error={error} />;
  if (showOverview) return <Overview onBack={goBack} />;
  if (selected) return <HabitDetail habit={selected} onBack={goBack} />;
  const completed = habits.filter((habit) => habit.todayLog?.completed).length;
  return <main className="mx-auto min-h-screen max-w-5xl px-5 py-6 sm:px-8 sm:py-10"><header className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-moss">Ritual diario</p><h1 className="mt-1 font-serif text-3xl font-bold">Hola, {user.name.split(" ")[0]}</h1></div><div className="flex items-center gap-2"><Button variant="ghost" onClick={openOverview} className="gap-2 text-ink/60"><BarChart3 size={16} /><span className="hidden sm:inline">Métricas</span></Button><Button variant="ghost" onClick={logout} className="gap-2 text-ink/60"><LogOut size={16} /><span className="hidden sm:inline">Salir</span></Button></div></header><Card className="relative mt-8 overflow-hidden bg-ink p-6 text-white sm:p-9"><Sparkles className="absolute -right-3 -top-3 text-white/10" size={130} /><p className="text-xs font-bold uppercase tracking-[.18em] text-white/55">Pensamiento de hoy</p><blockquote className="relative mt-3 max-w-2xl font-serif text-2xl leading-snug sm:text-3xl">“{quote?.text}”</blockquote></Card><section className="mt-8 flex items-end justify-between gap-4"><div><h2 className="font-serif text-2xl font-bold">Hoy</h2><p className="mt-1 text-ink/60">{completed}/{habits.length} hábitos completados</p></div><HabitForm habits={habits} onCreated={createHabit} /></section><section className="mt-5 space-y-3">{habits.map((habit) => <HabitRow key={habit.id} habit={habit} onToggle={() => handleToggle(habit)} onOpen={() => openHabit(habit)} onDelete={() => setDeleting(habit)} />)}{!habits.length && <Card className="border-dashed p-10 text-center"><h3 className="font-serif text-xl font-bold">Tu sistema empieza pequeño</h3><p className="mx-auto mt-2 max-w-sm text-sm text-ink/60">Crea el primer hábito que quieres volver automático.</p></Card>}</section>{registering && <RegisterDialog habit={registering} onClose={() => setRegistering(null)} onSaved={(data) => saveLog(registering, data)} />}<DeleteConfirm habit={deleting} onConfirm={removeHabit} onCancel={() => setDeleting(null)} /></main>;
}
function HabitRow({ habit, onToggle, onOpen, onDelete }) { const done = habit.todayLog?.completed; const measured = habit.unit || habit.goal != null; const value = habit.todayLog?.value; const subtitle = habit.stackedAfter ? `Después de ${habit.stackedAfter.name}` : habit.identityStatement || (habit.type === "AVOID" ? "Evitar" : "Construir"); return <Card className="group flex items-center gap-3 p-3 sm:p-4"><button onClick={onToggle} aria-label={done ? "Marcar pendiente" : "Marcar completado"} className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 transition ${done ? "border-moss bg-moss text-white" : "border-ink/15 text-transparent hover:border-moss"}`}>{done ? <Check size={20} strokeWidth={3} /> : <Circle size={18} />}</button><button onClick={onOpen} className="min-w-0 flex-1 text-left"><p className="truncate font-semibold">{habit.name}</p><p className="mt-0.5 truncate text-sm text-ink/50">{subtitle}</p></button>{measured && <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${value != null ? "bg-moss/10 text-moss" : "bg-sand text-ink/50"}`}>{value != null ? `${value} ${habit.unit}` : habit.goal != null ? `Meta ${habit.goal} ${habit.unit}` : "—"}</span>}<span className={`rounded-full px-2.5 py-1 text-xs font-bold ${habit.type === "AVOID" ? "bg-amber-100 text-amber-800" : "bg-moss/10 text-moss"}`}>{habit.type === "AVOID" ? "EVITAR" : "CREAR"}</span>{habit.canDelete && <button onClick={() => onDelete(habit)} className="ml-1 rounded-lg p-2 text-ink/25 transition hover:bg-red-50 hover:text-red-500" aria-label="Eliminar hábito"><Trash2 size={16} /></button>}</Card>; }
function DeleteConfirm({ habit, onConfirm, onCancel }) { if (!habit) return null; return <Dialog.Root open onOpenChange={onCancel}><DialogContent><Dialog.Title className="font-serif text-xl font-bold">Eliminar hábito</Dialog.Title><Dialog.Description className="mt-2 text-ink/60">¿Estás seguro de eliminar <strong>{habit.name}</strong>? También se borrará todo su historial de cumplimiento.</Dialog.Description><div className="mt-6 flex gap-3"><Button variant="ghost" onClick={onCancel} className="flex-1">Cancelar</Button><Button variant="danger" onClick={onConfirm} className="flex-1">Eliminar</Button></div></DialogContent></Dialog.Root>; }
function GoogleIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M21.35 12.27c0-.72-.06-1.24-.2-1.78H12v3.37h5.37a4.59 4.59 0 0 1-1.99 3.01v2.5h3.22c1.88-1.73 2.75-4.28 2.75-7.1Z"/><path fill="#34A853" d="M12 21.99c2.7 0 4.96-.89 6.61-2.42l-3.22-2.5c-.89.6-2.03.96-3.39.96-2.61 0-4.82-1.77-5.61-4.15H3.06v2.58A9.98 9.98 0 0 0 12 21.99Z"/><path fill="#FBBC05" d="M6.39 13.88a6 6 0 0 1 0-3.76V7.54H3.06a10 10 0 0 0 0 8.92l3.33-2.58Z"/><path fill="#EA4335" d="M12 5.97c1.47 0 2.79.5 3.83 1.49l2.87-2.87C16.95 2.98 14.7 2 12 2a9.98 9.98 0 0 0-8.94 5.54l3.33 2.58C7.18 7.74 9.39 5.97 12 5.97Z"/></svg>; }
function Login({ error }) {
  const params = new URLSearchParams(window.location.search);
  const [mode, setMode] = useState(params.has("reset") ? "reset" : "login");
  const [message, setMessage] = useState(params.get("verified") ? "Correo verificado. Ya puedes entrar." : "");
  const [formError, setFormError] = useState(error || "");
  const [saving, setSaving] = useState(false);
  async function submit(event) {
    event.preventDefault(); setSaving(true); setFormError(""); setMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (mode === "reset") {
        await api("/auth/reset-password", { method: "POST", body: data });
        window.history.replaceState({}, "", window.location.pathname);
        setMode("login"); setMessage("Contraseña actualizada. Ya puedes entrar.");
      } else if (mode === "register") {
        if (data.password !== data.confirmPassword) throw new Error("Las contraseñas no coinciden");
        const result = await api("/auth/register", { method: "POST", body: data });
        setMessage(result.message); setMode("login");
      } else if (mode === "forgot") {
        const result = await api("/auth/forgot-password", { method: "POST", body: data });
        setMessage(result.message);
      } else {
        await api("/auth/login", { method: "POST", body: data });
        window.location.reload();
      }
    } catch (requestError) { setFormError(requestError.message); } finally { setSaving(false); }
  }
  const title = mode === "register" ? "Crea tu espacio" : mode === "forgot" ? "Recupera tu acceso" : mode === "reset" ? "Nueva contraseña" : "Vuelve a tu ritual";
  return <main className="grid min-h-screen place-items-center bg-paper p-5"><Card className="w-full max-w-md border-ink/10 p-8 shadow-xl shadow-ink/5 sm:p-10"><p className="text-xs font-bold uppercase tracking-[.2em] text-moss">Ritual diario</p><h1 className="mt-3 font-serif text-4xl font-bold">{title}</h1><p className="mt-4 leading-relaxed text-ink/65">Construye sistemas personales, encadena buenas decisiones y observa tu progreso con calma.</p>{message && <p className="mt-4 rounded-lg bg-moss/10 px-3 py-2 text-sm text-moss">{message}</p>}{formError && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}{mode !== "reset" && <><div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-[.16em] text-ink/35"><span className="h-px flex-1 bg-ink/10" />o<span className="h-px flex-1 bg-ink/10" /></div><a href={`${API}/auth/google`} className="mt-4 flex w-full items-center justify-center gap-3 rounded-lg border border-ink/15 bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-ink/[.03]"><GoogleIcon />Continuar con Google</a></>}<form onSubmit={submit} className="mt-5 space-y-3">{mode === "register" && <label className="block text-sm font-semibold">Nombre<input required name="name" autoComplete="name" className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5" /></label>}{mode !== "reset" && <label className="block text-sm font-semibold">Correo<input required type="email" name="email" autoComplete="email" className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5" /></label>}{mode === "reset" && <input type="hidden" name="token" value={params.get("reset") || ""} />}{mode !== "forgot" && <label className="block text-sm font-semibold">Contraseña<input required type="password" name="password" minLength="8" autoComplete={mode === "register" ? "new-password" : "current-password"} className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5" /></label>}{mode === "register" && <label className="block text-sm font-semibold">Repite la contraseña<input required type="password" name="confirmPassword" minLength="8" autoComplete="new-password" className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5" /></label>}<Button disabled={saving} className="w-full">{saving ? "Procesando..." : mode === "register" ? "Crear cuenta" : mode === "forgot" ? "Enviar instrucciones" : mode === "reset" ? "Guardar contraseña" : "Entrar"}</Button></form><div className="mt-5 grid gap-2 sm:grid-cols-2">{mode !== "login" && <button type="button" onClick={() => { setMode("login"); setFormError(""); }} className="rounded-lg border border-ink/10 px-3 py-2 text-sm font-semibold text-ink/60 transition hover:border-ink/25 hover:bg-ink/[.03]">Iniciar sesión</button>}{mode === "login" && <button type="button" onClick={() => setMode("register")} className="rounded-lg border border-moss/30 bg-moss/5 px-3 py-2 text-sm font-semibold text-moss transition hover:bg-moss/10">Crear cuenta</button>}{mode === "login" && <button type="button" onClick={() => setMode("forgot")} className="rounded-lg border border-ink/10 px-3 py-2 text-sm font-semibold text-ink/60 transition hover:border-ink/25 hover:bg-ink/[.03]">Olvidé mi contraseña</button>}</div></Card></main>;
}
