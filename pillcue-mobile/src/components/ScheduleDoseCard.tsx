import { StyleSheet, Text, View } from "react-native";
import { ScheduledDose } from "../types/medication";
import {
  formatMinutesFromNow,
  formatRelativeDoseLabel,
  formatTimeLabel,
} from "../utils/time";

const statusStyles = {
  overdue: {
    borderColor: "#b43f3f",
    chip: "#fbe7e7",
    text: "#8f2d2d",
    label: "Overdue",
  },
  "due-soon": {
    borderColor: "#d08a2d",
    chip: "#fff1dc",
    text: "#9a5d10",
    label: "Due Soon",
  },
  upcoming: {
    borderColor: "#4d74b8",
    chip: "#e8effd",
    text: "#2e4f89",
    label: "Upcoming",
  },
  scheduled: {
    borderColor: "#47845f",
    chip: "#e7f6ec",
    text: "#2f6b52",
    label: "Scheduled",
  },
} as const;

type ScheduleDoseCardProps = {
  dose: ScheduledDose;
};

export default function ScheduleDoseCard({ dose }: ScheduleDoseCardProps) {
  const scheduledAt = new Date(dose.scheduledAt);
  const palette = statusStyles[dose.status];

  return (
    <View style={[styles.card, { borderLeftColor: palette.borderColor }]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{dose.pillName}</Text>
        <View style={[styles.badge, { backgroundColor: palette.chip }]}>
          <Text style={[styles.badgeText, { color: palette.text }]}>{palette.label}</Text>
        </View>
      </View>
      <Text style={styles.meta}>Dose: {dose.dosage} pill(s)</Text>
      <Text style={styles.meta}>Bottle label time: {formatTimeLabel(dose.sourceTime)}</Text>
      <Text style={styles.meta}>
        Scheduled for {formatRelativeDoseLabel(scheduledAt)}
      </Text>
      <Text style={styles.meta}>Starts in {formatMinutesFromNow(dose.minutesFromNow)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dce4dc",
    borderLeftWidth: 6,
    gap: 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#18231d",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  meta: {
    fontSize: 14,
    color: "#49584e",
  },
});
