import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Medication } from "../types/medication";
import { formatTimeLabel } from "../utils/time";

type MedicationCardProps = {
  medication: Medication;
  onPress?: (medication: Medication) => void;
  onDelete?: (id: string) => void;
};

function cleanPillName(name: string): string {
  return name.replace(/^[\s:]+/, "").trim();
}

function MedicationCardContent({
  medication,
  onDelete,
}: {
  medication: Medication;
  onDelete?: (id: string) => void;
}) {
  const name = cleanPillName(medication.pillName) || "Unknown Medication";
  const initials = name.slice(0, 2).toUpperCase();

  const times = [medication.time1, medication.time2, medication.time3, medication.time4]
    .filter(Boolean)
    .map((t) => formatTimeLabel(t || null));

  function confirmDelete() {
    Alert.alert(
      "Remove Medication",
      `Remove ${name} from your list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => onDelete?.(medication.id),
        },
      ],
    );
  }

  return (
    <View style={styles.inner}>
      <View style={styles.accentBar} />

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>{initials}</Text>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={1}>{name}</Text>
            <Text style={styles.subtitle}>
              {medication.dosage} pill{medication.dosage !== 1 ? "s" : ""} · {medication.quantity} remaining
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{medication.frequency}x daily</Text>
          </View>
          {onDelete && (
            <Pressable style={styles.deleteButton} onPress={confirmDelete} hitSlop={8}>
              <Text style={styles.deleteIcon}>✕</Text>
            </Pressable>
          )}
        </View>

        {times.length > 0 && (
          <View style={styles.timesRow}>
            {times.map((t, i) => (
              <View key={i} style={styles.timeChip}>
                <Text style={styles.timeChipText}>{t}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

export default function MedicationCard({ medication, onPress, onDelete }: MedicationCardProps) {
  if (onPress) {
    return (
      <Pressable
        onPress={() => onPress(medication)}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <MedicationCardContent medication={medication} onDelete={onDelete} />
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      <MedicationCardContent medication={medication} onDelete={onDelete} />
    </View>
  );
}

const ACCENT_COLORS = ["#2f6b52", "#3d7a60", "#1e5740", "#4a8a6e"];

function accentColor(name: string) {
  const code = name.charCodeAt(0) || 0;
  return ACCENT_COLORS[code % ACCENT_COLORS.length];
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dce4dc",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.88,
  },
  inner: {
    flexDirection: "row",
  },
  accentBar: {
    width: 5,
    backgroundColor: "#2f6b52",
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#e8f2ed",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2f6b52",
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#18231d",
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7e72",
  },
  badge: {
    backgroundColor: "#ebf5ef",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    color: "#2f6b52",
    fontSize: 12,
    fontWeight: "700",
  },
  timesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  timeChip: {
    backgroundColor: "#f0f4f1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#dce4dc",
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2c4a38",
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fdecea",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  deleteIcon: {
    fontSize: 12,
    fontWeight: "700",
    color: "#c0392b",
  },
});
