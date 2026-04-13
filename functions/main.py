from __future__ import annotations

import base64
import json
import os
import re
from io import BytesIO

from firebase_admin import initialize_app
from firebase_functions import https_fn, options
from PIL import Image, ImageOps

initialize_app()

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


def normalize_result(payload: dict) -> dict:
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


@https_fn.on_call(
    region="us-central1",
    memory=options.MemoryOption.MB_512,
    timeout_sec=60,
    invoker="public",
    secrets=["GEMINI_API_KEY"],
)
def parse_bottle_image(req: https_fn.CallableRequest) -> dict:
    images_b64: list[str] = req.data.get("images", [])
    if not images_b64:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="No images provided.",
        )

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.FAILED_PRECONDITION,
            message="GEMINI_API_KEY is not configured.",
        )

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    parts: list = []

    for b64_str in images_b64:
        image_bytes = base64.b64decode(b64_str)
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        image = ImageOps.exif_transpose(image)
        buf = BytesIO()
        image.save(buf, format="JPEG", quality=85)
        parts.append(types.Part.from_bytes(data=buf.getvalue(), mime_type="image/jpeg"))

    if len(images_b64) > 1:
        prompt = (
            _VISION_PROMPT
            + f"\n\nThese are {len(images_b64)} photos of the same bottle from different angles. "
            "Combine information across all images to fill in the JSON as completely as possible."
        )
    else:
        prompt = _VISION_PROMPT

    parts.append(types.Part.from_text(text=prompt))

    models_to_try = [
        os.environ.get("GEMINI_MODEL", "gemini-2.5-flash"),
        "gemini-2.0-flash",
    ]

    last_error = None
    for model_name in models_to_try:
        try:
            response = client.models.generate_content(model=model_name, contents=parts)
            break
        except Exception as model_err:
            last_error = model_err
            continue
    else:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAVAILABLE,
            message=f"Gemini unavailable: {last_error}",
        )

    content = response.text.strip()
    cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", content).strip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Failed to parse Gemini response: {exc}",
        )

    return normalize_result(parsed)
