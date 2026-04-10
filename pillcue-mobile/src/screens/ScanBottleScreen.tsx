import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { visionParseBottleImage } from "../services/api/pillCueApi";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ScanBottle">;

export default function ScanBottleScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function chooseImage() {
    setError(null);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleScan() {
    if (!imageUri) {
      setError("Choose a bottle image first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsed = await visionParseBottleImage([imageUri]);
      navigation.navigate("OcrReview", {
        ...parsed,
        imageUri,
      });
    } catch (scanError) {
      const message =
        scanError instanceof Error ? scanError.message : "Unable to parse the image.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Scan a Prescription Bottle</Text>
        <Text style={styles.body}>
          Choose a photo of your prescription label. PillCue will read the text and automatically
          fill in the medication name, dosage, and schedule for you to review before saving.
        </Text>
      </View>

      <Pressable style={styles.cameraButton} onPress={() => navigation.navigate("Camera")}>
        <Text style={styles.cameraButtonText}>Use Live Camera</Text>
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable style={styles.selectButton} onPress={chooseImage}>
        <Text style={styles.selectButtonText}>
          {imageUri ? "Choose a Different Image" : "Choose Bottle Image"}
        </Text>
      </Pressable>

      {imageUri ? (
        <View style={styles.previewCard}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
          <Text style={styles.previewCaption}>Selected bottle image</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.scanButton, loading ? styles.buttonDisabled : null]}
        onPress={handleScan}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.scanButtonText}>Run OCR and Review</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#dce4dc",
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#18231d",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: "#516157",
  },
  cameraButton: {
    backgroundColor: "#173a2d",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  cameraButtonText: {
    color: "#f1c75b",
    fontSize: 15,
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#dce4dc",
  },
  dividerText: {
    color: "#8a9e90",
    fontSize: 13,
    fontWeight: "600",
  },
  selectButton: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cfd8d0",
  },
  selectButtonText: {
    color: "#183225",
    fontSize: 15,
    fontWeight: "700",
  },
  previewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#dce4dc",
  },
  previewImage: {
    width: "100%",
    height: 260,
    borderRadius: 16,
    backgroundColor: "#eef2ec",
  },
  previewCaption: {
    color: "#55665b",
    fontSize: 13,
  },
  errorCard: {
    backgroundColor: "#fdeeee",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#f1c2c2",
  },
  errorText: {
    color: "#8a3131",
    fontSize: 14,
    lineHeight: 20,
  },
  scanButton: {
    backgroundColor: "#2f6b52",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  scanButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
