import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import EmptyState from "../components/EmptyState";
import ScheduleDoseCard from "../components/ScheduleDoseCard";
import { getStoredMedications } from "../services/storage/medicationStorage";
import { Medication, ScheduledDose } from "../types/medication";
import { buildDoseSchedule } from "../utils/schedule";

export default function MedicationScheduleScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [schedule, setSchedule] = useState<ScheduledDose[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadSchedule() {
        const stored = await getStoredMedications();
        if (!active) {
          return;
        }

        setMedications(stored);
        setSchedule(buildDoseSchedule(stored));
      }

      loadSchedule();

      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Upcoming Doses</Text>
        <Text style={styles.headerBody}>
          All your medications in one view, sorted by the next dose time so you always know
          what to take and when.
        </Text>
        <Text style={styles.headerFootnote}>
          {medications.length} medication(s) · {schedule.length} dose(s) scheduled
        </Text>
      </View>

      <View style={styles.list}>
        {schedule.length === 0 ? (
          <EmptyState
            title="No schedule yet"
            message="Save at least one medication to generate dose times."
          />
        ) : (
          schedule.map((dose) => <ScheduleDoseCard key={dose.instanceKey} dose={dose} />)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
  },
  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#dce4dc",
    gap: 8,
  },
  headerTitle: {
    color: "#18231d",
    fontSize: 24,
    fontWeight: "800",
  },
  headerBody: {
    color: "#516157",
    fontSize: 15,
    lineHeight: 22,
  },
  headerFootnote: {
    color: "#2f6b52",
    fontSize: 13,
    fontWeight: "700",
  },
  list: {
    gap: 12,
  },
});
