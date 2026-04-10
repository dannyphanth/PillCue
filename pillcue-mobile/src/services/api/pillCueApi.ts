import * as FileSystem from "expo-file-system";
import { httpsCallable } from "firebase/functions";
import { firebaseFunctions } from "../../config/firebase";
import { OcrParseResponse } from "../../types/medication";

async function imageUriToBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export async function visionParseBottleImage(imageUris: string[]): Promise<OcrParseResponse> {
  const images = await Promise.all(imageUris.map(imageUriToBase64));

  const parseBottleImage = httpsCallable(firebaseFunctions, "parse_bottle_image");
  const result = await parseBottleImage({ images });

  const data = result.data as Record<string, any>;

  return {
    parsedMedication: {
      pillName: data.pillName ?? "",
      dosage: data.dosage ?? 1,
      frequency: data.frequency ?? 1,
      swallowed: data.swallowed ?? false,
      quantity: data.quantity ?? 1,
      time1: data.time1 ?? null,
      time2: data.time2 ?? null,
      time3: data.time3 ?? null,
      time4: data.time4 ?? null,
    },
    ocrText: "(extracted via Gemini vision)",
    highConfidenceText: [],
  };
}
