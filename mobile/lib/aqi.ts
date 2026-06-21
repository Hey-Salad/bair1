// ---------------------------------------------------------------------------
// AQI level logic — copied exactly from the Bair1 spec.
// ---------------------------------------------------------------------------

export interface AqiLevel {
  label: string;
  color: string;
  /** Bear mascot expression key */
  mood: 'happy' | 'neutral' | 'wary' | 'unwell' | 'sick' | 'danger';
  min: number;
  max: number;
}

export const AQI_LEVELS: AqiLevel[] = [
  { label: 'Good', color: '#8DC44A', mood: 'happy', min: 0, max: 50 },
  { label: 'Moderate', color: '#F5C542', mood: 'neutral', min: 51, max: 100 },
  { label: 'Sensitive', color: '#ED8B00', mood: 'wary', min: 101, max: 150 },
  { label: 'Unhealthy', color: '#D63031', mood: 'unwell', min: 151, max: 200 },
  { label: 'Very Unhealthy', color: '#6C3483', mood: 'sick', min: 201, max: 300 },
  { label: 'Hazardous', color: '#7D1128', mood: 'danger', min: 301, max: 500 },
];

export function getAqiLevel(aqi: number): AqiLevel {
  const clamped = Math.max(0, Math.min(500, aqi));
  return (
    AQI_LEVELS.find((l) => clamped >= l.min && clamped <= l.max) ??
    AQI_LEVELS[AQI_LEVELS.length - 1]
  );
}

export function aqiColor(aqi: number): string {
  return getAqiLevel(aqi).color;
}

export function aqiMarkerColor(aqi: number): 'green' | 'yellow' | 'orange' | 'red' | 'purple' {
  const level = getAqiLevel(aqi);
  switch (level.label) {
    case 'Good':
      return 'green';
    case 'Moderate':
      return 'yellow';
    case 'Sensitive':
      return 'orange';
    case 'Unhealthy':
      return 'red';
    default:
      return 'purple';
  }
}

// Health guidance tips per level (general population).
export function getGuidance(aqi: number): string[] {
  const level = getAqiLevel(aqi);
  switch (level.label) {
    case 'Good':
      return [
        'Air quality is healthy — enjoy the outdoors freely.',
        'Great conditions for outdoor exercise.',
        'No precautions needed for any group.',
      ];
    case 'Moderate':
      return [
        'Air quality is acceptable for most people.',
        'Unusually sensitive individuals should watch for symptoms.',
        'A good day for most outdoor activity.',
      ];
    case 'Sensitive':
      return [
        'Sensitive groups should limit prolonged outdoor exertion.',
        'Consider moving longer workouts indoors.',
        'Keep windows closed during peak hours.',
      ];
    case 'Unhealthy':
      return [
        'Everyone may begin to feel effects — reduce outdoor activity.',
        'Sensitive groups should stay indoors.',
        'Wear a mask if you must be outside for long.',
      ];
    case 'Very Unhealthy':
      return [
        'Avoid outdoor exertion — health warnings in effect.',
        'Run an air purifier indoors if available.',
        'Keep all windows and doors closed.',
      ];
    default:
      return [
        'Hazardous air — stay indoors with filtration.',
        'Avoid all outdoor activity.',
        'Follow any local emergency guidance.',
      ];
  }
}
