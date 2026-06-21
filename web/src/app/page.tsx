import Image from "next/image";
import Link from "next/link";
import CheckoutButton from "./checkout-button";

const AQI_STATES = [
  { level: "Good", range: "0–50", color: "oklch(0.700 0.160 135)", guidance: "Open windows. Enjoy the air." },
  { level: "Moderate", range: "51–100", color: "oklch(0.820 0.150 85)", guidance: "Sensitive groups take care." },
  { level: "Sensitive", range: "101–150", color: "oklch(0.700 0.170 55)", guidance: "Limit time outdoors." },
  { level: "Unhealthy", range: "151–200", color: "oklch(0.550 0.200 25)", guidance: "Reduce outdoor exertion." },
  { level: "Very Unhealthy", range: "201–300", color: "oklch(0.400 0.150 310)", guidance: "Avoid outdoor activity." },
  { level: "Hazardous", range: "301+", color: "oklch(0.350 0.000 0)", guidance: "Stay indoors. Close windows." },
];

const FEATURES = [
  {
    title: "Real-time readings",
    description: "PM1, PM2.5, PM10 — updated every 60 seconds from your own sensor.",
  },
  {
    title: "The bear tells you",
    description: "One glance at the orb colour and expression. No numbers needed.",
  },
  {
    title: "7-day history",
    description: "Spot patterns. See which days spike. Plan your week around the air.",
  },
  {
    title: "Smart alerts",
    description: "Set thresholds. Get notified before conditions worsen, not after.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/bear-logo.png" alt="Bair1" width={36} height={36} className="object-contain" />
            <span className="text-xl font-bold tracking-tight text-ink" style={{ fontFamily: 'var(--font-display)' }}>
              Bair<span className="text-primary">1</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="https://app.bair1.live"
              className="text-sm font-medium text-muted hover:text-ink transition-colors hidden sm:block"
            >
              Dashboard
            </Link>
            <Link
              href="/firmware"
              className="text-sm font-medium text-muted hover:text-ink transition-colors hidden sm:block"
            >
              Firmware
            </Link>
            <Link
              href="#sensor"
              className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-hover transition-colors"
            >
              Get Sensor
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-ink mb-6">
                Know your air.
              </h1>
              <p className="text-lg sm:text-xl text-muted leading-relaxed prose-cap mb-8">
                The bear sniffs the air so you don&apos;t have to. Real-time air quality,
                honestly delivered — from your own sensor to your screen.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  href="https://app.bair1.live"
                  className="bg-primary text-white font-semibold px-7 py-3.5 rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Open Dashboard
                </Link>
                <Link
                  href="#sensor"
                  className="bg-surface text-ink font-semibold px-7 py-3.5 rounded-lg border border-border hover:border-muted transition-colors"
                >
                  Get a Sensor
                </Link>
              </div>
              <a href="https://luma.com/1uv1oeuu?tk=CYoskc" target="_blank" rel="noopener noreferrer">
                <Image
                  src="/hackathon-badge.avif"
                  alt="Built in London hackathon badge"
                  width={48}
                  height={48}
                  className="rounded-lg hover:opacity-80 transition-opacity"
                />
              </a>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <Image
                  src="/bear-sensor-front.jpg"
                  alt="The Bair1 sensor — a teddy bear with air quality sensors strapped to its chest"
                  width={480}
                  height={480}
                  className="object-cover rounded-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-ink mb-6">How it works</h2>
          <p className="text-muted mb-16 prose-cap text-lg">
            Plug in. Connect to WiFi. The bear starts sniffing. Under 2 minutes, no apps to configure.
          </p>
          <div className="grid sm:grid-cols-3 gap-12">
            <div>
              <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-ink font-bold mb-2">Plug in your sensor</h3>
              <p className="text-muted leading-relaxed">Connects to WiFi and starts publishing air quality readings automatically.</p>
            </div>
            <div>
              <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-ink font-bold mb-2">Bear sniffs the air</h3>
              <p className="text-muted leading-relaxed">Readings appear instantly. The orb colour and expression tell you everything at a glance.</p>
            </div>
            <div>
              <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-ink font-bold mb-2">You act</h3>
              <p className="text-muted leading-relaxed">Clear guidance: open windows, wear a mask, stay indoors. No jargon, no guessing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-ink mb-6">Everything at a glance</h2>
          <p className="text-muted mb-16 prose-cap text-lg">
            One screen, full picture. Understand air quality in under 2 seconds.
          </p>
          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10">
            {FEATURES.map((f) => (
              <div key={f.title} className="border-l-2 border-primary/30 pl-6">
                <h3 className="text-ink font-bold mb-1.5">{f.title}</h3>
                <p className="text-muted leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-24 border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <a href="https://luma.com/1uv1oeuu?tk=CYoskc" target="_blank" rel="noopener noreferrer">
                <Image
                  src="/hackathon-badge.avif"
                  alt="Built in London hackathon badge by Luma"
                  width={120}
                  height={120}
                  className="rounded-xl mb-8 hover:opacity-80 transition-opacity"
                />
              </a>
              <h2 className="text-ink mb-6">Born at a hackathon.<br />Built for your lungs.</h2>
              <p className="text-muted text-lg leading-relaxed prose-cap mb-6">
                Bair1 started as a hackathon project at{" "}
                <a href="https://luma.com/1uv1oeuu?tk=CYoskc" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Built in London
                </a>. The idea was simple:
                take the swag teddy bear, strap an air quality sensor to it, and see what happens.
              </p>
              <p className="text-muted leading-relaxed prose-cap">
                Turns out a bear that sniffs the air and tells you whether to open the window
                is something people actually want. So we kept building. The Auth0 teddy
                got a Bosch BMV080, a Plantower laser, an OLED screen, and a mission.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Image
                src="/bear-original.jpg"
                alt="The original Auth0 hackathon teddy bear sitting on a laptop"
                width={400}
                height={500}
                className="object-cover rounded-xl col-span-2 w-full h-64 sm:h-80"
              />
              <Image
                src="/bear-sensor-front.jpg"
                alt="The bear with sensors attached — front view"
                width={400}
                height={400}
                className="object-cover rounded-xl w-full h-40 sm:h-52"
              />
              <Image
                src="/bear-sensor-angle.jpg"
                alt="The bear with sensors attached — angle view showing wiring"
                width={400}
                height={400}
                className="object-cover rounded-xl w-full h-40 sm:h-52"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-ink mb-3 sm:mb-4">Early feedback</h2>
          </div>

          {/* Tweet grid — horizontal scroll on mobile, masonry on larger */}
          <div className="sm:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 w-max pb-4">
              {[
                { src: "/tweets/maya.jpg", alt: "Tweet from Maya Avendaño: woah cool to see more hardware projects from you!" },
                { src: "/tweets/pauline.jpg", alt: "Tweet from Pauline P. Narvas: You cooked!" },
                { src: "/tweets/dom.jpg", alt: "Tweet from Dom Sip: I want to buy it. How much?" },
                { src: "/tweets/ese.jpg", alt: "Tweet from Ese Kpeji: Clear the kitchen for this guy" },
                { src: "/tweets/nima.jpg", alt: "Tweet from Nima: This is super dope Peter" },
                { src: "/tweets/anselm.jpg", alt: "Tweet from Anselm Eickhoff: This is really cool and I love the format" },
                { src: "/tweets/cliff.jpg", alt: "Tweet from Cliffinkent: This is awesome!" },
                { src: "/tweets/abdussalam.jpg", alt: "Tweet from Abdussalam Popoola: We met too!!" },
                { src: "/tweets/henry.jpg", alt: "Tweet from Henry: Wow" },
              ].map((tweet) => (
                <div key={tweet.src} className="shrink-0 w-72 rounded-xl border border-border overflow-hidden">
                  <Image
                    src={tweet.src}
                    alt={tweet.alt}
                    width={600}
                    height={300}
                    className="w-full h-auto"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="hidden sm:block columns-2 lg:columns-3 gap-4 space-y-4">
            {[
              { src: "/tweets/maya.jpg", alt: "Tweet from Maya Avendaño: woah cool to see more hardware projects from you!" },
              { src: "/tweets/pauline.jpg", alt: "Tweet from Pauline P. Narvas: You cooked!" },
              { src: "/tweets/dom.jpg", alt: "Tweet from Dom Sip: I want to buy it. How much?" },
              { src: "/tweets/ese.jpg", alt: "Tweet from Ese Kpeji: Clear the kitchen for this guy" },
              { src: "/tweets/nima.jpg", alt: "Tweet from Nima: This is super dope Peter" },
              { src: "/tweets/anselm.jpg", alt: "Tweet from Anselm Eickhoff: This is really cool and I love the format" },
              { src: "/tweets/cliff.jpg", alt: "Tweet from Cliffinkent: This is awesome!" },
              { src: "/tweets/abdussalam.jpg", alt: "Tweet from Abdussalam Popoola: We met too!!" },
              { src: "/tweets/henry.jpg", alt: "Tweet from Henry: Wow" },
            ].map((tweet) => (
              <div key={tweet.src} className="break-inside-avoid rounded-xl border border-border overflow-hidden hover:border-muted/40 transition-colors">
                <Image
                  src={tweet.src}
                  alt={tweet.alt}
                  width={600}
                  height={300}
                  className="w-full h-auto"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AQI States */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-ink mb-6">Six states. One glance.</h2>
          <p className="text-muted mb-16 prose-cap text-lg leading-relaxed">
            The orb colour and bear expression change with the air. You never need to read a number.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {AQI_STATES.map((s) => (
              <div
                key={s.level}
                className="rounded-xl p-5 bg-surface border border-border hover:border-muted/30 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-full mb-4 orb-glow"
                  style={{ backgroundColor: s.color, boxShadow: `0 0 24px ${s.color}` }}
                />
                <div className="text-sm font-bold text-ink mb-0.5">{s.level}</div>
                <div className="text-xs text-muted/60 mb-3">{s.range} AQI</div>
                <div className="text-xs text-muted leading-relaxed">{s.guidance}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sensor Products */}
      <section id="sensor" className="py-24 border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-ink mb-6">Same bear. You choose the brains.</h2>
          <p className="text-muted mb-16 prose-cap text-lg">
            Every Bair1 includes WiFi, BLE, OLED display, and 1 year of Pro software free.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Lite */}
            <div className="rounded-2xl border border-border p-7 flex flex-col">
              <div className="mb-6">
                <h3 className="text-ink font-bold">Bair1 Dev Kit — Lite</h3>
                <p className="text-sm text-muted mt-0.5">1 sensor · Ships now</p>
              </div>
              <div className="bg-surface rounded-lg px-4 py-3 mb-6 border border-border">
                <div className="text-sm font-bold text-ink">Bosch BMV080</div>
                <div className="text-xs text-muted mt-0.5">Photoacoustic — fanless &amp; silent</div>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {[
                  "PM1, PM2.5 & PM10",
                  "Fanless — completely silent",
                  "WiFi + BLE connectivity",
                  "OLED live display",
                  "Over-the-air updates",
                  "1 year Pro software free",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
                    <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mb-5">
                <span className="text-3xl font-bold text-ink" style={{ fontFamily: 'var(--font-display)' }}>£99</span>
                <span className="text-sm text-muted ml-2">free UK shipping</span>
              </div>
              <CheckoutButton
                tier="lite"
                className="border border-border text-ink font-semibold px-6 py-3 rounded-lg text-center hover:bg-surface hover:border-muted transition-colors text-sm cursor-pointer"
              >
                Order Lite Kit
              </CheckoutButton>
            </div>

            {/* Pro — recommended */}
            <div className="rounded-2xl bg-primary/10 border border-primary/30 p-7 flex flex-col relative md:scale-[1.03]">
              <div className="absolute top-5 right-5 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                Recommended
              </div>
              <div className="mb-6">
                <h3 className="text-ink font-bold">Bair1 Dev Kit — Pro</h3>
                <p className="text-sm text-muted mt-0.5">2 sensors · Ships now</p>
              </div>
              <div className="bg-bg rounded-lg px-4 py-3 mb-6 border border-border">
                <div className="text-sm font-bold text-ink">BMV080 + PMSA003I</div>
                <div className="text-xs text-muted mt-0.5">Photoacoustic + laser cross-validation</div>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {[
                  "Everything in Lite, plus:",
                  "Dual-sensor cross-validation",
                  "Laser + photoacoustic fusion",
                  "Higher accuracy in all conditions",
                  "Wildfire smoke detection",
                  "API access included",
                  "1 year Pro software free",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
                    <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mb-5">
                <span className="text-3xl font-bold text-ink" style={{ fontFamily: 'var(--font-display)' }}>£149</span>
                <span className="text-sm text-muted ml-2">free UK shipping</span>
              </div>
              <CheckoutButton
                tier="pro"
                className="bg-primary text-white font-semibold px-6 py-3 rounded-lg text-center hover:bg-primary-hover transition-colors text-sm cursor-pointer"
              >
                Order Pro Kit
              </CheckoutButton>
            </div>

            {/* Max */}
            <div className="rounded-2xl border border-border p-7 flex flex-col">
              <div className="mb-6">
                <h3 className="text-ink font-bold">Bair1 Dev Kit — Max</h3>
                <p className="text-sm text-muted mt-0.5">3 sensors · Ships now</p>
              </div>
              <div className="bg-surface rounded-lg px-4 py-3 mb-6 border border-border">
                <div className="text-sm font-bold text-ink">BMV080 + PMSA003I + SPS30</div>
                <div className="text-xs text-muted mt-0.5">Triple-sensor, research-grade precision</div>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {[
                  "Everything in Pro, plus:",
                  "Sensirion SPS30 long-life laser",
                  "Triple cross-validation",
                  "Research-grade accuracy",
                  "10-year sensor lifespan (SPS30)",
                  "Priority support",
                  "1 year Pro + API free",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
                    <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mb-5">
                <span className="text-3xl font-bold text-ink" style={{ fontFamily: 'var(--font-display)' }}>£229</span>
                <span className="text-sm text-muted ml-2">free UK shipping</span>
              </div>
              <CheckoutButton
                tier="max"
                className="border border-border text-ink font-semibold px-6 py-3 rounded-lg text-center hover:bg-surface hover:border-muted transition-colors text-sm cursor-pointer"
              >
                Order Max Kit
              </CheckoutButton>
            </div>
          </div>

          <p className="text-center text-sm text-muted/60 mt-10">
            All dev kits ship within 5 working days. Includes 1 year of Bair1 Pro software (worth £59.88). Have a promo code? Enter it at checkout.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-ink mb-4">Ready to know your air?</h2>
          <p className="text-muted text-lg mb-10">Open the live dashboard or grab a sensor for your neighbourhood.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="https://app.bair1.live"
              className="bg-primary text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-primary-hover transition-colors"
            >
              Open Dashboard
            </Link>
            <Link
              href="#sensor"
              className="bg-surface text-ink font-semibold px-8 py-3.5 rounded-lg border border-border hover:border-muted transition-colors"
            >
              Get a Sensor
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Image src="/bear-logo.png" alt="Bair1" width={24} height={24} className="object-contain" />
              <span className="text-sm text-muted">
                Bair1 — A HeySalad Product
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted">
              <Link href="https://app.bair1.live" className="hover:text-ink transition-colors">Dashboard</Link>
              <Link href="/firmware" className="hover:text-ink transition-colors">Firmware</Link>
              <a href="mailto:hello@heysalad.app" className="hover:text-ink transition-colors">Contact</a>
              <a href="https://luma.com/1uv1oeuu?tk=CYoskc" target="_blank" rel="noopener noreferrer" className="hover:text-ink transition-colors">Built in London</a>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-muted/40">
            &copy; {new Date().getFullYear()} HeySalad. Know your air.
          </div>
        </div>
      </footer>
    </div>
  );
}
