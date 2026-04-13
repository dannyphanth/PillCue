import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { addMedication } from "../services/storage/medicationStorage";
import { ParsedMedication } from "../types/medication";
import {
  clampFrequency,
  normalizeParsedMedication,
  parsedMedicationToMedication,
} from "../utils/medicationMappers";

type ReviewRoute = RouteProp<RootStackParamList, "OcrReview">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "OcrReview">;
type FormState = ParsedMedication;
const TIME_KEYS = ["time1", "time2", "time3", "time4"] as const;

export default function OcrReviewScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ReviewRoute>();
  const [form, setForm] = useState<FormState>(
    normalizeParsedMedication(route.params.parsedMedication),
  );

  const visibleTimeFields = useMemo(() => {
    const clamped = clampFrequency(form.frequency);
    return TIME_KEYS.slice(0, clamped);
  }, [form.frequency]);

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    if (!form.pillName.trim()) {
      Alert.alert("Medication name required", "Enter a medication name before saving.");
      return;
    }

    const medication = parsedMedicationToMedication(form);
    await addMedication(medication);

    Alert.alert("Saved", "Medication added to your schedule.", [
      {
        text: "View Schedule",
        onPress: () => navigation.navigate("MedicationSchedule"),
      },
      {
        text: "Back Home",
        onPress: () => navigation.navigate("Home"),
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>Review Before Saving</Text>
        <Text style={styles.body}>
          Check the extracted details below. You can correct any field before adding this
          medication to your schedule.
        </Text>
      </View>

      {route.params.imageUri ? (
        <Image source={{ uri: route.params.imageUri }} style={styles.previewImage} />
      ) : null}

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Medication Details</Text>

        <Field
          label="Medication Name"
          value={form.pillName}
          onChangeText={(value) => updateField("pillName", value)}
          placeholder="Metformin"
        />
        <Field
          label="Dosage"
          value={String(form.dosage)}
          onChangeText={(value) => updateField("dosage", Number(value) || 1)}
          keyboardType="number-pad"
        />
        <Field
          label="Frequency Per Day"
          value={String(form.frequency)}
          onChangeText={(value) => updateField("frequency", Number(value) || 1)}
          keyboardType="number-pad"
        />
        <Field
          label="Bottle Quantity"
          value={String(form.quantity)}
          onChangeText={(value) => updateField("quantity", Number(value) || 1)}
          keyboardType="number-pad"
        />

        {visibleTimeFields.map((timeKey, index) => (
          <Field
            key={timeKey}
            label={`Dose Time ${index + 1} (HH:MM)`}
            value={form[timeKey] || ""}
            onChangeText={(value) => updateField(timeKey, value)}
            placeholder="08:00"
          />
        ))}

        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.fieldLabel}>Already swallowed</Text>
            <Text style={styles.fieldHint}>Preserved from the original medication shape</Text>
          </View>
          <Switch
            value={form.swallowed}
            onValueChange={(value) => updateField("swallowed", value)}
            trackColor={{ false: "#d8ddd8", true: "#6ea987" }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Extracted OCR Text</Text>
        <Text style={styles.ocrText}>{route.params.ocrText || "No OCR text returned."}</Text>
      </View>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Medication</Text>
      </Pressable>
    </ScrollView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "number-pad";
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: FieldProps) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={styles.input}
      />
    </View>
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
  title: {
    color: "#18231d",
    fontSize: 24,
    fontWeight: "800",
  },
  body: {
    color: "#516157",
    fontSize: 15,
    lineHeight: 22,
  },
  previewImage: {
    width: "100%",
    height: 240,
    borderRadius: 20,
    backgroundColor: "#eef2ec",
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#dce4dc",
    gap: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#18231d",
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    color: "#223027",
    fontSize: 14,
    fontWeight: "700",
  },
  fieldHint: {
    color: "#627167",
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cfd8d0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#18231d",
    backgroundColor: "#fbfcfb",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  switchCopy: {
    flex: 1,
    gap: 2,
  },
  ocrText: {
    color: "#49584e",
    fontSize: 14,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: "#2f6b52",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
