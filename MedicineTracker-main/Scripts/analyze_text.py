from __future__ import annotations

import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
BACKEND_DIR = PROJECT_DIR / "backend"

sys.path.insert(0, str(BACKEND_DIR))

from services.medication_parser import parse_medication_text  # noqa: E402


def main():
    raw_text_path = BACKEND_DIR / "detected_text_output.txt"
    output_path = BACKEND_DIR / "output_from_gpt.json"

    raw_text = raw_text_path.read_text(encoding="utf-8") if raw_text_path.exists() else ""
    structured_data = parse_medication_text(raw_text)
    output_path.write_text(json.dumps(structured_data, indent=2), encoding="utf-8")

    print(json.dumps(structured_data, indent=2))
    print("Saved parsed medication data to output_from_gpt.json")


if __name__ == "__main__":
    main()
