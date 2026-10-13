const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", year: "numeric" });

/** Parses the date part only, in local time, so a due date never shifts by a day across time zones. */
function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function formatDueDate(value: string): string {
  const date = parseDateOnly(value);
  return date ? formatter.format(date) : "—";
}

export function isOverdue(value: string, today = new Date()): boolean {
  const date = parseDateOnly(value);
  if (!date) return false;
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return date < startOfToday;
}
