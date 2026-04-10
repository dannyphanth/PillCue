import os
import re
import subprocess
import sys
import time

import cv2
import pytesseract
from pytesseract import Output


if os.getenv("TESSERACT_CMD"):
    pytesseract.pytesseract.tesseract_cmd = os.getenv("TESSERACT_CMD")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
BACKEND_DIR = os.path.join(PROJECT_DIR, "backend")
ANALYZE_SCRIPT = os.path.join(SCRIPT_DIR, "analyze_text.py")
DETECTED_TEXT_PATH = os.path.join(BACKEND_DIR, "detected_text_output.txt")


def preprocess_for_ocr(frame, use_clahe=True):
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


def extract_high_confidence_text(image, conf_threshold=70):
    data = pytesseract.image_to_data(image, output_type=Output.DICT)
    results, boxes = [], []

    for index in range(len(data["text"])):
        try:
            confidence = int(data["conf"][index])
        except ValueError:
            continue

        text = data["text"][index].strip()
        if confidence >= conf_threshold and text:
            if re.fullmatch(r"[A-Za-z0-9:.\-/]+", text):
                results.append(text)
                box = (
                    data["left"][index],
                    data["top"][index],
                    data["width"][index],
                    data["height"][index],
                )
                boxes.append((text, *box))

    return results, boxes


cap = cv2.VideoCapture(0)
start_time = time.time()
last_detection_time = start_time
ocr_interval = 0.8
max_run_time = 10
min_run_time = 4
early_stop_gap = 8
last_ocr_time = 0
found_text = set()
last_boxes = []
show_thresh = False

print("Scanning for text...")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    now = time.time()
    elapsed_total = now - start_time
    elapsed_since_last = now - last_detection_time

    if now - last_ocr_time >= ocr_interval:
        last_ocr_time = now
        preprocessed = preprocess_for_ocr(frame, use_clahe=True)
        text_fragments, boxes = extract_high_confidence_text(preprocessed)

        new_texts = [text for text in text_fragments if text not in found_text]
        if new_texts:
            found_text.update(new_texts)
            last_detection_time = now
            last_boxes = boxes
            print(f"New text: {new_texts}")

    for text, x, y, w, h in last_boxes:
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
        cv2.putText(frame, text, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    cv2.imshow("Camera", frame)

    if show_thresh:
        cv2.imshow("Preprocessed OCR View", preprocessed)

    key = cv2.waitKey(1)
    if key & 0xFF == ord("q"):
        break
    if key & 0xFF == ord("t"):
        show_thresh = not show_thresh

    if elapsed_total >= max_run_time:
        break
    if elapsed_total >= min_run_time and elapsed_since_last >= early_stop_gap:
        break

cap.release()
cv2.destroyAllWindows()

if found_text:
    final_text = "\n".join(sorted(found_text))
    with open(DETECTED_TEXT_PATH, "w", encoding="utf-8") as file_handle:
        file_handle.write(final_text)
    print("Saved detected text output.")
else:
    print("No text was detected.")

print("Launching analyze_text.py...")
subprocess.run([sys.executable, ANALYZE_SCRIPT], check=False)
