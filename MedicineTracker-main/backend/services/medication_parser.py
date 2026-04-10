from __future__ import annotations

import json
import os
import re
from typing import Any


FREQUENCY_WORDS = {
    "once": 1,
    "twice": 2,
    "thrice": 3,
}


def normalize_result(payload: dict[str, Any]) -> dict[str, Any]:
    frequency = max(1, min(4, int(payload.get("frequency", 1) or 1)))
    dosage = max(1, int(payload.get("dosage", 1) or 1))
    quantity = max(1, int(payload.get("quantity", 1) or 1))

    return {
        "pillName": re.sub(r"^[\s:]+", "", str(payload.get("pillName", "") or "")).strip(),
        "dosage": dosage,
        "frequency": frequency,
        "swallowed": bool(payload.get("swallowed", False)),
        "quantity": quantity,
        "time1": payload.get("time1"),
        "time2": payload.get("time2"),
        "time3": payload.get("time3"),
        "time4": payload.get("time4"),
    }


def _find_times(raw_text: str) -> list[str]:
    # Only match times that have HH:MM format OR an explicit am/pm suffix.
    # Plain numbers (e.g. from dates like 03/24/2026) are excluded.
    matches = re.findall(
        r"\b(\d{1,2}):(\d{2})\s*(am|pm)?\b|\b(\d{1,2})\s*(am|pm)\b",
        raw_text,
        flags=re.IGNORECASE,
    )
    normalized: list[str] = []

    for hh_colon, mm_colon, suffix_colon, hh_ampm, suffix_ampm in matches:
        if hh_colon:
            hours = int(hh_colon)
            minutes = int(mm_colon)
            suffix = suffix_colon.lower() if suffix_colon else ""
        else:
            hours = int(hh_ampm)
            minutes = 0
            suffix = suffix_ampm.lower()

        if suffix == "pm" and hours < 12:
            hours += 12
        if suffix == "am" and hours == 12:
            hours = 0

        if hours > 23 or minutes > 59:
            continue

        normalized.append(f"{hours:02d}:{minutes:02d}")

    deduped: list[str] = []
    for item in normalized:
        if item not in deduped:
            deduped.append(item)
    return deduped


def fallback_parse_medication_text(raw_text: str) -> dict[str, Any]:
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    lowered = raw_text.lower()

    # Try to extract pill name from explicit "Drug:" label first, then fall back
    # to scanning lines. We look at the raw_text section (after the sorted
    # fragment block) so alphabetic sorting doesn't mislead us.
    pill_name = ""
    drug_match = re.search(r"drug[^\S\n]*:[^\S\n]*([^\n]+)", raw_text, flags=re.IGNORECASE)
    if drug_match:
        pill_name = drug_match.group(1).strip()
    else:
        skip_words = {"qty", "take", "tablet", "capsule", "refill", "date", "expires",
                      "directions", "warning", "strength", "patient", "rx#", "rx "}
        for line in lines:
            if len(line) < 3:
                continue
            line_lower = line.lower()
            if any(word in line_lower for word in skip_words):
                continue
            # Skip lines that are purely numbers, dates, or dosage amounts like "500mg"
            if re.fullmatch(r"[\d/\-\.\s,]+", line):
                continue
            if re.fullmatch(r"\d+\s*mg", line, flags=re.IGNORECASE):
                continue
            if re.search(r"[A-Za-z]{3,}", line):
                pill_name = line
                break

    dosage_match = re.search(r"(?:take|takes?)\s+(\d+)\s+(?:tablet|tablets|capsule|capsules|pill|pills)", lowered)
    dosage = int(dosage_match.group(1)) if dosage_match else 1

    frequency = 1
    frequency_match = re.search(r"(\d+)\s*(?:times|x)\s*(?:daily|per day|a day)", lowered)
    if frequency_match:
        frequency = int(frequency_match.group(1))
    else:
        for word, value in FREQUENCY_WORDS.items():
            if f"{word} daily" in lowered or f"{word} a day" in lowered:
                frequency = value
                break

    quantity_match = re.search(r"(?:qty|quantity|quanity|q\.?t\.?y\.?)\s*[:#-]?\s*(\d+)", lowered)
    quantity = int(quantity_match.group(1)) if quantity_match else 1

    times = _find_times(raw_text)

    return normalize_result(
        {
            "pillName": pill_name,
            "dosage": dosage,
            "frequency": frequency,
            "swallowed": False,
            "quantity": quantity,
            "time1": times[0] if len(times) > 0 else None,
            "time2": times[1] if len(times) > 1 else None,
            "time3": times[2] if len(times) > 2 else None,
            "time4": times[3] if len(times) > 3 else None,
        }
    )


_VISION_PROMPT = """
Look at this prescription medication label photo and extract the details into valid JSON with exactly this shape:
{
  "pillName": "string",
  "dosage": 1,
  "frequency": 1,
  "swallowed": false,
  "quantity": 1,
  "time1": null,
  "time2": null,
  "time3": null,
  "time4": null
}

Rules:
- pillName is the drug name (not the patient name)
- dosage is the number of pills/tablets per single intake (e.g. "Take 2 tablets" → 2), NOT the mg strength
- frequency is times per day (e.g. "twice daily" → 2, "every 8 hours" → 3, "once daily" → 1)
- quantity is the total tablets/capsules in the bottle (look for Qty or Quantity)
- time1–time4: set only when actual clock times are printed on the label (use 24-hour HH:MM format)
- For any unknown field use: empty string for pillName, 1 for numeric fields, null for times
- Return JSON only — no markdown fences, no explanation
""".strip()


def _correct_image_rotation(image_bytes: bytes):
    """Open a PIL image and apply any EXIF rotation so the pixels are upright.
    Phones store frames in landscape order and encode the display rotation in
    EXIF — without this correction the image arrives sideways at the AI."""
    import io
    from PIL import Image as PilImage, ImageOps
    image = PilImage.open(io.BytesIO(image_bytes)).convert("RGB")
    return ImageOps.exif_transpose(image)


def parse_bottle_image_with_gemini(image_bytes_list: list[bytes]) -> dict[str, Any]:
    """Use Google Gemini Vision (free tier) to read and parse a prescription label.

    Accepts one or more images (e.g. multiple angles of the same bottle) and
    sends them all in a single Gemini request for the best possible extraction.
    """
    import io
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    parts: list[types.Part] = []
    for image_bytes in image_bytes_list:
        image = _correct_image_rotation(image_bytes)
        buf = io.BytesIO()
        image.save(buf, format="JPEG", quality=85)
        parts.append(types.Part.from_bytes(data=buf.getvalue(), mime_type="image/jpeg"))

    multi_angle_note = (
        f" These are {len(image_bytes_list)} photos of the same bottle taken from different angles."
        " Combine information across all images to fill in the JSON as completely as possible."
        if len(image_bytes_list) > 1
        else ""
    )
    parts.append(types.Part.from_text(text=_VISION_PROMPT + multi_angle_note))

    response = client.models.generate_content(model=model_name, contents=parts)
    content = response.text.strip()
    cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", content).strip()
    return normalize_result(json.loads(cleaned))


def parse_bottle_image_with_vision(image_bytes_list: list[bytes]) -> dict[str, Any]:
    """Use GPT-4o vision to read and parse a prescription label in one step.

    Accepts one or more images (multiple angles of the same bottle).
    """
    import base64
    import io
    from openai import OpenAI

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    user_content: list[dict] = []
    for image_bytes in image_bytes_list:
        corrected = _correct_image_rotation(image_bytes)
        buf = io.BytesIO()
        corrected.save(buf, format="JPEG", quality=85)
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        user_content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{b64}", "detail": "high"},
        })

    multi_angle_note = (
        f" These are {len(image_bytes_list)} photos of the same bottle from different angles."
        " Combine information across all images."
        if len(image_bytes_list) > 1
        else ""
    )
    user_content.append({"type": "text", "text": _VISION_PROMPT + multi_angle_note})

    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "You extract structured medication data from prescription label photos and return JSON only.",
            },
            {"role": "user", "content": user_content},
        ],
        max_tokens=400,
    )

    content = response.choices[0].message.content.strip()
    cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", content).strip()
    return normalize_result(json.loads(cleaned))


def _call_openai_parser(raw_text: str) -> dict[str, Any]:
    from openai import OpenAI

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    prompt = f"""
Extract the medication label into valid JSON with this exact shape:
{{
  "pillName": "string",
  "dosage": 1,
  "frequency": 1,
  "swallowed": false,
  "quantity": 1,
  "time1": null,
  "time2": null,
  "time3": null,
  "time4": null
}}

Rules:
- dosage is pills per intake, not mg strength
- frequency is times per day
- quantity is tablets/capsules in the bottle when visible
- only set times when an actual clock time is present
- if a field is unknown, use empty string for pillName, null for times, and 1 for dosage/frequency/quantity

OCR text:
{raw_text}
""".strip()

    response = client.responses.create(
        model=model,
        input=[
            {
                "role": "system",
                "content": "You extract structured medication data from noisy OCR and return JSON only.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )

    content = response.output_text.strip()
    cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", content).strip()
    return json.loads(cleaned)


def parse_medication_text(raw_text: str) -> dict[str, Any]:
    if os.getenv("OPENAI_API_KEY"):
        try:
            return normalize_result(_call_openai_parser(raw_text))
        except Exception:
            pass

    return fallback_parse_medication_text(raw_text)
