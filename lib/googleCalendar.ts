// lib/googleCalendar.ts
//
// Pushes already-unmasked schedule events directly into the signed-in
// user's own Google Calendar (primary calendar) using their OAuth access
// token. This is a genuine write to the user's real calendar — not a
// mock/sample file — via Google's REST API.

export interface ScheduleEventInput {
  title: string;
  startHour: number;
  startMinute: number;
  durationHours: number;
  location?: string;
  notes?: string;
  year?: number;
  month?: number; // 1-12
  day?: number;
}

interface PushResult {
  succeeded: number;
  failed: { event: ScheduleEventInput; error: string }[];
}

function toIsoLocal(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;
}

/**
 * Creates one Google Calendar event per schedule item on the user's
 * primary calendar. Uses the browser's IANA timezone so events land at
 * the correct local time regardless of where Groq inferred hours from.
 */
export async function pushEventsToGoogleCalendar(
  accessToken: string,
  events: ScheduleEventInput[],
  timeZone: string
): Promise<PushResult> {
  const now = new Date();
  const result: PushResult = { succeeded: 0, failed: [] };

  for (const evt of events) {
    const year = evt.year ?? now.getFullYear();
    const month = evt.month ?? now.getMonth() + 1;
    const day = evt.day ?? now.getDate();

    const startDate = new Date(year, month - 1, day, evt.startHour, evt.startMinute);
    const endDate = new Date(
      startDate.getTime() + evt.durationHours * 60 * 60 * 1000
    );

    const body = {
      summary: evt.title,
      location: evt.location || undefined,
      description: evt.notes || undefined,
      start: {
        dateTime: toIsoLocal(year, month, day, evt.startHour, evt.startMinute),
        timeZone,
      },
      end: {
        dateTime: toIsoLocal(
          endDate.getFullYear(),
          endDate.getMonth() + 1,
          endDate.getDate(),
          endDate.getHours(),
          endDate.getMinutes()
        ),
        timeZone,
      },
    };

    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (res.ok) {
      result.succeeded += 1;
    } else {
      const errBody = await res.json().catch(() => ({}));
      result.failed.push({
        event: evt,
        error: errBody?.error?.message || `HTTP ${res.status}`,
      });
    }
  }

  return result;
}
