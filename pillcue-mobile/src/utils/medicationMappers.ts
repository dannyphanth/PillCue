import { Medication, ParsedMedication } from "../types/medication";

const DEFAULT_TIMES: Record<number, string[]> = {
  1: ["09:00"],
  2: ["09:00", "21:00"],
  3: ["08:00", "14:00", "20:00"],
  4: ["08:00", "12:00", "16:00", "20:00"],
};

function sanitizeNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function clampFrequency(value: unknown): number {
  return Math.min(4, Math.max(1, sanitizeNumber(value, 1)));
}

export function getDefaultTimesForFrequency(frequency: number): string[] {
  return DEFAULT_TIMES[frequency] || DEFAULT_TIMES[1];
}

export function normalizeTimeInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function normalizeParsedMedication(
  incoming: Partial<ParsedMedication>,
): ParsedMedication {
  const frequency = clampFrequency(incoming.frequency);
  const defaultTimes = getDefaultTimesForFrequency(frequency);

  return {
    pillName: `${incoming.pillName || ""}`.trim(),
    dosage: sanitizeNumber(incoming.dosage, 1),
    frequency,
    swallowed: Boolean(incoming.swallowed),
    quantity: sanitizeNumber(incoming.quantity, 1),
    time1: normalizeTimeInput(incoming.time1 || "") || defaultTimes[0] || null,
    time2:
      frequency >= 2
        ? normalizeTimeInput(incoming.time2 || "") || defaultTimes[1] || null
        : null,
    time3:
      frequency >= 3
        ? normalizeTimeInput(incoming.time3 || "") || defaultTimes[2] || null
        : null,
    time4:
      frequency >= 4
        ? normalizeTimeInput(incoming.time4 || "") || defaultTimes[3] || null
        : null,
  };
}

export function parsedMedicationToMedication(
  parsed: Partial<ParsedMedication>,
): Medication {
  const normalized = normalizeParsedMedication(parsed);

  return {
    id: `med-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...normalized,
  };
}
