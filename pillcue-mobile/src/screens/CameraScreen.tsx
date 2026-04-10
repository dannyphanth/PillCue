import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { visionParseBottleImage } from "../services/api/pillCueApi";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Camera">;

const MAX_PHOTOS = 3;

export default function CameraScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const cameraRef = useRef<CameraView>(null);

  async function handleCapture() {
    if (!cameraRef.current || processing) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: false,
        // keep EXIF so the backend can correct orientation
      });
      if (!photo) return;

      const newPhotos = [...photos, photo.uri];
      setPhotos(newPhotos);
      setErrorMsg("");

      if (newPhotos.length >= MAX_PHOTOS) {
        await analyzePhotos(newPhotos);
      }
    } catch {
      setErrorMsg("Could not capture photo. Try again.");
    }
  }

  async function analyzePhotos(uris: string[]) {
    if (uris.length === 0) return;
    setProcessing(true);
    setErrorMsg("");

    try {
      const parsed = await visionParseBottleImage(uris);
      navigation.replace("OcrReview", { ...parsed, imageUri: uris[0] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed.";
      setErrorMsg(msg);
      setProcessing(false);
    }
  }

  function resetCaptures() {
    setPhotos([]);
    setErrorMsg("");
  }

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionBody}>
          PillCue needs the camera to read prescription labels.
        </Text>
        <Pressable style={styles.grantButton} onPress={requestPermission}>
          <Text style={styles.grantButtonText}>Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  const hasPhotos = photos.length > 0;
  const canAddMore = photos.length < MAX_PHOTOS;

  return (
    <View style={styles.container}>
      {/* Camera sits behind the overlay as a sibling to avoid the children warning */}
      <CameraView style={StyleSheet.absoluteFill} facing="back" ref={cameraRef} />

      <View style={styles.overlay}>
        {/* Top dim — shows captured thumbnails once photos exist */}
        <View style={styles.topArea}>
          {hasPhotos && (
            <View style={styles.thumbnailRow}>
              {photos.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.thumbnail} />
              ))}
              {Array.from({ length: MAX_PHOTOS - photos.length }).map((_, i) => (
                <View key={`slot-${i}`} style={styles.thumbnailSlot} />
              ))}
            </View>
          )}
        </View>

        {/* Middle — transparent scan window with corner brackets */}
        <View style={styles.middleRow}>
          <View style={styles.sideDim} />
          <View style={styles.scanWindow}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.sideDim} />
        </View>

        {/* Bottom — context-aware controls */}
        <View style={styles.bottomArea}>
          {processing ? (
            <>
              <ActivityIndicator color="#f1c75b" size="large" />
              <Text style={styles.processingTitle}>
                Analyzing {photos.length} angle{photos.length > 1 ? "s" : ""}…
              </Text>
              <Text style={styles.processingHint}>Gemini is reading your label</Text>
            </>
          ) : errorMsg ? (
            <>
              <Text style={styles.errorText}>{errorMsg}</Text>
              <Pressable style={styles.primaryButton} onPress={resetCaptures}>
                <Text style={styles.primaryButtonText}>Start Over</Text>
              </Pressable>
            </>
          ) : hasPhotos ? (
            <>
              <Text style={styles.hintText}>
                {canAddMore
                  ? `${photos.length} of ${MAX_PHOTOS} angles captured — rotate the bottle and add another for better accuracy`
                  : `${MAX_PHOTOS} angles captured — ready to analyze`}
              </Text>
              <View style={styles.buttonRow}>
                {canAddMore && (
                  <Pressable style={styles.outlineButton} onPress={handleCapture}>
                    <Text style={styles.outlineButtonText}>+ Add Angle</Text>
                  </Pressable>
                )}
                <Pressable
                  style={styles.primaryButton}
                  onPress={() => analyzePhotos(photos)}
                >
                  <Text style={styles.primaryButtonText}>Analyze</Text>
                </Pressable>
              </View>
              <Pressable style={styles.textLink} onPress={resetCaptures}>
                <Text style={styles.textLinkText}>Start over</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.hintText}>
                Frame the prescription label, then tap Scan
              </Text>
              <Pressable style={styles.shutterButton} onPress={handleCapture}>
                <View style={styles.shutterInner} />
              </Pressable>
              <Pressable
                style={styles.textLink}
                onPress={() => navigation.replace("ScanBottle")}
              >
                <Text style={styles.textLinkText}>Choose from Gallery instead</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  overlay: { flex: 1 },

  topArea: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 14,
  },
  thumbnailRow: {
    flexDirection: "row",
    gap: 10,
  },
  thumbnail: {
    width: 52,
    height: 68,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#f1c75b",
    backgroundColor: "#111",
  },
  thumbnailSlot: {
    width: 52,
    height: 68,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(241,199,91,0.3)",
    borderStyle: "dashed",
  },

  middleRow: { flexDirection: "row", height: 220 },
  sideDim: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  scanWindow: { width: 300, backgroundColor: "transparent" },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: "#f1c75b",
    borderWidth: CORNER_THICKNESS,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  bottomArea: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 28,
  },

  hintText: { color: "#e8ede9", fontSize: 14, textAlign: "center", lineHeight: 20 },

  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#ffffff" },

  buttonRow: { flexDirection: "row", gap: 12 },

  primaryButton: {
    backgroundColor: "#2f6b52",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  primaryButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },

  outlineButton: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: "#f1c75b",
  },
  outlineButtonText: { color: "#f1c75b", fontSize: 15, fontWeight: "700" },

  textLink: { paddingVertical: 4 },
  textLinkText: { color: "#afd2bc", fontSize: 13, textDecorationLine: "underline" },

  processingTitle: { color: "#ffffff", fontSize: 18, fontWeight: "700" },
  processingHint: { color: "#afd2bc", fontSize: 13 },

  errorText: { color: "#f4a8a8", fontSize: 14, textAlign: "center", lineHeight: 20 },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#f6f7f3",
    gap: 16,
  },
  permissionTitle: { fontSize: 22, fontWeight: "800", color: "#18231d", textAlign: "center" },
  permissionBody: { fontSize: 15, color: "#516157", textAlign: "center", lineHeight: 22 },
  grantButton: {
    backgroundColor: "#2f6b52",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  grantButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
});
