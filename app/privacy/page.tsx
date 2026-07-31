import Link from "next/link";
import Image from "next/image";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050705] px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 mb-10">
          <Image
            src="/images/logo.png"
            alt="Schiddle"
            width={96}
            height={28}
            className="h-6 w-auto object-contain"
          />
        </Link>

        <h1 className="font-heading text-3xl font-bold text-white mb-2">
          Privacy Policy
        </h1>
        <p className="text-schiddle-400/60 text-sm mb-10">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="space-y-8 text-schiddle-200/80 leading-relaxed">
          <section>
            <h2 className="font-heading text-xl font-semibold text-white mb-2">
              Overview
            </h2>
            <p>
              Schiddle ("we," "our," or "the app") is a schedule-optimization
              tool that uses AI to organize free-text schedule input into a
              structured, exportable calendar. This policy explains what data
              we access, how it's handled, and what control you have over it.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-white mb-2">
              What we do with your schedule text
            </h2>
            <p>
              Before your schedule text is sent anywhere, Schiddle scans it in
              your browser and replaces likely-identifying information — names,
              school names, cities, and similar details — with abstract
              placeholder tokens. Only this tokenized text is sent to our
              server and forwarded to our AI provider (Groq) to generate an
              optimized schedule. Your real names, schools, and locations are
              never transmitted to the AI model. The AI's response is
              converted back into real values entirely inside your browser —
              this step never touches our servers.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-white mb-2">
              Google Calendar integration
            </h2>
            <p>
              If you choose to connect Google Calendar, Schiddle requests a
              single, narrow OAuth permission —{" "}
              <code className="text-schiddle-300">calendar.events</code> —
              which allows the app to create calendar events on your behalf.
              We do not request, and cannot use this permission to read, list,
              or delete any of your existing calendar data. Your Google access
              token is stored only in your signed, encrypted session and is
              used solely to create the events you generate through the app.
              You can revoke this access at any time from your Google Account's{" "}
              
               <a href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-schiddle-400 underline hover:text-schiddle-300"
              >
                Security &amp; third-party access settings
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-white mb-2">
              Calendar file export
            </h2>
            <p>
              When you use the "Download .ics" option, your calendar file is
              generated entirely in your browser and saved directly to your
              device. This data is never uploaded to, or stored on, our
              servers.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-white mb-2">
              What we store
            </h2>
            <p>
              We do not maintain a database of your schedules, raw input
              text, or unmasked personal information. If you sign in with
              Google, we store only the session data required to keep you
              signed in and to authorize calendar event creation, for as long
              as your session remains active.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-white mb-2">
              Third parties
            </h2>
            <p>
              Schiddle uses Groq as its AI processing provider (receiving only
              tokenized, non-identifying text) and Google as an optional
              calendar integration (receiving only the events you explicitly
              choose to create). We do not sell or share your data with any
              other third party.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-white mb-2">
              Your choices
            </h2>
            <p>
              Google Calendar integration is entirely optional — the app is
              fully usable with just the local .ics export, which requires no
              account or sign-in at all. You can disconnect Google access at
              any time from within the app or directly from your Google
              Account settings.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-white mb-2">
              Contact
            </h2>
            <p>
              Questions about this policy can be sent to{" "}
              
               <a  href="mailto:chimdiikechukwu00@gmail.com"
                className="text-schiddle-400 underline hover:text-schiddle-300"
              >
                chimdiikechukwu00@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
