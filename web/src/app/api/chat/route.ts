import { streamText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getLatestReading, getReadingsInRange } from "@/lib/dynamo";
import { getAllDevicesRegistry } from "@/lib/devices";
import { getAirQuality, getWeather, getPollenForecast } from "@/lib/google-env";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are Bair, an AI air quality assistant embedded in the Bair1 dashboard. You have access to real-time sensor data, Google environmental APIs (air quality, weather, pollen), and device information.

Be concise, friendly, and data-driven. When users ask about air quality, proactively fetch relevant data using your tools. Format numbers clearly and give actionable health advice.

When presenting AQI data:
- 0-50: Good (green) - safe for everyone
- 51-100: Moderate (yellow) - sensitive groups take care
- 101-150: Sensitive (orange) - reduce outdoor time
- 151-200: Unhealthy (red) - everyone reduce exertion
- 201-300: Very Unhealthy (purple) - avoid outdoors
- 301+: Hazardous (maroon) - stay indoors

Always cite whether data comes from "your sensor" or "Google Air Quality API".`,
    messages,
    tools: {
      getSensorData: {
        description: "Get the latest reading from a specific sensor device",
        inputSchema: z.object({
          deviceId: z.string().describe("The sensor device ID"),
        }),
        execute: async ({ deviceId }: { deviceId: string }) => {
          const reading = await getLatestReading(deviceId);
          if (!reading) return { error: "No data for this device" };
          return reading;
        },
      },
      getSensorHistory: {
        description: "Get sensor readings for a date range",
        inputSchema: z.object({
          deviceId: z.string(),
          hoursBack: z.number().default(24).describe("How many hours of history to fetch"),
        }),
        execute: async ({ deviceId, hoursBack }: { deviceId: string; hoursBack: number }) => {
          const to = new Date().toISOString();
          const from = new Date(Date.now() - hoursBack * 3600000).toISOString();
          const readings = await getReadingsInRange(deviceId, from, to);
          if (readings.length === 0) return { error: "No readings in range" };
          const aqis = readings.map((r) => r.aqi);
          return {
            count: readings.length,
            avgAqi: Math.round(aqis.reduce((a, b) => a + b, 0) / aqis.length),
            minAqi: Math.min(...aqis),
            maxAqi: Math.max(...aqis),
            latest: readings[0],
            oldest: readings[readings.length - 1],
          };
        },
      },
      listDevices: {
        description: "List all registered sensor devices",
        inputSchema: z.object({}),
        execute: async () => {
          const devices = await getAllDevicesRegistry();
          return devices.map((d) => ({
            deviceId: d.deviceId,
            name: d.name,
            location: d.location,
            status: d.status,
            lat: d.lat,
            lng: d.lng,
          }));
        },
      },
      getGoogleAirQuality: {
        description: "Get Google Air Quality API data for a location (provides official AQI, pollutant concentrations, health recommendations)",
        inputSchema: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        execute: async ({ lat, lng }: { lat: number; lng: number }) => {
          const data = await getAirQuality({ lat, lng });
          if (!data) return { error: "Google AQ API unavailable" };
          return data;
        },
      },
      getWeatherData: {
        description: "Get current weather conditions for a location",
        inputSchema: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        execute: async ({ lat, lng }: { lat: number; lng: number }) => {
          const data = await getWeather({ lat, lng });
          if (!data) return { error: "Weather API unavailable" };
          return data;
        },
      },
      getPollenData: {
        description: "Get pollen forecast for a location (grass, tree, weed levels)",
        inputSchema: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        execute: async ({ lat, lng }: { lat: number; lng: number }) => {
          const data = await getPollenForecast({ lat, lng }, 3);
          if (!data.length) return { error: "Pollen API unavailable" };
          return data;
        },
      },
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
