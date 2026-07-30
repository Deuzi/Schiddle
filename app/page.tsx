import Link from "next/link";
import Image from "next/image";
import FadeIn from "@/components/FadeIn";

const FEATURES = [
  {
    step: "1",
    title: "Mask",
    description:
      "Real names, schools, and locations are tokenized right in your browser before anything is sent anywhere.",
    image: "/images/privacy.png",
  },
  {
    step: "2",
    title: "Optimize",
    description:
      "The AI only ever sees abstract tokens, and returns a schedule built around focus, recovery, and real deadlines.",
    image: "/images/optimize.png",
  },
  {
    step: "3",
    title: "Export",
    description:
      "Push it straight into Google Calendar, or download a real .ics file that opens natively on Mac, iPhone, or iPad.",
    image: "/images/export.png",
  },
];

export default function LandingPage() {
  return (
    <main className="bg-[#050705]">
      {/* Nav */}
      <header className="absolute top-0 left-0 right-0 z-20">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
          <span className="inline-flex rounded-xl  px-2 py-1 shadow-lg shadow-black/30">
            <Image
              src="/images/logo.png"
              alt="Schiddle"
              width={110}
              height={32}
              className="h-7 w-auto object-contain"
              priority
            />
          </span>

          <nav className="flex items-center gap-3">
            <Link
              href="/app"
              className="rounded-full border border-white/15 bg-white/10 backdrop-blur-md px-5 py-2 text-sm font-medium text-white hover:bg-white/20 transition"
            >
              Open App
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero.png"
            alt=""
            fill
            priority
            className="object-cover"
          />
          {/* Dark gradient overlay for legibility, tinted toward the brand green/black */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/55 to-black/90" />
          <div className="absolute inset-0 bg-schiddle-950/30" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6">
          <Image
            src="/images/logo.png"
            alt="Schiddle"
            width={420}
            height={120}
            className="w-[240px] sm:w-[320px] h-auto mb-6"
            priority
          />
          <p className="text-lg sm:text-xl text-schiddle-100/90 max-w-xl">
            Start scheduling effortlessly, without ever handing your real
            data to an AI.
          </p>

          <Link
            href="/app"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-7 py-3 text-white font-medium hover:bg-white/20 transition"
          >
            Try Now
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Descriptive / features section */}
      <section className="relative bg-[#050705] px-6 py-24 overflow-hidden">
        {/* Ambient glow behind the glass panel */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-schiddle-500/10 blur-[120px] rounded-full pointer-events-none" />

        <FadeIn className="relative mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 sm:p-14 shadow-2xl shadow-black/40">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold bg-gradient-to-r from-schiddle-200 via-schiddle-400 to-schiddle-200 bg-clip-text text-transparent">
              Three steps. Zero exposure.
            </h2>
            <p className="mt-3 text-schiddle-300/70 max-w-2xl mx-auto">
              Schiddle turns messy notes into an optimized calendar, and your
              real names, schools, and locations never leave your browser to
              get there.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 150}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 flex flex-col items-center text-center hover:bg-white/[0.06] hover:border-schiddle-500/30 transition">
                  <div className="rounded-lg mb-5">
                    <Image
                      src={f.image}
                      alt=""
                      width={120}
                      height={150}
                      className="h-150 w-120 rounded-lg object-contain"
                    />
                  </div>
                  <span className="text-xs font-semibold tracking-[0.2em] text-schiddle-500 mb-1">
                    STEP {f.step}
                  </span>
                  <h3 className="font-heading text-lg font-semibold text-white mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-schiddle-300/70">
                    {f.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-schiddle-900/60 bg-black px-6 py-10">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="inline-flex rounded-lg px-2 py-1">
            <Image
              src="/images/logo.png"
              alt="Schiddle"
              width={90}
              height={70}
              className="h-5 w-auto object-contain"
            />
          </span>

          <p className="text-xs text-schiddle-400/60 text-center">
            No raw personal data ever reaches our AI model. See{" "}
            <span className="text-schiddle-300">SECURITY.md</span> for the
            full write-up.
          </p>

          <p className="text-xs text-schiddle-500/50">
            © {new Date().getFullYear()} Schiddle
          </p>
        </div>
      </footer>
    </main>
  );
}
