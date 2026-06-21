import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Order Confirmed — Bair1",
};

export default function OrderSuccess() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-bg">
      <Image
        src="/bear-logo.png"
        alt="Bair1 bear"
        width={120}
        height={120}
        className="object-contain mb-8"
      />
      <h1 className="text-ink mb-4 text-center">The bear is on its way.</h1>
      <p className="text-muted text-lg text-center max-w-md mb-3">
        Thanks for your pre-order. You&apos;ll receive a confirmation email from Stripe shortly.
      </p>
      <p className="text-muted text-center max-w-md mb-10">
        Your Bair1 sensor ships in July 2026. We&apos;ll email you with tracking details
        and setup instructions before it arrives.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/dashboard"
          className="bg-primary text-white font-semibold px-7 py-3.5 rounded-lg hover:bg-primary-hover transition-colors"
        >
          Explore Dashboard
        </Link>
        <Link
          href="/"
          className="bg-ink/5 text-ink font-semibold px-7 py-3.5 rounded-lg hover:bg-ink/10 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
