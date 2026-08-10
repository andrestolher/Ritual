const DAY = 86_400_000;

export function dateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

export function startOfToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export function calculateStats(logs) {
  const completed = new Set(logs.filter((log) => log.completed).map((log) => dateKey(log.date)));
  const today = startOfToday();
  let currentStreak = 0;
  for (let date = today; completed.has(dateKey(date)); date = new Date(date.getTime() - DAY)) currentStreak++;

  const sorted = [...completed].sort();
  let longestStreak = 0;
  let run = 0;
  let previous = null;
  for (const key of sorted) {
    const date = new Date(`${key}T00:00:00.000Z`);
    run = previous && date.getTime() - previous.getTime() === DAY ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = date;
  }

  const thirtyDaysAgo = new Date(today.getTime() - 29 * DAY);
  const recentLogs = logs.filter((log) => new Date(log.date) >= thirtyDaysAgo);
  const completionRate30d = recentLogs.length
    ? Math.round((recentLogs.filter((log) => log.completed).length / recentLogs.length) * 100)
    : 0;
  return { currentStreak, longestStreak, completionRate30d };
}
