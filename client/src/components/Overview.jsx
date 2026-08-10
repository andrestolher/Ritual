import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Flame, Trophy } from "lucide-react";
import { api } from "../api";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const PERIODS = [
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year", label: "Año" }
];

export function Overview({ onBack }) {
  const [period, setPeriod] = useState("week");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setData(null);
    api(`/api/stats/overview?period=${period}&offset=${offset}`).then((result) => { if (active) { setData(result); setError(""); } }).catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [period, offset]);
  return <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8"><Button variant="ghost" onClick={onBack} className="mb-6 -ml-3 gap-2"><ArrowLeft size={16} />Todos los hábitos</Button><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-moss">Ritual diario</p><h1 className="mt-1 font-serif text-3xl font-bold">Métricas generales</h1></div><div className="flex items-center gap-2"><div className="flex rounded-lg border border-ink/15 bg-white p-1">{PERIODS.map((p) => <button key={p.value} onClick={() => { setPeriod(p.value); setOffset(0); }} className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${period === p.value ? "bg-ink text-white" : "text-ink/55 hover:text-ink"}`}>{p.label}</button>)}</div><div className="flex items-center rounded-lg border border-ink/15 bg-white"><button onClick={() => setOffset((value) => value + 1)} className="rounded-l-lg p-2 text-ink/55 transition hover:text-ink" aria-label="Período anterior"><ChevronLeft size={16} /></button><span className="min-w-[6ch] text-center text-xs font-semibold text-ink/60">{data?.start} – {data?.end}</span><button onClick={() => setOffset((value) => Math.max(0, value - 1))} className="rounded-r-lg p-2 text-ink/55 transition hover:text-ink" aria-label="Período siguiente"><ChevronRight size={16} /></button></div></div></div>{error && <p className="mt-6 text-sm text-red-600">{error}</p>}{!data && !error && <div className="p-10 text-center text-ink/55">Calculando tu período...</div>}{data && <><div className="mt-6 grid gap-4 sm:grid-cols-3"><Metric icon={<CalendarDays size={20} />} value={`${data.summary.completionRate}%`} label={`cumplimiento global (${data.summary.completedLogs}/${data.summary.totalLogs} registros)`} /><Metric icon={<Flame size={20} />} value={`${data.summary.activeDays}/${data.summary.totalDays}`} label="días activos" /><Metric icon={<Trophy size={20} />} value={data.best ? data.best.name : "—"} label={data.best ? `${data.best.rate}% de cumplimiento` : "aún sin hábitos"} /></div><Card className="mt-5 p-5 sm:p-7"><h2 className="font-serif text-xl font-bold">Cumplimiento global</h2><div className="mt-4 h-3 overflow-hidden rounded-full bg-sand"><div className="h-full rounded-full bg-moss transition-all" style={{ width: `${data.summary.completionRate}%` }} /></div><p className="mt-2 text-sm text-ink/55">{data.summary.completedLogs} de {data.summary.totalLogs} registros cumplidos en el período.</p></Card><Card className="mt-5 p-5 sm:p-7"><h2 className="font-serif text-xl font-bold">Consistencia por hábito</h2><div className="mt-5 space-y-4">{data.habits.map((habit) => <div key={habit.id}><div className="flex items-center justify-between text-sm"><span className="font-semibold">{habit.name}</span><span className="text-ink/55">{habit.logs > 0 ? `${habit.rate}%` : "sin registros"}</span></div><div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-sand"><div className="h-full rounded-full bg-moss/70 transition-all" style={{ width: `${habit.rate}%` }} /></div>{habit.measured && <p className="mt-1 text-xs text-ink/50">Total {habit.measured.total} {habit.measured.unit} · Promedio {habit.measured.avg} {habit.measured.unit}</p>}</div>)}{!data.habits.length && <p className="text-sm text-ink/55">Aún no tienes hábitos.</p>}</div></Card></>}</main>;
}
function Metric({ icon, value, label }) { return <Card className="flex items-center gap-4 p-5"><span className="text-moss">{icon}</span><div><strong className="block text-2xl leading-tight">{value}</strong><span className="text-sm text-ink/55">{label}</span></div></Card>; }
