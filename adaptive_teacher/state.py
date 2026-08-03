"""Temporary, process-local learning session storage."""

from __future__ import annotations

from threading import RLock
import time

from .models import LearningState


SESSION_TTL_SECONDS = 60 * 60


class SessionStore:
    """Thread-safe best-effort memory with one-hour expiry.

    Vercel instances can be recycled or scaled independently, so this store is
    intentionally temporary. Durable state will move to the project database.
    """

    def __init__(self, ttl_seconds: int = SESSION_TTL_SECONDS) -> None:
        self._ttl_seconds = ttl_seconds
        self._sessions: dict[str, LearningState] = {}
        self._lock = RLock()

    def _remove_expired(self, now: float) -> None:
        expired = [
            session_id
            for session_id, state in self._sessions.items()
            if now - state.updated_at > self._ttl_seconds
        ]
        for session_id in expired:
            self._sessions.pop(session_id, None)

    def get(self, session_id: str) -> LearningState:
        now = time.time()
        with self._lock:
            self._remove_expired(now)
            state = self._sessions.get(session_id)
            if state is None:
                state = LearningState(session_id=session_id, updated_at=now)
                self._sessions[session_id] = state
            return state

    def save(self, state: LearningState) -> None:
        with self._lock:
            state.updated_at = time.time()
            self._sessions[state.session_id] = state

    def delete(self, session_id: str) -> None:
        with self._lock:
            self._sessions.pop(session_id, None)

    def clear(self) -> None:
        with self._lock:
            self._sessions.clear()


session_store = SessionStore()
