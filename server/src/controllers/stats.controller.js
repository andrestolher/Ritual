import prisma from "../prisma/client.js";

const DAY = 86_400_000;

function periodRange(period, offset = 0) {
  const now = new Date();
  if (period === "week") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7) - offset * 7);
    return { start, end: new Date(start.getTime() + 7 * DAY) };
  }
  if (period === "year") {
    const start = new Date(Date.UTC(now.getUTCFullYear() - offset, 0, 1));
    return { start, end: new Date(Date.UTC(start.getUTCFullYear() + 1, 0, 1)) };
  }
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
  return { start, end: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)) };
}

function round(value) {
  return Math.round(value * 100) / 100;
}

export async function overview(req, res, next) {
  try {
    const { period = "week", offset = 0 } = req.query;
    if (!["week", "month", "year"].includes(period)) return res.status(400).json({ error: "Período inválido" });
    const parsedOffset = Number(offset);
    if (!Number.isInteger(parsedOffset) || parsedOffset < 0) return res.status(400).json({ error: "Desplazamiento de período inválido" });
    const { start, end } = periodRange(period, parsedOffset);

    const habits = await prisma.habit.findMany({
      where: { userId: req.user.id },
      include: { logs: { where: { date: { gte: start, lt: end } } } },
      orderBy: { createdAt: "asc" }
    });

    const totalLogs = habits.reduce((sum, habit) => sum + habit.logs.length, 0);
    const completedLogs = habits.reduce((sum, habit) => sum + habit.logs.filter((log) => log.completed).length, 0);
    const activeDays = new Set(habits.flatMap((habit) => habit.logs.map((log) => new Date(log.date).toISOString().slice(0, 10)))).size;

    const ranked = habits.map((habit) => {
      const logs = habit.logs;
      const rate = logs.length ? Math.round((logs.filter((log) => log.completed).length / logs.length) * 100) : 0;
      const values = logs.filter((log) => log.value != null).map((log) => log.value);
      const measured = habit.unit ? {
        unit: habit.unit,
        total: round(values.reduce((sum, value) => sum + value, 0)),
        avg: values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0
      } : null;
      return { id: habit.id, name: habit.name, type: habit.type, rate, logs: logs.length, measured };
    });

    const best = [...ranked].filter((habit) => habit.logs > 0).sort((a, b) => b.rate - a.rate || b.logs - a.logs)[0] || null;

    res.json({
      period,
      offset: parsedOffset,
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      summary: {
        totalLogs,
        completedLogs,
        completionRate: totalLogs ? Math.round((completedLogs / totalLogs) * 100) : 0,
        activeDays,
        totalDays: Math.round((end - start) / DAY)
      },
      best,
      habits: ranked
    });
  } catch (error) { next(error); }
}
