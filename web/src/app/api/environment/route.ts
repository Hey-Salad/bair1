import { NextRequest, NextResponse } from "next/server";
import {
  getAirQuality,
  getPollenForecast,
  getWeather,
  reverseGeocode,
} from "@/lib/google-env";

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") ?? "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  const location = { lat, lng };

  const [airQuality, pollen, weather, address] = await Promise.all([
    getAirQuality(location),
    getPollenForecast(location, 3),
    getWeather(location),
    reverseGeocode(location),
  ]);

  return NextResponse.json({
    airQuality,
    pollen,
    weather,
    address,
    location,
    fetchedAt: new Date().toISOString(),
  });
}
