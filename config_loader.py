"""Shared config loader — single source of truth for config.json."""
import json
import os
from pathlib import Path


def load_config() -> dict:
    """Load config.json from project root or return defaults."""
    # Try environment override first
    config_path_env = os.environ.get("MEMORY_CONFIG_PATH")
    if config_path_env:
        path = Path(config_path_env)
    else:
        path = Path(__file__).parent / "config.json"
    try:
        return json.loads(path.read_text())
    except Exception:
        return {}
