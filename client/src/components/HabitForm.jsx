import { useState } from "react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Button } from "./ui/button";

export function HabitForm({ habits, onCreated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError("");
    const form = new FormData(event.currentTarget);
    try { await onCreated({ name: form.get("name"), type: form.get("type"), identityStatement: form.get("identityStatement"), stackedAfterId: form.get("stackedAfterId") || null }); setOpen(false); event.currentTarget.reset(); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><Button>Nuevo hábito</Button></Dialog.Trigger><DialogContent><Dialog.Title className="font-serif text-2xl font-bold">Diseña un hábito</Dialog.Title><Dialog.Description className="mt-1 text-sm text-ink/60">Empieza con una acción que puedas repetir incluso en un día normal.</Dialog.Description><form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-semibold">Nombre<input required name="name" placeholder="Caminar 20 minutos" className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-moss/30" /></label><label className="block text-sm font-semibold">Dirección<select name="type" className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5"><option value="BUILD">Construir un hábito</option><option value="AVOID">Evitar algo</option></select></label><label className="block text-sm font-semibold">Identidad <span className="font-normal text-ink/45">(opcional)</span><textarea name="identityStatement" rows="2" placeholder="Soy alguien que cuida su energía" className="mt-1.5 w-full resize-none rounded-lg border bg-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-moss/30" /></label><label className="block text-sm font-semibold">Encadenar después de <span className="font-normal text-ink/45">(opcional)</span><select name="stackedAfterId" className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5"><option value="">Sin ancla</option>{habits.map((habit) => <option value={habit.id} key={habit.id}>{habit.name}</option>)}</select></label>{error && <p className="text-sm text-red-600">{error}</p>}<Button disabled={saving} className="w-full">{saving ? "Guardando..." : "Crear hábito"}</Button></form></DialogContent></Dialog.Root>;
}
