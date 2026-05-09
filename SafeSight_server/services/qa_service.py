"""Natural-language question answering over detected safety events."""

import json
import os
from collections import defaultdict
from functools import lru_cache
from typing import Any

from core.config import load_env_file


DEFAULT_QWEN_BASE_URL = "https://router.huggingface.co/v1"
DEFAULT_QWEN_MODEL = "Qwen/Qwen2.5-VL-7B-Instruct"
CONCERN_EVENT_TYPES = {"no_helmet", "no_vest"}
EVENT_LABELS = {
    "no_helmet": "missing hardhats",
    "no_vest": "missing safety vests",
}
MAX_EVIDENCE_EXAMPLES_PER_TYPE = 3


class QAConfigurationError(RuntimeError):
    pass


class QAProviderError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def get_huggingface_client() -> Any:
    load_env_file()
    base_url = os.getenv("QWEN_URL", os.getenv("HF_BASE_URL", DEFAULT_QWEN_BASE_URL))
    token = os.getenv("QWEN_KEY", os.getenv("HF_TOKEN"))
    if not token and base_url.rstrip("/") == DEFAULT_QWEN_BASE_URL:
        raise QAConfigurationError("HF_TOKEN or QWEN_KEY is not set.")

    from openai import OpenAI

    return OpenAI(
        base_url=base_url,
        api_key=token or "dummy",
    )


def answer_question(video_id: str, question: str, events_payload: dict, base_url: str) -> dict:
    model = os.getenv("QWEN_MODEL", os.getenv("HF_MODEL", DEFAULT_QWEN_MODEL))
    concern_payload = _build_concern_payload(video_id, events_payload, base_url)
    events = concern_payload["events"]
    event_count = len(events)

    try:
        completion = get_huggingface_client().chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are SafeSight AI. Answer like a safety supervisor. "
                        "Report only safety concerns that were ignored. "
                        "Do not mention JSON, raw data, event logs, or person_detected events. "
                        "Use plain language: missing helmet and missing safety vest. "
                        "Do not list every single detection. Summarize repeated issues naturally. "
                        "Include only a few representative markdown links labeled [View Evidence Frame]. "
                        "If there are no safety concerns, say no safety concerns were detected."
                    ),
                },
                {
                    "role": "user",
                    "content": _build_user_prompt(video_id, question, concern_payload),
                },
            ],
        )
    except QAConfigurationError:
        raise
    except Exception as exc:
        raise QAProviderError(f"Hugging Face request failed: {exc}") from exc

    answer = completion.choices[0].message.content
    return {
        "video_id": video_id,
        "question": question,
        "answer": answer or "",
        "model": model,
        "event_count": event_count,
        "evidence": _build_evidence_frames(events),
    }


def _build_user_prompt(video_id: str, question: str, events_payload: dict) -> str:
    prompt_payload = {
        "video_id": video_id,
        "summary": events_payload["summary"],
        "evidence_examples": events_payload["evidence_examples"],
    }
    events_json = json.dumps(prompt_payload, indent=2)
    return (
        f"Video ID: {video_id}\n\n"
        f"Safety concerns:\n{events_json}\n\n"
        f"Question: {question}\n\n"
        "Write a short natural-language answer. Start with the main safety concerns. "
        "Mention the risk level and why it matters. "
        "Do not output a raw timeline or repeat every timestamp. "
        "Use the representative evidence links only as examples."
    )


def _build_concern_payload(video_id: str, events_payload: dict, base_url: str) -> dict:
    events = events_payload.get("events", [])
    if not isinstance(events, list):
        events = []

    concern_events = _dedupe_concern_events([
        _with_frame_url(event, base_url)
        for event in events
        if event.get("event_type") in CONCERN_EVENT_TYPES
    ])
    summary = _summarize_concerns(concern_events)

    return {
        "video_id": video_id,
        "concerns": ["missing helmet", "missing safety vest"],
        "summary": summary,
        "evidence_examples": _build_evidence_examples(concern_events),
        "events": concern_events,
    }


def _build_evidence_frames(events: list[dict]) -> list[dict[str, str | float]]:
    evidence: list[dict[str, str | float]] = []

    for event in events:
        evidence.append(
            {
                "timestamp": str(event.get("timestamp", "")),
                "event_type": str(event.get("event_type", "")),
                "event": str(event.get("event", "")),
                "risk": str(event.get("risk", "")),
                "explanation": str(event.get("explanation", "")),
                "recommendation": str(event.get("recommendation", "")),
                "confidence": float(event.get("confidence", 0.0)),
                "frame_path": str(event.get("frame_path", "")),
                "frame_url": str(event.get("frame_url", "")),
            }
        )

    return evidence


def _with_frame_url(event: dict, base_url: str) -> dict:
    event_with_url = dict(event)
    event_with_url["frame_url"] = _frame_url(str(event.get("frame_path", "")), base_url)
    return event_with_url


def _dedupe_concern_events(events: list[dict]) -> list[dict]:
    seen: set[tuple[str, str, str]] = set()
    deduped_events: list[dict] = []

    for event in events:
        key = (
            str(event.get("event_type", "")),
            str(event.get("timestamp", "")),
            str(event.get("frame_path", "")),
        )
        if key in seen:
            continue

        seen.add(key)
        deduped_events.append(event)

    return sorted(
        deduped_events,
        key=lambda event: (
            float(event.get("timestamp_seconds", 0.0)),
            str(event.get("event_type", "")),
        ),
    )


def _frame_url(frame_path: str, base_url: str) -> str:
    normalized_path = frame_path.replace("\\", "/").lstrip("/")
    parts = normalized_path.split("/")
    if "frames" in parts:
        frame_index = parts.index("frames")
        if len(parts) > frame_index + 2:
            normalized_path = f"{parts[frame_index + 1]}/{parts[frame_index + 2]}"
    elif "inspections" in parts:
        inspection_index = parts.index("inspections")
        if len(parts) > inspection_index + 2:
            normalized_path = f"{parts[inspection_index + 1]}/{parts[-1]}"

    return f"{base_url.rstrip('/')}/frames/{normalized_path}"


def _summarize_concerns(events: list[dict]) -> dict[str, dict[str, Any]]:
    grouped_events: dict[str, list[dict]] = defaultdict(list)

    for event in events:
        grouped_events[str(event["event_type"])].append(event)

    summary: dict[str, dict[str, Any]] = {}
    for event_type, grouped in grouped_events.items():
        summary[event_type] = {
            "issue": EVENT_LABELS.get(event_type, event_type),
            "risk": grouped[0].get("risk"),
            "count": len(grouped),
            "first_seen": grouped[0].get("timestamp"),
            "last_seen": grouped[-1].get("timestamp"),
            "sample_timestamps": [event.get("timestamp") for event in grouped[:10]],
        }

    return summary


def _build_evidence_examples(events: list[dict]) -> dict[str, list[dict[str, str]]]:
    examples: dict[str, list[dict[str, str]]] = defaultdict(list)

    for event in events:
        event_type = str(event.get("event_type", ""))
        if len(examples[event_type]) >= MAX_EVIDENCE_EXAMPLES_PER_TYPE:
            continue

        examples[event_type].append(
            {
                "timestamp": str(event.get("timestamp", "")),
                "event": str(event.get("event", "")),
                "risk": str(event.get("risk", "")),
                "frame_url": str(event.get("frame_url", "")),
            }
        )

    return dict(examples)
