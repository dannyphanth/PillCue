from __future__ import annotations

import importlib.util
from pathlib import Path


APP_FILE = Path(__file__).resolve().parent / "app.py"
SPEC = importlib.util.spec_from_file_location("pillcue_backend_main", APP_FILE)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)
app = MODULE.app


if __name__ == "__main__":
    app.run(debug=True, port=5050)
