export type MedicationTimes = Partial<
  Record<"time1" | "time2" | "time3" | "time4", string | null>
>;

export type Medication = MedicationTimes & {
  id: string;
  pillName: string;
  dosage: number;
  frequency: number;
  swallowed: boolean;
  quantity: number;
  createdAt: string;
};

export type ParsedMedication = MedicationTimes & {
  pillName: string;
  dosage: number;
  frequency: number;
  swallowed: boolean;
  quantity: number;
};

export type DoseStatus = "overdue" | "due-soon" | "upcoming" | "scheduled";

export type ScheduledDose = {
  medicationId: string;
  pillName: string;
  dosage: number;
  quantity: number;
  instanceKey: string;
  sourceTime: string;
  scheduledAt: string;
  status: DoseStatus;
  minutesFromNow: number;
};

export type OcrParseResponse = {
  parsedMedication: ParsedMedication;
  ocrText: string;
  highConfidenceText: string[];
};
