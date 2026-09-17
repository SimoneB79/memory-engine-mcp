"""Pure parsing helpers for OpenClaw transcript events."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass


@dataclass(frozen=True)
class TranscriptBatch:
    """One canonical logical conversation segment."""

    agent_id: str
    session_id: str
    generation: str
    segment: int
    source_key: str
    logical_id: str
    messages: tuple[dict, ...]
    projection_hash: str
    last_seq: int
    last_activity: int


def extract_message(event: dict, event_id: str, seq: int, max_chars: int):
    """Return a safe user/assistant text message, a reset marker, or None."""
    if event.get("type") == "reset":
        return "reset"
    if event.get("type") != "message":
        return None

    message = event.get("message")
    if not isinstance(message, dict):
        return None
    role = message.get("role")
    if role not in {"user", "assistant"}:
        return None

    openclaw_meta = message.get("__openclaw")
    if (
        role == "assistant"
        and isinstance(openclaw_meta, dict)
        and openclaw_meta.get("mirrorOrigin")
    ):
        return None

    content = message.get("content", "")
    if isinstance(content, list):
        content = " ".join(
            part.get("text", "")
            for part in content
            if isinstance(part, dict) and part.get("type") == "text"
        )
    if not isinstance(content, str):
        return None
    content = content.strip()
    if not content or content.startswith("[OpenClaw heartbeat"):
        return None
    if len(content) > max_chars:
        content = content[:max_chars] + "... [truncated]"

    return {
        "role": role,
        "content": content,
        "timestamp": event.get("timestamp") or message.get("timestamp"),
        "event_id": event_id,
        "seq": seq,
    }


def build_batches(
    *,
    agent_id: str,
    session_id: str,
    generation: str,
    rows: list[dict],
    last_activity: int,
    max_chars: int,
) -> list[TranscriptBatch]:
    """Split ordered events at resets and build stable projection hashes."""
    segments: dict[int, list[dict]] = {0: []}
    current_segment = 0
    last_seq = 0
    for index, row in enumerate(rows):
        seq = int(row.get("seq", index))
        last_seq = max(last_seq, seq)
        raw_event = row.get("event_json", {})
        try:
            event = json.loads(raw_event) if isinstance(raw_event, str) else raw_event
        except json.JSONDecodeError:
            continue
        if not isinstance(event, dict):
            continue
        event_id = row.get("event_id") or event.get("id") or f"{session_id}:{seq}"
        parsed = extract_message(event, str(event_id), seq, max_chars)
        if parsed == "reset":
            current_segment += 1
            segments.setdefault(current_segment, [])
            continue
        if parsed:
            segments[current_segment].append(parsed)

    batches = []
    for segment, messages in sorted(segments.items()):
        if not messages:
            continue
        source_key = f"{agent_id}:{session_id}:{generation}:{segment}"
        logical_id = "oc_" + hashlib.sha256(source_key.encode()).hexdigest()[:24]
        signature = [
            (msg["event_id"], msg["seq"], msg["role"], msg["content"])
            for msg in messages
        ]
        projection_hash = hashlib.sha256(
            json.dumps(signature, ensure_ascii=False).encode()
        ).hexdigest()
        batches.append(
            TranscriptBatch(
                agent_id=agent_id,
                session_id=session_id,
                generation=generation,
                segment=segment,
                source_key=source_key,
                logical_id=logical_id,
                messages=tuple(messages),
                projection_hash=projection_hash,
                last_seq=last_seq,
                last_activity=last_activity,
            )
        )
    return batches


def decode_archive(blob: bytes, encoding: str) -> bytes:
    """Decode an OpenClaw archive, importing zstd only when needed."""
    if encoding == "identity":
        return blob
    if encoding != "zstd":
        raise ValueError(f"Unsupported transcript archive encoding: {encoding}")
    import zstandard

    # OpenClaw writes zstd frames WITHOUT content size in the header (streaming):
    # ZstdDecompressor().decompress() requires it -> ZstdError. Use the streaming
    # decompressobj API which does not need the content size.
    dctx = zstandard.ZstdDecompressor()
    try:
        return dctx.decompress(blob)
    except zstandard.ZstdError:
        dobj = dctx.decompressobj()
        return dobj.decompress(blob)
