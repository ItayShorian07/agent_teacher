"""Non-network tests for structured parsing and embedding behavior."""

from __future__ import annotations

import asyncio
import math

from adaptive_teacher.llm import _extract_json, create_embeddings


def test_extract_json_accepts_plain_fenced_and_surrounded_objects() -> None:
    assert _extract_json('{"ok":true}') == {"ok": True}
    assert _extract_json('```json\n{"ok": true}\n```') == {"ok": True}
    assert _extract_json('Result: {"value": 3}') == {"value": 3}


def test_demo_embedding_matches_production_dimension_and_is_normalized() -> None:
    vectors = asyncio.run(create_embeddings(["photosynthesis", "basketball"]))
    assert len(vectors) == 2
    assert all(len(vector) == 1_536 for vector in vectors)
    assert all(math.isclose(math.sqrt(sum(v * v for v in vector)), 1.0) for vector in vectors)
