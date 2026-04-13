import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Paste your Firebase project config here after creating the project at console.firebase.google.com
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
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const firestore = getFirestore(firebaseApp);
export const firebaseFunctions = getFunctions(firebaseApp, "us-central1");
