// app/api/calendar/push/route.ts
//
// Receives already-unmasked schedule events from the browser (this is
// the user's own real data going into the user's own calendar — no
// masking needed here, since nothing is being sent to a third-party AI).
// Uses the signed-in user's Google OAuth access token to create real
// events on their primary Google Calendar.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { pushEventsToGoogleCalendar, type ScheduleEventInput } from "@/lib/googleCalendar";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.accessToken as string | undefined;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Not signed in to Google. Please connect Google Calendar first." },
      { status: 401 }
    );
  }

  const body = await req.json();
  const events: ScheduleEventInput[] = body?.events;
  const timeZone: string = body?.timeZone || "UTC";

  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: "No events provided." }, { status: 400 });
  }

  try {
    const result = await pushEventsToGoogleCalendar(accessToken, events, timeZone);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Google Calendar push error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to push events to Google Calendar." },
      { status: 500 }
    );
  }
}
