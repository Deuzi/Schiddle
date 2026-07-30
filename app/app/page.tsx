"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  maskSensitiveData,
  unmaskObject,
  type MaskMap,
} from "@/utils/securityEngine";
import {
  downloadCalendarFile,
  type ScheduleEvent,
} from "@/utils/calendarExporter";
import { resolveDayOfWeek } from "@/utils/dateResolver";

type Status = "idle" | "masking" | "loading" | "ready" | "error";
type PushStatus = "idle" | "pushing" | "done" | "error";

// Shared glass button treatment — every button is translucent, even the
// green "primary" ones, per the "all buttons transparent" design rule.
const glassGreen =
  "rounded-lg border border-schiddle-500/40 bg-schiddle-500/10 backdrop-blur-md text-schiddle-700 hover:bg-schiddle-500/20 hover:border-schiddle-500/60 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-schiddle-500/10";
const glassNeutral =
  "rounded-lg border border-neutral-300/70 bg-white/50 backdrop-blur-md text-neutral-700 hover:bg-white/80 hover:border-neutral-400 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/50";

export default function AppPage() {
  const { data: session } = useSession();
  const [rawInput, setRawInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [maskedPreview, setMaskedPreview] = useState<string>("");
  const [pushStatus, setPushStatus] = useState<PushStatus>("idle");
  const [pushMsg, setPushMsg] = useState<string | null>(null);

  async function handleOptimize() {
    if (!rawInput.trim()) return;
    setStatus("masking");
    setErrorMsg(null);
    setEvents([]);

    const { maskedText, reverseMap } = maskSensitiveData(rawInput);
    setMaskedPreview(maskedText);

    setStatus("loading");
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maskedText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to optimize schedule.");
      }

      const unmaskedEvents = unmaskObject<
        (ScheduleEvent & { dayOfWeek?: string })[]
      >(data.events, reverseMap as MaskMap);

      const datedEvents: ScheduleEvent[] = unmaskedEvents.map(
        ({ dayOfWeek, ...evt }) => {
          const resolved = resolveDayOfWeek(dayOfWeek);
          return { ...evt, ...resolved };
        }
      );

      setEvents(datedEvents);
      setStatus("ready");
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong.");
      setStatus("error");
    }
  }

  async function handleExportIcs() {
    if (events.length === 0) return;
    await downloadCalendarFile(events);
  }

  async function handlePushToGoogle() {
    if (events.length === 0) return;
    setPushStatus("pushing");
    setPushMsg(null);
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch("/api/calendar/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events, timeZone }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to add events to Google Calendar.");
      }
      const failedCount = data.failed?.length || 0;
      setPushMsg(
        failedCount > 0
          ? `Added ${data.succeeded} event(s). ${failedCount} failed.`
          : `Added ${data.succeeded} event(s) to your Google Calendar.`
      );
      setPushStatus(failedCount > 0 ? "error" : "done");
    } catch (err: any) {
      setPushMsg(err?.message || "Something went wrong.");
      setPushStatus("error");
    }
  }

  const isProcessing = status === "masking" || status === "loading";

  return (
    <main className="min-h-screen bg-white bg-gradient-to-b from-white via-schiddle-50 to-white">
      {/* Top nav */}
      <header className="border-b border-schiddle-100 bg-white/70 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Schiddle"
              width={96}
              height={28}
              className="h-6 w-auto object-contain"
            />
          </Link>
          <Link
            href="/"
            className="text-sm text-neutral-500 hover:text-schiddle-700 transition"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-neutral-900">
            Schiddle
          </h1>
          <p className="text-neutral-500 mt-1">
            Privacy-first AI schedule optimizer for students. Real names,
            schools, and locations never leave your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Input Panel */}
          <section className="flex flex-col gap-4">
            <label
              htmlFor="scheduleInput"
              className="font-medium text-neutral-800"
            >
              Tell Schiddle about your week
            </label>
            <textarea
              id="scheduleInput"
              className="w-full min-h-[220px] rounded-lg border border-schiddle-200 bg-white/70 backdrop-blur-sm text-neutral-800 placeholder:text-neutral-400 p-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-schiddle-400"
              placeholder="I have Westview Varsity Tennis practice Monday from 3-5 PM, AP Calc exam prep at 6 PM, and a tournament in San Diego all day Saturday."
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
            />

            <button
              onClick={handleOptimize}
              disabled={isProcessing || !rawInput.trim()}
              className={`w-full font-semibold py-3 ${glassGreen}`}
            >
              {status === "masking" && "Securing your data…"}
              {status === "loading" && "Optimizing schedule…"}
              {(status === "idle" || status === "ready" || status === "error") &&
                "Secure & Optimize Schedule"}
            </button>

            {errorMsg && (
              <p className="text-sm text-red-600 border border-red-200 bg-red-50/80 backdrop-blur-sm rounded-md p-3">
                {errorMsg}
              </p>
            )}

            {maskedPreview && (
              <details className="text-xs text-neutral-500 border border-schiddle-200 bg-white/50 backdrop-blur-sm rounded-md p-3">
                <summary className="cursor-pointer font-medium text-neutral-600">
                  What actually got sent to the AI
                </summary>
                <pre className="whitespace-pre-wrap mt-2">{maskedPreview}</pre>
              </details>
            )}
          </section>

          {/* Right: Output Gallery */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-medium text-neutral-800">
                Optimized Schedule
              </h2>
              <div className="flex items-center gap-2">
                {session ? (
                  <button
                    onClick={handlePushToGoogle}
                    disabled={events.length === 0 || pushStatus === "pushing"}
                    className={`text-sm px-3 py-1.5 ${glassGreen}`}
                  >
                    {pushStatus === "pushing"
                      ? "Adding…"
                      : "Add to Google Calendar"}
                  </button>
                ) : (
                  <button
                    onClick={() => signIn("google")}
                    className={`text-sm px-3 py-1.5 ${glassGreen}`}
                  >
                    Connect Google Calendar
                  </button>
                )}
                <button
                  onClick={handleExportIcs}
                  disabled={events.length === 0}
                  className={`text-sm px-3 py-1.5 ${glassNeutral}`}
                  title="Works with Apple Calendar, Outlook, or any calendar app — no sign-in needed."
                >
                  Download .ics
                </button>
              </div>
            </div>

            {session?.user?.email && (
              <p className="text-xs text-neutral-400">
                Connected as {session.user.email} ·{" "}
                <button onClick={() => signOut()} className="underline">
                  disconnect
                </button>
              </p>
            )}

            {pushMsg && (
              <p
                className={`text-sm rounded-md p-3 border backdrop-blur-sm ${
                  pushStatus === "error"
                    ? "text-red-600 border-red-200 bg-red-50/80"
                    : "text-schiddle-700 border-schiddle-300 bg-schiddle-50/80"
                }`}
              >
                {pushMsg}
              </p>
            )}

            <div className="flex-1 rounded-lg border border-schiddle-100 bg-white/60 backdrop-blur-sm p-4 min-h-[260px] shadow-sm">
              {events.length === 0 ? (
                <p className="text-neutral-400 text-sm text-center mt-16">
                  {isProcessing
                    ? "Awaiting Secure Input…"
                    : "Your optimized timeline will appear here."}
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {events.map((evt, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-schiddle-100 bg-white/80 p-3 text-sm text-neutral-800 shadow-sm hover:shadow-md hover:border-schiddle-300 transition"
                    >
                      <div className="flex justify-between font-medium">
                        <span>{evt.title}</span>
                        <span className="text-neutral-400">
                          {evt.year && evt.month && evt.day
                            ? new Date(
                                evt.year,
                                evt.month - 1,
                                evt.day
                              ).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              }) + " · "
                            : ""}
                          {String(evt.startHour).padStart(2, "0")}:
                          {String(evt.startMinute).padStart(2, "0")} ·{" "}
                          {evt.durationHours}h
                        </span>
                      </div>
                      {evt.location && (
                        <div className="text-neutral-500 mt-1">
                          {evt.location}
                        </div>
                      )}
                      {evt.notes && (
                        <div className="text-schiddle-600 mt-1 italic">
                          {evt.notes}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
