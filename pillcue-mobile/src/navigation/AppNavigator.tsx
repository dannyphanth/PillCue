import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Image, StyleSheet, Text, View } from "react-native";
import { OcrParseResponse } from "../types/medication";
import CameraScreen from "../screens/CameraScreen";
import HomeScreen from "../screens/HomeScreen";
import MedicationScheduleScreen from "../screens/MedicationScheduleScreen";
import OcrReviewScreen from "../screens/OcrReviewScreen";
import ScanBottleScreen from "../screens/ScanBottleScreen";

function PillCueHeaderTitle() {
  return (
    <View style={headerStyles.row}>
      <Image source={require("../../assets/icon.png")} style={headerStyles.logo} />
      <Text style={headerStyles.title}>PillCue</Text>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 10 },
  title: { fontSize: 26, fontWeight: "800", color: "#183225" },
});

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  ScanBottle: undefined;
  OcrReview: OcrParseResponse & { imageUri?: string };
  MedicationSchedule: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: "#183225",
        headerTitleStyle: {
          fontWeight: "700",
        },
        headerStyle: {
          backgroundColor: "#ffffff",
        },
        contentStyle: {
          backgroundColor: "#f6f7f3",
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerTitle: () => <PillCueHeaderTitle />, headerTitleAlign: "center" }}
      />
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{ title: "Scan Bottle", headerTransparent: true, headerTintColor: "#ffffff" }}
      />
      <Stack.Screen
        name="ScanBottle"
        component={ScanBottleScreen}
        options={{ title: "Scan Bottle" }}
      />
      <Stack.Screen
        name="OcrReview"
        component={OcrReviewScreen}
        options={{ title: "OCR Review" }}
      />
      <Stack.Screen
        name="MedicationSchedule"
        component={MedicationScheduleScreen}
        options={{ title: "Medication Schedule" }}
      />
    </Stack.Navigator>
  );
}
