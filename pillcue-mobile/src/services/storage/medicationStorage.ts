import AsyncStorage from "@react-native-async-storage/async-storage";
import { sampleMedications } from "../../data/sampleMedications";
import { Medication } from "../../types/medication";

const STORAGE_KEY = "pillcue.medications";

export async function getStoredMedications(): Promise<Medication[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as Medication[];
  } catch {
    return [];
  }
}

export async function saveMedications(medications: Medication[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(medications));
}

export async function seedSampleMedicationsIfEmpty(): Promise<Medication[]> {
  const existing = await getStoredMedications();

  if (existing.length > 0) {
    return existing;
  }

  await saveMedications(sampleMedications);
  return sampleMedications;
}

export async function addMedication(medication: Medication): Promise<Medication[]> {
  const existing = await getStoredMedications();
  const updated = [medication, ...existing];
  await saveMedications(updated);
  return updated;
}

export async function deleteMedication(id: string): Promise<Medication[]> {
  const existing = await getStoredMedications();
  const updated = existing.filter((m) => m.id !== id);
  await saveMedications(updated);
  return updated;
}
