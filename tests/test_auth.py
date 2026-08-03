"""
Tests for auth.py — token verification, bind address, input validation.
"""
import pytest
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


class TestTokenAuth:
    def test_auth_disabled_when_no_token(self, monkeypatch):
        """When no token is configured, auth is disabled (open mode)."""
        import importlib
        import auth
        importlib.reload(auth)
        monkeypatch.delenv("MEMORY_API_TOKEN", raising=False)
        # Mock config to have no token
        monkeypatch.setattr(auth, "_load_config", lambda: {})
        assert auth.get_api_token() is None
        assert auth.is_auth_enabled() is False
        assert auth.check_token(None) is True
        assert auth.check_token("anything") is True

    def test_auth_enabled_with_config_token(self, monkeypatch):
        """Token from config.json enables auth."""
        import importlib
        import auth
        importlib.reload(auth)
        monkeypatch.delenv("MEMORY_API_TOKEN", raising=False)
        monkeypatch.setattr(auth, "_load_config", lambda: {"security": {"api_token": "secret123"}})
        assert auth.get_api_token() == "secret123"
        assert auth.is_auth_enabled() is True

    def test_check_token_valid(self, monkeypatch):
        import importlib
        import auth
        importlib.reload(auth)
        monkeypatch.delenv("MEMORY_API_TOKEN", raising=False)
        monkeypatch.setattr(auth, "_load_config", lambda: {"security": {"api_token": "my_token"}})
        assert auth.check_token("my_token") is True

    def test_check_token_invalid(self, monkeypatch):
        import importlib
        import auth
        importlib.reload(auth)
        monkeypatch.delenv("MEMORY_API_TOKEN", raising=False)
        monkeypatch.setattr(auth, "_load_config", lambda: {"security": {"api_token": "my_token"}})
        assert auth.check_token("wrong_token") is False
        assert auth.check_token(None) is False
        assert auth.check_token("") is False

    def test_token_from_env_overrides_config(self, monkeypatch):
        import importlib
        import auth
        importlib.reload(auth)
        monkeypatch.setenv("MEMORY_API_TOKEN", "env_token")
        monkeypatch.setattr(auth, "_load_config", lambda: {"security": {"api_token": "config_token"}})
        assert auth.get_api_token() == "env_token"

    def test_constant_time_comparison(self, monkeypatch):
        """Token comparison should use hmac.compare_digest (constant-time)."""
        import importlib
        import auth
        importlib.reload(auth)
        monkeypatch.delenv("MEMORY_API_TOKEN", raising=False)
        monkeypatch.setattr(auth, "_load_config", lambda: {"security": {"api_token": "abc"}})
        # Different lengths should not raise
        assert auth.check_token("a") is False
        assert auth.check_token("ab") is False
        assert auth.check_token("abcd") is False


class TestBearerExtraction:
    def test_standard_bearer(self):
        from auth import extract_bearer
        assert extract_bearer("Bearer my_token") == "my_token"

    def test_lowercase_bearer(self):
        from auth import extract_bearer
        assert extract_bearer("bearer my_token") == "my_token"

    def test_no_prefix(self):
        from auth import extract_bearer
        assert extract_bearer("raw_token") == "raw_token"

    def test_none(self):
        from auth import extract_bearer
        assert extract_bearer(None) is None

    def test_empty(self):
        from auth import extract_bearer
        assert extract_bearer("") is None


class TestBindAddress:
    def test_localhost_default(self):
        from auth import get_bind_address
        assert get_bind_address({"security": {}}) == "127.0.0.1"
        assert get_bind_address({}) == "127.0.0.1"

    def test_remote_allowed(self):
        from auth import get_bind_address
        assert get_bind_address({"security": {"allow_remote": True}}) == "0.0.0.0"

    def test_remote_explicitly_disabled(self):
        from auth import get_bind_address
        assert get_bind_address({"security": {"allow_remote": False}}) == "127.0.0.1"
