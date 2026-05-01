import { initializeApp } from "firebase/app";
import { browserLocalPersistence, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { Platform } from "react-native";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBA6lKJR2IFgLYo_1ejvTbJ3go8gboJfZ8",
  authDomain: "pillcue.firebaseapp.com",
  projectId: "pillcue",
  storageBucket: "pillcue.firebasestorage.app",
  messagingSenderId: "596480738154",
  appId: "1:596480738154:web:ddfdc1b95e535a3dd11b13",
  measurementId: "G-9VRR2HEPFW"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = initializeAuth(firebaseApp, {
  persistence: Platform.OS === "web"
    ? browserLocalPersistence
    : getReactNativePersistence(ReactNativeAsyncStorage),
});
export const firestore = getFirestore(firebaseApp);
export const firebaseFunctions = getFunctions(firebaseApp, "us-central1");
