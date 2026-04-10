from __future__ import annotations

import base64
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from services.medication_parser import parse_medication_text, parse_bottle_image_with_vision, parse_bottle_image_with_gemini
from services.ocr_service import extract_text_from_image_bytes


BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
SCRIPTS_DIR = PROJECT_DIR / "Scripts"
PARSED_OUTPUT_PATH = BASE_DIR / "output_from_gpt.json"
OCR_TEXT_PATH = BASE_DIR / "detected_text_output.txt"

load_dotenv(BASE_DIR / ".env", override=True)

app = Flask(__name__)
CORS(app)


def _json_error(message: str, status_code: int = 400):
    return jsonify({"status": "error", "message": message}), status_code


def _run_python_script(script_name: str, *args: str):
    script_path = SCRIPTS_DIR / script_name
    if not script_path.exists():
        return None, _json_error(f"Script not found: {script_name}", 404)

    completed = subprocess.run(
        [sys.executable, str(script_path), *args],
        capture_output=True,
        text=True,
    )

    return completed, None


def _save_latest_outputs(ocr_text: str, parsed_medication: dict):
    OCR_TEXT_PATH.write_text(ocr_text, encoding="utf-8")
    PARSED_OUTPUT_PATH.write_text(
        json.dumps(parsed_medication, indent=2),
        encoding="utf-8",
    )


def _read_latest_outputs():
    parsed = None
    ocr_text = ""

    if PARSED_OUTPUT_PATH.exists():
        parsed = json.loads(PARSED_OUTPUT_PATH.read_text(encoding="utf-8"))

    if OCR_TEXT_PATH.exists():
        ocr_text = OCR_TEXT_PATH.read_text(encoding="utf-8")

    return parsed, ocr_text


def _extract_upload_bytes() -> bytes | None:
    """Return bytes for a single uploaded image (used by non-vision endpoints)."""
    image_file = request.files.get("image")
    if image_file:
        return image_file.read()

    payload = request.get_json(silent=True) or {}
    encoded_image = payload.get("image")

    if isinstance(encoded_image, str) and "," in encoded_image:
        return base64.b64decode(encoded_image.split(",", 1)[1])

    return None


def _extract_upload_bytes_list() -> list[bytes]:
    """Return bytes for one or more uploaded images (supports multi-angle scans)."""
    image_files = request.files.getlist("image")
    if image_files:
        return [f.read() for f in image_files]

    # Fall back to single base64 image from JSON body
    single = _extract_upload_bytes()
    return [single] if single else []


@app.get("/health")
def health():
    return jsonify({"status": "success", "message": "PillCue backend is running."})


@app.post("/ocr/parse")
def parse_ocr_image():
    image_bytes = _extract_upload_bytes()
    if not image_bytes:
        return _json_error("No image was provided.", 400)

    try:
        ocr_result = extract_text_from_image_bytes(image_bytes)
        parsed_medication = parse_medication_text(ocr_result["ocr_text"])
        _save_latest_outputs(ocr_result["ocr_text"], parsed_medication)

        return jsonify(
            {
                "status": "success",
                "parsedMedication": parsed_medication,
                "ocrText": ocr_result["ocr_text"],
                "highConfidenceText": ocr_result["high_confidence_text"],
            }
        )
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.post("/ocr/vision-parse")
def vision_parse_ocr_image():
    """Parse one or more prescription label images using vision AI.

    Accepts multiple 'image' fields in the form data (multi-angle scan).
    Falls back through Gemini → OpenAI → Tesseract.
    """
    image_bytes_list = _extract_upload_bytes_list()
    if not image_bytes_list:
        return _json_error("No image was provided.", 400)

    # --- Try Gemini first (free tier) ---
    if os.getenv("GEMINI_API_KEY"):
        try:
            parsed_medication = parse_bottle_image_with_gemini(image_bytes_list)
            _save_latest_outputs("(gemini)", parsed_medication)
            return jsonify(
                {
                    "status": "success",
                    "parsedMedication": parsed_medication,
                    "ocrText": f"(extracted via Gemini vision, {len(image_bytes_list)} image(s))",
                    "highConfidenceText": [],
                    "method": "gemini",
                }
            )
        except Exception as gemini_exc:
            exc_str = str(gemini_exc).lower()
            if not any(k in exc_str for k in ("quota", "429", "billing", "rate_limit", "resource")):
                return _json_error(str(gemini_exc), 500)

    # --- Try GPT-4o vision as second option ---
    if os.getenv("OPENAI_API_KEY"):
        try:
            parsed_medication = parse_bottle_image_with_vision(image_bytes_list)
            _save_latest_outputs("(vision)", parsed_medication)
            return jsonify(
                {
                    "status": "success",
                    "parsedMedication": parsed_medication,
                    "ocrText": f"(extracted via GPT-4o vision, {len(image_bytes_list)} image(s))",
                    "highConfidenceText": [],
                    "method": "vision",
                }
            )
        except Exception as vision_exc:
            exc_str = str(vision_exc).lower()
            if not any(k in exc_str for k in ("quota", "429", "billing", "rate_limit", "insufficient")):
                return _json_error(str(vision_exc), 500)

    # --- Tesseract fallback: run OCR on all images and merge text ---
    try:
        combined_text = ""
        combined_high_conf: list[str] = []
        for img_bytes in image_bytes_list:
            ocr_result = extract_text_from_image_bytes(img_bytes)
            combined_text += "\n" + ocr_result["ocr_text"]
            combined_high_conf.extend(ocr_result["high_confidence_text"])
        combined_text = combined_text.strip()
        parsed_medication = parse_medication_text(combined_text)
        _save_latest_outputs(combined_text, parsed_medication)
        return jsonify(
            {
                "status": "success",
                "parsedMedication": parsed_medication,
                "ocrText": combined_text,
                "highConfidenceText": list(dict.fromkeys(combined_high_conf)),
                "method": "tesseract",
            }
        )
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.post("/ocr/extract")
def extract_ocr_text():
    """Return raw OCR text from an image without parsing into medication fields.
    Used by the multi-frame rotating scan to accumulate text across frames."""
    image_bytes = _extract_upload_bytes()
    if not image_bytes:
        return _json_error("No image was provided.", 400)

    try:
        ocr_result = extract_text_from_image_bytes(image_bytes)
        return jsonify(
            {
                "status": "success",
                "ocrText": ocr_result["ocr_text"],
                "highConfidenceText": ocr_result["high_confidence_text"],
            }
        )
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.post("/ocr/parse-text")
def parse_text():
    """Parse a raw OCR text string into structured medication fields.
    Called once after all frames have been collected and their text merged."""
    payload = request.get_json(silent=True) or {}
    raw_text = payload.get("text", "").strip()
    if not raw_text:
        return _json_error("No text was provided.", 400)

    try:
        parsed_medication = parse_medication_text(raw_text)
        _save_latest_outputs(raw_text, parsed_medication)
        return jsonify(
            {
                "status": "success",
                "parsedMedication": parsed_medication,
                "ocrText": raw_text,
            }
        )
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.get("/ocr/latest")
@app.get("/get-parsed-data")
def get_latest_parsed_data():
    try:
        parsed, ocr_text = _read_latest_outputs()
    except Exception as exc:
        return _json_error(str(exc), 500)

    if not parsed:
        return _json_error("Parsed data not found.", 404)

    return jsonify(
        {
            "status": "success",
            "data": parsed,
            "ocrText": ocr_text,
        }
    )


@app.get("/run-script")
def run_legacy_label_detection():
    completed, error_response = _run_python_script("labelDetection.py")
    if error_response:
        return error_response

    return jsonify(
        {
            "status": "success",
            "output": completed.stdout,
            "errors": completed.stderr,
        }
    )


@app.post("/start-webcam")
def start_legacy_webcam():
    completed, error_response = _run_python_script("pillDetection.py")
    if error_response:
        return error_response

    return jsonify(
        {
            "status": "success",
            "output": completed.stdout,
            "errors": completed.stderr,
        }
    )


@app.post("/detect-pill")
def detect_pill():
    image_bytes = _extract_upload_bytes()
    if not image_bytes:
        return _json_error("No image was provided.", 400)

    temp_file = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
            temp_file.write(image_bytes)
            temp_path = temp_file.name

        completed, error_response = _run_python_script("pillDetection.py", "--image", temp_path)
        if error_response:
            return error_response

        return jsonify(
            {
                "status": "success",
                "output": completed.stdout,
                "errors": completed.stderr,
            }
        )
    except Exception as exc:
        return _json_error(str(exc), 500)
    finally:
        if temp_file and os.path.exists(temp_file.name):
            os.remove(temp_file.name)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5050)
