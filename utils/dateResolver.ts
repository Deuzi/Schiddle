// utils/dateResolver.ts
//
// Converts the AI's "dayOfWeek" field (e.g. "Monday") plus an optional
// "weekOffset" (e.g. 1 for "next week Saturday") into an actual concrete
// calendar date, computed in code rather than trusted from the model's
// own date arithmetic.

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export interface ResolvedDate {
  year: number;
  month: number; // 1-12
  day: number;
}

/**
 * Given a weekday name (or "unspecified") and an optional week offset,
 * returns the resolved calendar date. weekOffset 0 = the nearest upcoming
 * occurrence (today counts if it matches); weekOffset 1 = the occurrence
 * after that (i.e. "next week Saturday" explicitly skips the closest one).
 */
export function resolveDayOfWeek(
  dayOfWeek: string | undefined | null,
  weekOffset: number = 0,
  referenceDate: Date = new Date()
): ResolvedDate {
  const normalized = (dayOfWeek || "").trim().toLowerCase();
  const targetIndex = WEEKDAYS.indexOf(normalized);

  if (targetIndex === -1) {
    return {
      year: referenceDate.getFullYear(),
      month: referenceDate.getMonth() + 1,
      day: referenceDate.getDate(),
    };
  }

  const refIndex = referenceDate.getDay();
  const baseDaysToAdd = (targetIndex - refIndex + 7) % 7; // 0..6, nearest occurrence
  const safeOffset = Number.isFinite(weekOffset) && weekOffset > 0 ? Math.floor(weekOffset) : 0;
  const daysToAdd = baseDaysToAdd + safeOffset * 7;

  const resolved = new Date(referenceDate);
  resolved.setDate(referenceDate.getDate() + daysToAdd);

  return {
    year: resolved.getFullYear(),
    month: resolved.getMonth() + 1,
    day: resolved.getDate(),
  };
}