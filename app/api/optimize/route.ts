// app/api/optimize/route.ts
//
// Server-side route. Receives ONLY already-masked text from the client
// (real names/schools/locations have already been replaced with tokens
// like [LOCATION_EDUCATIONAL_1] in the browser). This route never sees
// raw PII, and forwards the masked text to Groq's OpenAI-compatible
// chat completions endpoint.

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are an advanced time-management and productivity algorithm specializing in student schedule optimization — covering academics, athletics, clubs, jobs, and personal commitments.
Your task is to organize raw schedule inputs into structured daily time blocks optimized for peak focus, recovery, and academic execution.

CRITICAL INSTRUCTIONS:
1. The input MAY contain tracking tags like [LOCATION_EDUCATIONAL_1], [LOCATION_GEOGRAPHIC_1], [ACTIVITY_ATHLETIC_1], [ACTIVITY_ACADEMIC_1], [PERSON_NAME_1], etc. If (and only if) a tag literally appears in the input text given to you, preserve it exactly as written, character for character, in your output.
2. NEVER invent, create, or fabricate a new tag of this form yourself. If a field like location has no information given in the input, return an empty string "" for that field. Do not make up a placeholder tag to fill it.
3. Every event MUST include a "dayOfWeek" field: one of "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", or "unspecified" if the user gave no day for that event (in which case it will default to today). Base this strictly on what the user actually said (e.g. "Monday afternoon" -> "Monday", "Tuesday by 2-6pm" -> "Tuesday"). Do not default every event to the same day — different events can and should land on different days if the user described them that way.
4. If an activity repeats across multiple named days (e.g. "practice Monday, Wednesday, and Thursday"), create ONE SEPARATE event object for EACH day mentioned — never merge multiple days into a single event. Each of those events should have identical title/time/location/duration, differing only in "dayOfWeek". Do not reference any other day of the week inside a "notes" field — notes must only contain a productivity/recovery tip, never a day name.
5. Respond with ONLY a raw JSON array of events. Do not include markdown code fences, backticks, or any conversational text before or after the JSON.
6. Infer reasonable start times/durations when the user is vague, but never invent specific named entities that weren't in the input.
7. NEVER default an unspecified or vague time to 00:00 (midnight) — that is almost always wrong for a real activity. If the user gives only a vague time-of-day word instead of an exact hour, use these defaults unless other context in the input clearly suggests otherwise:
   - "morning" -> 9:00 AM
   - "afternoon" -> 2:00 PM (14:00)
   - "evening" -> 6:00 PM (18:00)
   - "night" -> 8:00 PM (20:00)
   If an event is described as happening after another event (e.g. "after tennis practice"), its start time should be later than that other event's end time, not just the raw time-of-day default.

Expected JSON structure (array of objects):
[
  {
    "title": "string, event name or tag",
    "dayOfWeek": "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday" | "unspecified",
    "startHour": number (0-23, 24h format),
    "startMinute": number (0-59),
    "durationHours": number,
    "location": "string, location or tag, or empty string if not given",
    "notes": "short productivity/recovery tip for this block"
  }
]`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const maskedText: string = body?.maskedText;

    if (!maskedText || typeof maskedText !== "string") {
      return NextResponse.json(
        { error: "maskedText is required." },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey });

    const today = new Date();
    const todayLabel = today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Today is ${todayLabel}. Here is the schedule to organize:\n\n${maskedText}`,
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "";

    // Strip any accidental markdown fences before returning.
    const cleaned = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let events: unknown;
    try {
      events = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        {
          error: "Model did not return valid JSON.",
          raw: cleaned,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ events });
  } catch (err: any) {
    console.error("Groq optimize error:", err);
    return NextResponse.json(
      { error: err?.message || "Unknown server error." },
      { status: 500 }
    );
  }
}
