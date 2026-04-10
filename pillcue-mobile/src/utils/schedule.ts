import { Medication, ScheduledDose } from "../types/medication";

function getMedicationTimes(medication: Medication): string[] {
  const collected = [
    medication.time1,
    medication.time2,
    medication.time3,
    medication.time4,
  ].filter((value): value is string => Boolean(value));

  return collected.slice(0, medication.frequency);
}

function getDoseStatus(minutesFromNow: number): ScheduledDose["status"] {
  if (minutesFromNow < 0) {
    return "overdue";
  }

  if (minutesFromNow <= 30) {
    return "due-soon";
  }

  if (minutesFromNow <= 60) {
    return "upcoming";
  }

  return "scheduled";
}

function buildDateForTime(time: string, now: Date): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const scheduledAt = new Date(now);
  scheduledAt.setHours(hours, minutes, 0, 0);
  return scheduledAt;
}

export function buildDoseSchedule(
  medications: Medication[],
  now = new Date(),
): ScheduledDose[] {
  return medications
    .flatMap((medication) => {
      const times = getMedicationTimes(medication);

      return times.map((time, index) => {
        const scheduledAt = buildDateForTime(time, now);

        if (scheduledAt < now) {
          scheduledAt.setDate(scheduledAt.getDate() + 1);
        }

        const minutesFromNow = Math.floor(
          (scheduledAt.getTime() - now.getTime()) / (1000 * 60),
        );

        return {
          medicationId: medication.id,
          pillName: medication.pillName,
          dosage: medication.dosage,
          quantity: medication.quantity,
          instanceKey: `${medication.id}-${index + 1}-${time}`,
          sourceTime: time,
          scheduledAt: scheduledAt.toISOString(),
          status: getDoseStatus(minutesFromNow),
          minutesFromNow,
        };
      });
    })
    .sort((left, right) =>
      new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
    );
}

export function getNextDose(
  medications: Medication[],
  now = new Date(),
): ScheduledDose | null {
  const schedule = buildDoseSchedule(medications, now);
  return schedule[0] || null;
}
