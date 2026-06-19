export const BRISBANE_TIME_ZONE = "Australia/Brisbane";
export const RUN_DAYS = [2, 4]; // Tuesday, Thursday.
export const CUTOFF_HOUR = 12;
export const CUTOFF_MINUTE = 30;

export function brisbaneToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BRISBANE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}

export function brisbaneMinutes(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: BRISBANE_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(now);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function isAfterCutoff(now = new Date()) {
  return brisbaneMinutes(now) >= CUTOFF_HOUR * 60 + CUTOFF_MINUTE;
}

export function isRunDay(dateValue: string) {
  return RUN_DAYS.includes(toBrisbaneDate(dateValue).getUTCDay());
}

export function nextAvailableRunDate(fromDate: string) {
  const date = toBrisbaneDate(fromDate);
  for (let i = 0; i < 10; i += 1) {
    date.setUTCDate(date.getUTCDate() + (i === 0 ? 0 : 1));
    if (RUN_DAYS.includes(date.getUTCDay())) {
      return toDateInputValue(date);
    }
  }
  return fromDate;
}

export function resolveActualRunDate(requestedRunDate: string, now = new Date()) {
  const today = brisbaneToday(now);
  const requestedIsPast = requestedRunDate < today;
  const afterCutoffForToday = requestedRunDate === today && isAfterCutoff(now);
  const invalidRunDay = !isRunDay(requestedRunDate);

  if (requestedIsPast || afterCutoffForToday || invalidRunDay) {
    const base = requestedIsPast || afterCutoffForToday ? addDays(today, 1) : requestedRunDate;
    return {
      actualRunDate: nextAvailableRunDate(base),
      cutOffApplied: requestedIsPast || afterCutoffForToday,
      scheduleAdjusted: invalidRunDay || requestedIsPast || afterCutoffForToday
    };
  }

  return {
    actualRunDate: requestedRunDate,
    cutOffApplied: false,
    scheduleAdjusted: false
  };
}

function addDays(dateValue: string, days: number) {
  const date = toBrisbaneDate(dateValue);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateInputValue(date);
}

function toBrisbaneDate(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toDateInputValue(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatAudCents(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD"
  }).format(cents / 100);
}
