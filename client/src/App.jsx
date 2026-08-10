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
  useEffect(() => { (async () => { for (let i = 0; i < 3 && !user; i++) { await load(); if (!user) await new Promise((r) => setTimeout(r, 600)); } })(); }, []);
  useEffect(() => { let active = true; function refresh() { if (document.visibilityState === "visible" && active) load(); } document.addEventListener("visibilitychange", refresh); return () => { active = false; document.removeEventListener("visibilitychange", refresh); }; }, [user]);
  async function createHabit(data) { const habit = await api("/api/habits", { method: "POST", body: data }); setHabits((current) => [...current, { ...habit, todayLog: null }]); }
  async function toggle(habit) { const completed = !habit.todayLog?.completed; const log = await api(`/api/habits/${habit.id}/log`, { method: "POST", body: { date: today(), completed } }); setHabits((current) => current.map((item) => item.id === habit.id ? { ...item, todayLog: log } : item)); }
  async function saveLog(habit, data) { const log = await api(`/api/habits/${habit.id}/log`, { method: "POST", body: { date: today(), ...data } }); setHabits((current) => current.map((item) => item.id === habit.id ? { ...item, todayLog: log } : item)); }
  function handleToggle(habit) { if (habit.unit || habit.goal != null) setRegistering(habit); else toggle(habit); }
  async function removeHabit() { if (!deleting) return; await api(`/api/habits/${deleting.id}`, { method: "DELETE" }); setHabits((current) => current.filter((item) => item.id !== deleting.id)); setDeleting(null); }
  async function logout() { await api("/auth/logout", { method: "POST" }); setUser(null); setHabits([]); }
  if (user === undefined) return <div className="grid min-h-screen place-items-center text-ink/50">Preparando tu espacio...</div>;
  if (!user) return <Login error={error} />;
  if (showOverview) return <Overview onBack={() => setShowOverview(false)} />;
  if (selected) return <HabitDetail habit={selected} onBack={() => { setSelected(null); load(); }} />;
  const completed = habits.filter((habit) => habit.todayLog?.completed).length;
  return <main className="mx-auto min-h-screen max-w-5xl px-5 py-6 sm:px-8 sm:py-10"><header className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-moss">Ritual diario</p><h1 className="mt-1 font-serif text-3xl font-bold">Hola, {user.name.split(" ")[0]}</h1></div><div className="flex items-center gap-2"><Button variant="ghost" onClick={() => setShowOverview(true)} className="gap-2 text-ink/60"><BarChart3 size={16} /><span className="hidden sm:inline">Métricas</span></Button><Button variant="ghost" onClick={logout} className="gap-2 text-ink/60"><LogOut size={16} /><span className="hidden sm:inline">Salir</span></Button></div></header><Card className="relative mt-8 overflow-hidden bg-ink p-6 text-white sm:p-9"><Sparkles className="absolute -right-3 -top-3 text-white/10" size={130} /><p className="text-xs font-bold uppercase tracking-[.18em] text-white/55">Pensamiento de hoy</p><blockquote className="relative mt-3 max-w-2xl font-serif text-2xl leading-snug sm:text-3xl">“{quote?.text}”</blockquote></Card><section className="mt-8 flex items-end justify-between gap-4"><div><h2 className="font-serif text-2xl font-bold">Hoy</h2><p className="mt-1 text-ink/60">{completed}/{habits.length} hábitos completados</p></div><HabitForm habits={habits} onCreated={createHabit} /></section><section className="mt-5 space-y-3">{habits.map((habit) => <HabitRow key={habit.id} habit={habit} onToggle={() => handleToggle(habit)} onOpen={() => setSelected(habit)} onDelete={() => setDeleting(habit)} />)}{!habits.length && <Card className="border-dashed p-10 text-center"><h3 className="font-serif text-xl font-bold">Tu sistema empieza pequeño</h3><p className="mx-auto mt-2 max-w-sm text-sm text-ink/60">Crea el primer hábito que quieres volver automático.</p></Card>}</section>{registering && <RegisterDialog habit={registering} onClose={() => setRegistering(null)} onSaved={(data) => saveLog(registering, data)} />}<DeleteConfirm habit={deleting} onConfirm={removeHabit} onCancel={() => setDeleting(null)} /></main>;
}
function HabitRow({ habit, onToggle, onOpen, onDelete }) { const done = habit.todayLog?.completed; const measured = habit.unit || habit.goal != null; const value = habit.todayLog?.value; const subtitle = habit.stackedAfter ? `Después de ${habit.stackedAfter.name}` : habit.identityStatement || (habit.type === "AVOID" ? "Evitar" : "Construir"); return <Card className="group flex items-center gap-3 p-3 sm:p-4"><button onClick={onToggle} aria-label={done ? "Marcar pendiente" : "Marcar completado"} className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 transition ${done ? "border-moss bg-moss text-white" : "border-ink/15 text-transparent hover:border-moss"}`}>{done ? <Check size={20} strokeWidth={3} /> : <Circle size={18} />}</button><button onClick={onOpen} className="min-w-0 flex-1 text-left"><p className="truncate font-semibold">{habit.name}</p><p className="mt-0.5 truncate text-sm text-ink/50">{subtitle}</p></button>{measured && <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${value != null ? "bg-moss/10 text-moss" : "bg-sand text-ink/50"}`}>{value != null ? `${value} ${habit.unit}` : habit.goal != null ? `Meta ${habit.goal} ${habit.unit}` : "—"}</span>}<span className={`rounded-full px-2.5 py-1 text-xs font-bold ${habit.type === "AVOID" ? "bg-amber-100 text-amber-800" : "bg-moss/10 text-moss"}`}>{habit.type === "AVOID" ? "EVITAR" : "CREAR"}</span>{habit.canDelete && <button onClick={() => onDelete(habit)} className="ml-1 rounded-lg p-2 text-ink/25 transition hover:bg-red-50 hover:text-red-500" aria-label="Eliminar hábito"><Trash2 size={16} /></button>}</Card>; }
function DeleteConfirm({ habit, onConfirm, onCancel }) { if (!habit) return null; return <Dialog.Root open onOpenChange={onCancel}><DialogContent><Dialog.Title className="font-serif text-xl font-bold">Eliminar hábito</Dialog.Title><Dialog.Description className="mt-2 text-ink/60">¿Estás seguro de eliminar <strong>{habit.name}</strong>? También se borrará todo su historial de cumplimiento.</Dialog.Description><div className="mt-6 flex gap-3"><Button variant="ghost" onClick={onCancel} className="flex-1">Cancelar</Button><Button variant="danger" onClick={onConfirm} className="flex-1">Eliminar</Button></div></DialogContent></Dialog.Root>; }
function Login({ error }) { return <main className="grid min-h-screen place-items-center p-5"><Card className="w-full max-w-md p-8 sm:p-10"><p className="text-xs font-bold uppercase tracking-[.2em] text-moss">Ritual diario</p><h1 className="mt-3 font-serif text-4xl font-bold">Cambia con gestos que caben en tu día.</h1><p className="mt-4 leading-relaxed text-ink/65">Construye sistemas personales, encadena buenas decisiones y observa tu progreso con calma.</p>{error && <p className="mt-4 text-sm text-red-600">{error}</p>}<a href={`${API}/auth/google`} className="mt-8 flex w-full items-center justify-center rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-moss">Continuar con Google</a></Card></main>; }
