import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { firestore } from "../../config/firebase";
import { firebaseAuth } from "../../config/firebase";
import { Medication, ParsedMedication } from "../../types/medication";

function getMedsCollection() {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in.");
  return collection(firestore, "users", uid, "medications");
}

export async function getStoredMedications(): Promise<Medication[]> {
  const medsRef = getMedsCollection();
  const snap = await getDocs(query(medsRef, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Medication);
}

export async function addMedication(medication: Medication): Promise<Medication[]> {
  const medsRef = getMedsCollection();
  const { id: _id, ...data } = medication;
  await addDoc(medsRef, data);
  return getStoredMedications();
}

export async function deleteMedication(id: string): Promise<Medication[]> {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in.");
  await deleteDoc(doc(firestore, "users", uid, "medications", id));
  return getStoredMedications();
}
