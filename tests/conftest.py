"""Shared fixtures that keep tests deterministic and free of billable API calls."""

from __future__ import annotations

import os

import pytest


# This is set before importing the application, so .env.local can never cause a
# live LLMod request during automated tests.
os.environ["ADAPTIVE_TEACHER_DEMO_MODE"] = "true"

from fastapi.testclient import TestClient  # noqa: E402

from adaptive_teacher.config import reset_settings_cache  # noqa: E402
from adaptive_teacher.state import session_store  # noqa: E402
from app import app  # noqa: E402


@pytest.fixture
def client() -> TestClient:
    reset_settings_cache()
    session_store.clear()
    with TestClient(app) as test_client:
        yield test_client
    session_store.clear()
