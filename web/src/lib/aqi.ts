export interface AqiState {
  level: string;
  orbColor: string;
  orbColorClass: string;
  bgGradient: string;
  expression: string;
  guidance: string[];
  range: string;
}

export function getAqiState(aqi: number): AqiState {
  if (aqi <= 50) {
    return {
      level: "Good",
      orbColor: "#8DC44A",
      orbColorClass: "bg-clean-air",
      bgGradient: "from-clean-air/20 to-fresh-linen",
      expression: "happy",
      guidance: ["Open your windows", "Enjoy outdoor activity"],
      range: "0–50",
    };
  }
  if (aqi <= 100) {
    return {
      level: "Moderate",
      orbColor: "#F5C542",
      orbColorClass: "bg-amber-yellow",
      bgGradient: "from-amber-yellow/20 to-fresh-linen",
      expression: "neutral",
      guidance: ["Sensitive groups take care outdoors", "Generally safe for most"],
      range: "51–100",
    };
  }
  if (aqi <= 150) {
    return {
      level: "Sensitive",
      orbColor: "#ED8B00",
      orbColorClass: "bg-aqi-orange",
      bgGradient: "from-aqi-orange/20 to-fresh-linen",
      expression: "concerned",
      guidance: ["Sensitive groups limit prolonged outdoor time", "Consider wearing a mask"],
      range: "101–150",
    };
  }
  if (aqi <= 200) {
    return {
      level: "Unhealthy",
      orbColor: "#D63031",
      orbColorClass: "bg-aqi-red",
      bgGradient: "from-aqi-red/20 to-fresh-linen",
      expression: "worried",
      guidance: ["Everyone reduce outdoor exertion", "Keep windows closed"],
      range: "151–200",
    };
  }
  if (aqi <= 300) {
    return {
      level: "Very Unhealthy",
      orbColor: "#6C3483",
      orbColorClass: "bg-aqi-purple",
      bgGradient: "from-aqi-purple/20 to-fresh-linen",
      expression: "alarmed",
      guidance: ["Avoid outdoor activity where possible", "Use air purifiers indoors"],
      range: "201–300",
    };
  }
  return {
    level: "Hazardous",
    orbColor: "#4A4A4A",
    orbColorClass: "bg-aqi-grey",
    bgGradient: "from-aqi-grey/20 to-fresh-linen",
    expression: "distressed",
    guidance: ["Stay indoors", "Close all windows"],
    range: "301+",
  };
}

export function getAqiColor(aqi: number): string {
  if (aqi <= 50) return "#8DC44A";
  if (aqi <= 100) return "#F5C542";
  if (aqi <= 150) return "#ED8B00";
  if (aqi <= 200) return "#D63031";
  if (aqi <= 300) return "#6C3483";
  return "#4A4A4A";
}
