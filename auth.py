"""
Authentication and security utilities for Memory Engine.

Supports two modes:
1. Token-based auth (Bearer token) — for MCP SSE and Web UI API
2. No auth (disabled) — for local stdio/trusted environments

Token is set via:
  - config.json → "security": {"api_token": "..."}
  - Environment variable MEMORY_API_TOKEN

If no token is configured, auth is disabled (open mode).
This is safe for stdio/Docker-internal use but NOT for network exposure.
"""
import os
import hmac
import time
import json
from pathlib import Path


_config_cache = None
_config_path = None


def _load_config() -> dict:
    global _config_cache
    if _config_cache is not None:
        return _config_cache
    path = Path(__file__).parent / "config.json"
    try:
        _config_cache = json.loads(path.read_text())
    except Exception:
        _config_cache = {}
    return _config_cache


def get_api_token() -> str | None:
    """
    Resolve the API token from env var or config.
    Returns None if auth is disabled (no token configured).
    """
    token = os.environ.get("MEMORY_API_TOKEN")
    if token:
        return token
    cfg = _load_config()
    security = cfg.get("security", {})
    token = security.get("api_token")
    if token:
        return token
    return None


def check_token(provided: str | None) -> bool:
    """
    Constant-time token verification.
    Returns True if auth is disabled (no token configured) or token matches.
    """
    expected = get_api_token()
    if expected is None:
        # Auth disabled — open mode
        return True
    if not provided:
        return False
    return hmac.compare_digest(expected, provided)


def extract_bearer(auth_header: str | None) -> str | None:
    """Extract token from 'Bearer <token>' header."""
    if not auth_header:
        return None
    parts = auth_header.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    # Also accept raw token (no Bearer prefix)
    return auth_header.strip()


def is_auth_enabled() -> bool:
    """Check whether auth is active (token configured)."""
    return get_api_token() is not None


def get_bind_address(config: dict) -> str:
    """
    Determine the bind address.
    - If security.allow_remote is True → 0.0.0.0
    - Otherwise → 127.0.0.1 (localhost only)
    """
    security = config.get("security", {})
    if security.get("allow_remote", False):
        return "0.0.0.0"
    return "127.0.0.1"
