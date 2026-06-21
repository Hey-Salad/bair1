"use client";

export default function CheckoutButton({
  tier,
  children,
  className,
}: {
  tier: string;
  children: React.ReactNode;
  className: string;
}) {
  async function handleCheckout() {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <button onClick={handleCheckout} className={className}>
      {children}
    </button>
  );
}
