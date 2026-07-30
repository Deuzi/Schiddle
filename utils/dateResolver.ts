// utils/dateResolver.ts
//
// Converts the AI's "dayOfWeek" field (e.g. "Monday") into an actual
// concrete calendar date, computed in code rather than trusted from the
// model's own date arithmetic. This is what makes a 5-day schedule
// actually spread across 5 different days instead of collapsing onto
// "today" for every event.

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
 * Given a weekday name (or "unspecified"), returns the next calendar
 * date matching that weekday, starting from `referenceDate` (inclusive —
 * if today IS that weekday, today is returned, not next week).
 * "unspecified" (or any unrecognized value) resolves to referenceDate itself.
 */
export function resolveDayOfWeek(
  dayOfWeek: string | undefined | null,
  referenceDate: Date = new Date()
): ResolvedDate {
  const normalized = (dayOfWeek || "").trim().toLowerCase();
  const targetIndex = WEEKDAYS.indexOf(normalized);

  if (targetIndex === -1) {
    // "unspecified" or unrecognized -> default to reference date (today).
    return {
      year: referenceDate.getFullYear(),
      month: referenceDate.getMonth() + 1,
      day: referenceDate.getDate(),
    };
  }

  const refIndex = referenceDate.getDay();
  const daysToAdd = (targetIndex - refIndex + 7) % 7; // 0..6, today counts as a match

  const resolved = new Date(referenceDate);
  resolved.setDate(referenceDate.getDate() + daysToAdd);

  return {
    year: resolved.getFullYear(),
    month: resolved.getMonth() + 1,
    day: resolved.getDate(),
  };
}
