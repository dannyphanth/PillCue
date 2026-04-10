import { API_BASE_URL } from "../../config/env";
import { OcrParseResponse } from "../../types/medication";

type RawParseResponse = {
  status: string;
  parsedMedication: OcrParseResponse["parsedMedication"];
  ocrText: string;
  highConfidenceText: string[];
  message?: string;
};

const FETCH_TIMEOUT_MS = 10_000;

function getFileName(uri: string): string {
  const parts = uri.split("/");
  return parts[parts.length - 1] || "bottle.jpg";
}

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

export async function extractTextFromImage(imageUri: string): Promise<{
  ocrText: string;
  highConfidenceText: string[];
}> {
  const formData = new FormData();
  formData.append("image", {
    uri: imageUri,
    name: getFileName(imageUri),
    type: "image/jpeg",
  } as any);

  const response = await fetchWithTimeout(`${API_BASE_URL}/ocr/extract`, {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as {
    status: string;
    ocrText: string;
    highConfidenceText: string[];
    message?: string;
  };

  if (!response.ok || payload.status !== "success") {
    throw new Error(payload.message || "OCR extract failed.");
  }

  return {
    ocrText: payload.ocrText,
    highConfidenceText: payload.highConfidenceText,
  };
}

export async function parseOcrText(combinedText: string): Promise<OcrParseResponse> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/ocr/parse-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: combinedText }),
  });

  const payload = (await response.json()) as RawParseResponse;

  if (!response.ok || payload.status !== "success") {
    throw new Error(payload.message || "OCR parse failed.");
  }

  return {
    parsedMedication: payload.parsedMedication,
    ocrText: payload.ocrText,
    highConfidenceText: payload.highConfidenceText ?? [],
  };
}

export async function visionParseBottleImage(imageUris: string[]): Promise<OcrParseResponse> {
  const formData = new FormData();
  for (const uri of imageUris) {
    formData.append("image", {
      uri,
      name: getFileName(uri),
      type: "image/jpeg",
    } as any);
  }

  const response = await fetchWithTimeout(
    `${API_BASE_URL}/ocr/vision-parse`,
    { method: "POST", body: formData },
    30_000, // vision API needs more time than plain OCR
  );

  const payload = (await response.json()) as RawParseResponse;

  if (!response.ok || payload.status !== "success") {
    throw new Error(payload.message || "Vision parse failed.");
  }

  return {
    parsedMedication: payload.parsedMedication,
    ocrText: payload.ocrText,
    highConfidenceText: payload.highConfidenceText ?? [],
  };
}

export async function parseBottleImage(imageUri: string): Promise<OcrParseResponse> {
  const formData = new FormData();
  formData.append("image", {
    uri: imageUri,
    name: getFileName(imageUri),
    type: "image/jpeg",
  } as any);

  const response = await fetchWithTimeout(`${API_BASE_URL}/ocr/parse`, {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as RawParseResponse;

  if (!response.ok || payload.status !== "success") {
    throw new Error(payload.message || "OCR request failed.");
  }

  return {
    parsedMedication: payload.parsedMedication,
    ocrText: payload.ocrText,
    highConfidenceText: payload.highConfidenceText,
  };
}
