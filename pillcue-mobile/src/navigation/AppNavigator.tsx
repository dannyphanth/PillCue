import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { OcrParseResponse } from "../types/medication";
import CameraScreen from "../screens/CameraScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import MedicationScheduleScreen from "../screens/MedicationScheduleScreen";
import OcrReviewScreen from "../screens/OcrReviewScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ScanBottleScreen from "../screens/ScanBottleScreen";
import { useAuth } from "../context/AuthContext";

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

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const AppStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigatorScreens() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerTintColor: "#183225",
        headerTitleStyle: { fontWeight: "700" },
        headerStyle: { backgroundColor: "#ffffff" },
        contentStyle: { backgroundColor: "#f6f7f3" },
      }}
    >
      <AppStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerTitle: () => <PillCueHeaderTitle />, headerTitleAlign: "center" }}
      />
      <AppStack.Screen
        name="Camera"
        component={CameraScreen}
        options={{ title: "Scan Bottle", headerTransparent: true, headerTintColor: "#ffffff" }}
      />
      <AppStack.Screen
        name="ScanBottle"
        component={ScanBottleScreen}
        options={{ title: "Scan Bottle" }}
      />
      <AppStack.Screen
        name="OcrReview"
        component={OcrReviewScreen}
        options={{ title: "OCR Review" }}
      />
      <AppStack.Screen
        name="MedicationSchedule"
        component={MedicationScheduleScreen}
        options={{ title: "Medication Schedule" }}
      />
    </AppStack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f6f7f3" }}>
        <ActivityIndicator size="large" color="#2f6b52" />
      </View>
    );
  }

  return user ? <AppNavigatorScreens /> : <AuthNavigator />;
}
