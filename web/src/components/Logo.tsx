"use client";

import Image from "next/image";

export default function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const dimensions = {
    small: { img: 32, text: "text-lg" },
    default: { img: 44, text: "text-2xl" },
    large: { img: 64, text: "text-4xl" },
  }[size];

  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/bear-logo.png"
        alt="Bair1 bear mascot"
        width={dimensions.img}
        height={dimensions.img}
        className="object-contain"
        priority
      />
      <span
        className={`${dimensions.text} font-bold tracking-tight text-forest-night`}
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Bair<span className="text-bair-green">1</span>
      </span>
    </div>
  );
}
