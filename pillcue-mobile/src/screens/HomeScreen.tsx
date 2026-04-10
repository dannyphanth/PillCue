import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import EmptyState from "../components/EmptyState";
import MedicationCard from "../components/MedicationCard";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  deleteMedication,
  getStoredMedications,
  seedSampleMedicationsIfEmpty,
} from "../services/storage/medicationStorage";
import { Medication } from "../types/medication";
import { getNextDose } from "../utils/schedule";
import { formatMinutesFromNow, formatTimeLabel } from "../utils/time";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [medications, setMedications] = useState<Medication[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadData() {
        const seeded = await seedSampleMedicationsIfEmpty();
        const stored = seeded.length > 0 ? seeded : await getStoredMedications();
        if (active) {
          setMedications(stored);
        }
      }

      loadData();

      return () => {
        active = false;
      };
    }, []),
  );

  const nextDose = getNextDose(medications);

  async function handleDelete(id: string) {
    const updated = await deleteMedication(id);
    setMedications(updated);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Your medication companion</Text>
        <Text style={styles.heroTitle}>Scan a bottle. Review the label. Stay on schedule.</Text>
        <Text style={styles.heroBody}>
          Point your camera at any prescription bottle. PillCue reads the label, extracts the
          dosage and timing, and adds it to your personal schedule in seconds.
        </Text>
        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.primaryButton, styles.buttonFlex]}
            onPress={() => navigation.navigate("Camera")}
          >
            <Text style={styles.primaryButtonText}>Scan Bottle</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryButton, styles.buttonFlex]}
            onPress={() => navigation.navigate("MedicationSchedule")}
          >
            <Text style={styles.secondaryButtonText}>View Schedule</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Stored Medications</Text>
          <Text style={styles.summaryValue}>{medications.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Next Dose</Text>
          <Text style={styles.summaryValue}>
            {nextDose ? formatTimeLabel(nextDose.sourceTime) : "None"}
          </Text>
          {nextDose ? (
            <Text style={styles.summaryHint}>
              {nextDose.pillName} in {formatMinutesFromNow(nextDose.minutesFromNow)}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Current Medications</Text>
        <Text style={styles.sectionHint}>Saved on your device</Text>
      </View>

      <View style={styles.list}>
        {medications.length === 0 ? (
          <EmptyState
            title="No medications saved yet"
            message="Scan a bottle or keep the sample data seeded for class demos."
          />
        ) : (
          medications.map((medication) => (
            <MedicationCard
              key={medication.id}
              medication={medication}
              onDelete={handleDelete}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 18,
  },
  heroCard: {
    backgroundColor: "#173a2d",
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  eyebrow: {
    color: "#afd2bc",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    flex: 1,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  heroBody: {
    color: "#d8e6dd",
    fontSize: 15,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  buttonFlex: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: "#f1c75b",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#1c211f",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#234d3b",
    borderWidth: 1,
    borderColor: "#436c58",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dce4dc",
    gap: 4,
  },
  summaryLabel: {
    color: "#5a6a60",
    fontSize: 13,
    fontWeight: "600",
  },
  summaryValue: {
    color: "#18231d",
    fontSize: 24,
    fontWeight: "800",
  },
  summaryHint: {
    color: "#2f6b52",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    color: "#18231d",
    fontSize: 20,
    fontWeight: "800",
  },
  sectionHint: {
    color: "#5a6a60",
    fontSize: 14,
  },
  list: {
    gap: 12,
  },
});
