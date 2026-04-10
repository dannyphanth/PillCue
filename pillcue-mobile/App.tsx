import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import AppNavigator from "./src/navigation/AppNavigator";

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#f6f7f3",
    card: "#ffffff",
    text: "#16231c",
    primary: "#2f6b52",
    border: "#d6ddd7",
  },
};

export default function App() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style="dark" />
      <AppNavigator />
    </NavigationContainer>
  );
}
