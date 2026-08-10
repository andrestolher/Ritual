import prisma from "../prisma/client.js";
import { calculateStats, dateKey, startOfToday } from "./stats.js";

const habitInclude = { stackedAfter: { select: { id: true, name: true } } };
const fields = ["name", "type", "identityStatement", "stackedAfterId"];

async function ownedHabit(id, userId) {
  return prisma.habit.findFirst({ where: { id, userId } });
}

async function validateStack(stackId, userId, habitId) {
  if (!stackId) return;
  if (stackId === habitId) throw new Error("Un hábito no puede encadenarse consigo mismo");
  const parent = await ownedHabit(stackId, userId);
  if (!parent) throw new Error("El hábito seleccionado no existe");
  let current = parent;
  while (current?.stackedAfterId) {
    if (current.stackedAfterId === habitId) throw new Error("La cadena no puede formar un ciclo");
    current = await prisma.habit.findUnique({ where: { id: current.stackedAfterId } });
  }
}

export async function listHabits(req, res, next) {
  try {
    const today = startOfToday();
    const todayKey = dateKey(today);
    const habits = await prisma.habit.findMany({
      where: { userId: req.user.id }, include: { ...habitInclude, logs: { where: { date: today } } }, orderBy: { createdAt: "asc" }
    });
    const habitIds = habits.map((h) => h.id);
    const missed = await prisma.habitLog.groupBy({ by: ["habitId"], where: { habitId: { in: habitIds }, completed: false } });
    const missedIds = new Set(missed.map((row) => row.habitId));
    res.json(habits.map(({ logs, ...habit }) => ({
      ...habit,
      todayLog: logs[0] || null,
      canDelete: dateKey(habit.createdAt) === todayKey || missedIds.has(habit.id)
    })));
  } catch (error) { next(error); }
}

export async function createHabit(req, res, next) {
  try {
    const { name, type, identityStatement, stackedAfterId } = req.body;
    if (!name?.trim() || !["BUILD", "AVOID"].includes(type)) return res.status(400).json({ error: "Nombre y tipo válidos son obligatorios" });
    await validateStack(stackedAfterId, req.user.id);
    const habit = await prisma.habit.create({ data: { userId: req.user.id, name: name.trim(), type, identityStatement: identityStatement?.trim() || null, stackedAfterId: stackedAfterId || null }, include: habitInclude });
    res.status(201).json(habit);
  } catch (error) { next(error); }
}

export async function updateHabit(req, res, next) {
  try {
    const existing = await ownedHabit(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: "Hábito no encontrado" });
    const data = Object.fromEntries(fields.filter((key) => key in req.body).map((key) => [key, req.body[key]]));
    if (data.name !== undefined && !data.name?.trim()) return res.status(400).json({ error: "El nombre no puede estar vacío" });
    if (data.type && !["BUILD", "AVOID"].includes(data.type)) return res.status(400).json({ error: "Tipo inválido" });
    if (data.stackedAfterId !== undefined) await validateStack(data.stackedAfterId, req.user.id, existing.id);
    if (data.name) data.name = data.name.trim();
    if (data.identityStatement !== undefined) data.identityStatement = data.identityStatement?.trim() || null;
    if (data.stackedAfterId !== undefined) data.stackedAfterId ||= null;
    res.json(await prisma.habit.update({ where: { id: existing.id }, data, include: habitInclude }));
  } catch (error) { next(error); }
}

export async function deleteHabit(req, res, next) {
  try {
    const habit = await ownedHabit(req.params.id, req.user.id);
    if (!habit) return res.status(404).json({ error: "Hábito no encontrado" });
    await prisma.habit.delete({ where: { id: habit.id } });
    res.status(204).end();
  } catch (error) { next(error); }
}

export async function logHabit(req, res, next) {
  try {
    const habit = await ownedHabit(req.params.id, req.user.id);
    if (!habit) return res.status(404).json({ error: "Hábito no encontrado" });
    const { date, completed, notes } = req.body;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || typeof completed !== "boolean") return res.status(400).json({ error: "Fecha y estado de cumplimiento válidos son obligatorios" });
    const logDate = new Date(`${date}T00:00:00.000Z`);
    res.json(await prisma.habitLog.upsert({ where: { habitId_date: { habitId: habit.id, date: logDate } }, update: { completed, notes: notes?.trim() || null }, create: { habitId: habit.id, date: logDate, completed, notes: notes?.trim() || null } }));
  } catch (error) { next(error); }
}

export async function habitStats(req, res, next) {
  try {
    const habit = await prisma.habit.findFirst({ where: { id: req.params.id, userId: req.user.id }, include: { logs: true } });
    if (!habit) return res.status(404).json({ error: "Hábito no encontrado" });
    res.json({ ...calculateStats(habit.logs), logs: habit.logs.map((log) => ({ ...log, date: dateKey(log.date) })) });
  } catch (error) { next(error); }
}
