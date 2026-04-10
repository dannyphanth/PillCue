from __future__ import annotations

import io
import os
import re
from typing import Any

import numpy as np
import pytesseract
from PIL import Image
from pytesseract import Output

try:
    import cv2
except ImportError:
    cv2 = None


def configure_tesseract() -> None:
    tesseract_cmd = os.getenv("TESSERACT_CMD")
    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd


def preprocess_for_ocr(frame: np.ndarray, use_clahe: bool = True) -> Any:
    if cv2 is None:
        pil_image = Image.fromarray(frame[:, :, ::-1]).convert("L")
        pil_image = pil_image.resize(
            (pil_image.width * 2, pil_image.height * 2),
            Image.Resampling.LANCZOS,
        )

        # Fallback preprocessing when OpenCV is unavailable.
        pil_image = pil_image.point(lambda pixel: 255 if pixel > 160 else 0)
        return pil_image

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    if use_clahe:
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
    else:
        enhanced = gray

    resized = cv2.resize(enhanced, None, fx=2, fy=2, interpolation=cv2.INTER_LINEAR)
    blurred = cv2.GaussianBlur(resized, (3, 3), 0)

    return cv2.adaptiveThreshold(
        blurred,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        10,
    )


def extract_high_confidence_text(
    image: np.ndarray,
    conf_threshold: int = 70,
) -> tuple[list[str], list[dict[str, Any]]]:
    data = pytesseract.image_to_data(image, output_type=Output.DICT)
    results: list[str] = []
    boxes: list[dict[str, Any]] = []

    for index in range(len(data["text"])):
        try:
            confidence = int(data["conf"][index])
        except ValueError:
            continue

        text = data["text"][index].strip()
        if confidence < conf_threshold or not text:
            continue

        if not re.fullmatch(r"[A-Za-z0-9:.\-/]+", text):
            continue

        results.append(text)
        boxes.append(
            {
                "text": text,
                "x": int(data["left"][index]),
                "y": int(data["top"][index]),
                "width": int(data["width"][index]),
                "height": int(data["height"][index]),
                "confidence": confidence,
            }
        )

    return results, boxes


def extract_text_from_image_bytes(image_bytes: bytes) -> dict[str, Any]:
    configure_tesseract()

    from PIL import ImageOps
    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    pil_image = ImageOps.exif_transpose(pil_image)  # correct rotation before OCR
    cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    preprocessed = preprocess_for_ocr(cv_image)

    high_confidence_text, boxes = extract_high_confidence_text(preprocessed)
    raw_text = pytesseract.image_to_string(preprocessed)

    unique_fragments = sorted(
        dict.fromkeys(fragment.strip() for fragment in high_confidence_text if fragment.strip())
    )
    combined_text = "\n".join(unique_fragments)

    if raw_text.strip():
        combined_text = f"{combined_text}\n\n{raw_text.strip()}".strip()

    return {
        "ocr_text": combined_text,
        "raw_text": raw_text.strip(),
        "high_confidence_text": unique_fragments,
        "boxes": boxes,
    }
