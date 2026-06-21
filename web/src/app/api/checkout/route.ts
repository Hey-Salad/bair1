import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const PRODUCTS: Record<string, { name: string; description: string; price: number }> = {
  lite: {
    name: "Bair1 Dev Kit — Lite",
    description: "1 sensor (Bosch BMV080). ESP32-S3, OLED display, teddy bear enclosure. Ships immediately.",
    price: 9900,
  },
  pro: {
    name: "Bair1 Dev Kit — Pro",
    description: "2 sensors (BMV080 + PMSA003I). Dual cross-validation, ESP32-S3, OLED, teddy bear enclosure. Ships immediately.",
    price: 14900,
  },
  max: {
    name: "Bair1 Dev Kit — Max",
    description: "3 sensors (BMV080 + PMSA003I + SPS30). Research-grade, ESP32-S3, OLED, teddy bear enclosure. Ships immediately.",
    price: 22900,
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tier = body.tier as string;

    const product = PRODUCTS[tier];
    if (!product) {
      return NextResponse.json({ error: "Invalid product tier" }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not set");
      return NextResponse.json({ error: "Payment not configured" }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const origin = req.headers.get("origin") || "https://bair1.live";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      allow_promotion_codes: true,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: product.name,
              description: product.description,
              images: ["https://bair1.live/bear-sensor-front.jpg"],
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      shipping_address_collection: {
        allowed_countries: ["GB", "US", "DE", "FR", "NL", "IE", "SE", "NO", "DK", "FI", "AT", "CH", "BE", "ES", "IT", "PT", "EE"],
      },
      success_url: `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#sensor`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
