import { useState } from "react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Button } from "./ui/button";

export function RegisterDialog({ habit, onClose, onSaved }) {
  const [value, setValue] = useState(habit.todayLog?.value ?? "");
  const [completed, setCompleted] = useState(habit.todayLog?.completed ?? true);
  const [notes, setNotes] = useState(habit.todayLog?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const hasGoal = habit.goal != null;
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError("");
    try { await onSaved({ value: value === "" ? null : Number(value), completed, notes }); onClose(); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  return <Dialog.Root open onOpenChange={onClose}><DialogContent><Dialog.Title className="font-serif text-xl font-bold">Registrar {habit.name}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-ink/60">{hasGoal ? `Meta diaria: ${habit.goal} ${habit.unit}. El cumplimiento se calcula con tu valor.` : habit.unit ? `Anota el valor de hoy (${habit.unit}).` : "Registra cómo va tu día."}</Dialog.Description><form onSubmit={submit} className="mt-5 space-y-4"><label className="block text-sm font-semibold">Valor <span className="font-normal text-ink/45">({habit.unit || "veces"})</span><input autoFocus type="number" min="0" step="any" value={value} onChange={(event) => setValue(event.target.value)} required={Boolean(habit.unit || hasGoal)} placeholder={habit.unit ? `0 ${habit.unit}` : "0"} className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-moss/30" /></label>{!hasGoal && <label className="flex items-center gap-3 rounded-lg border bg-sand/40 px-3 py-2.5"><input type="checkbox" checked={completed} onChange={(event) => setCompleted(event.target.checked)} className="h-4 w-4 accent-moss" /><span className="text-sm font-semibold">Cumplido hoy</span></label>}<label className="block text-sm font-semibold">Nota <span className="font-normal text-ink/45">(opcional)</span><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="caminadora, exterior, 2 km + 3 km…" className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-moss/30" /></label>{error && <p className="text-sm text-red-600">{error}</p>}<div className="flex gap-3"><Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button><Button disabled={saving} className="flex-1">{saving ? "Guardando..." : "Guardar"}</Button></div></form></DialogContent></Dialog.Root>;
}
