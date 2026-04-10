import { Medication } from "../types/medication";

export const sampleMedications: Medication[] = [
  {
    id: "sample-aspirin",
    pillName: "Aspirin",
    dosage: 1,
    quantity: 30,
    frequency: 2,
    swallowed: false,
    time1: "08:00",
    time2: "20:00",
    createdAt: "2026-03-23T00:00:00.000Z",
  },
  {
    id: "sample-vitamin-d",
    pillName: "Vitamin D",
    dosage: 1,
    quantity: 60,
    frequency: 1,
    swallowed: false,
    time1: "12:00",
    createdAt: "2026-03-23T00:00:00.000Z",
  },
  {
    id: "sample-ibuprofen",
    pillName: "Ibuprofen",
    dosage: 1,
    quantity: 20,
    frequency: 3,
    swallowed: false,
    time1: "06:00",
    time2: "14:00",
    time3: "22:00",
    createdAt: "2026-03-23T00:00:00.000Z",
  },
];
