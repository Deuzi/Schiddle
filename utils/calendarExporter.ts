// utils/calendarExporter.ts
//
// Converts the AI-generated (and already-unmasked) schedule events into a
// native .ics file, built entirely client-side. Nothing is uploaded to a
// server or third-party calendar API — this is a pure in-browser file
// stream download, matching Schiddle's zero-retention design.

import { createEvents, type EventAttributes } from "ics";

export interface ScheduleEvent {
  title: string;
  startHour: number;
  startMinute: number;
  durationHours: number;
  location?: string;
  notes?: string;
  // Optional explicit date fields — if omitted, "today" is used.
  year?: number;
  month?: number; // 1-12
  day?: number;
}

export function buildIcsString(eventsArray: ScheduleEvent[]): Promise<string> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const formattedEvents: EventAttributes[] = eventsArray.map((evt) => ({
    start: [
      evt.year ?? currentYear,
      evt.month ?? currentMonth,
      evt.day ?? currentDay,
      evt.startHour,
      evt.startMinute,
    ],
    duration: { hours: evt.durationHours },
    title: evt.title,
    location: evt.location || "",
    description: evt.notes || "",
  }));

  return new Promise((resolve, reject) => {
    createEvents(formattedEvents, (error, value) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(value);
    });
  });
}

export async function downloadCalendarFile(eventsArray: ScheduleEvent[]) {
  const icsString = await buildIcsString(eventsArray);

  const blob = new Blob([icsString], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "schiddle_optimized_schedule.ics");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
