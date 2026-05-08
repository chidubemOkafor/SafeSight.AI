"""Safety-event rules built from raw object detections."""

from typing import Literal


SafetyEventType = Literal["no_helmet", "no_vest", "person_detected"]

PERSON_DETECTED: SafetyEventType = "person_detected"
NO_HELMET: SafetyEventType = "no_helmet"
NO_VEST: SafetyEventType = "no_vest"
SUPPORTED_EVENT_TYPES: tuple[SafetyEventType, ...] = (
    PERSON_DETECTED,
    NO_HELMET,
    NO_VEST,
)
PPE_VIOLATION_CLASS_MAP: dict[str, SafetyEventType] = {
    "no-hardhat": NO_HELMET,
    "no hardhat": NO_HELMET,
    "no-helmet": NO_HELMET,
    "no helmet": NO_HELMET,
    "no-safety vest": NO_VEST,
    "no safety vest": NO_VEST,
}
SAFETY_RULES: dict[SafetyEventType, dict[str, str]] = {
    NO_HELMET: {
        "event": "NO-Hardhat",
        "what_happened": "A worker was detected without a hardhat.",
        "risk": "High",
        "explanation": "A worker was detected without a hardhat. This increases the risk of head injury from falling objects, overhead equipment, or accidental impact.",
        "recommendation": "Flag this moment for supervisor review and require the worker to wear an approved hardhat before continuing work.",
    },
    NO_VEST: {
        "event": "NO-Safety Vest",
        "what_happened": "A worker was detected without a safety vest.",
        "risk": "Medium",
        "explanation": "A worker was detected without a safety vest. This reduces visibility around vehicles, machinery, and other workers, increasing the chance of collision or struck-by incidents.",
        "recommendation": "Flag this moment for supervisor review and require the worker to wear a high-visibility safety vest in the work area.",
    },
}


def build_safety_events(detections: list[dict[str, str | float]]) -> list[dict[str, str | float]]:
    events: list[dict[str, str | float]] = []

    for detection in detections:
        if str(detection.get("class", "")).lower() == "person":
            events.append(_person_detected_event(detection))

    events.extend(build_ppe_violation_events(detections))

    return events


def _person_detected_event(detection: dict[str, str | float]) -> dict[str, str | float]:
    return {
        "event_type": PERSON_DETECTED,
        "timestamp": str(detection["timestamp"]),
        "timestamp_seconds": float(detection["timestamp_seconds"]),
        "confidence": float(detection["confidence"]),
        "frame_path": str(detection["frame_path"]),
    }


def build_ppe_violation_events(detections: list[dict[str, str | float]]) -> list[dict[str, str | float]]:
    events: list[dict[str, str | float]] = []

    for detection in detections:
        event_type = PPE_VIOLATION_CLASS_MAP.get(_normalize_class_name(str(detection.get("class", ""))))
        if event_type:
            events.append(_safety_violation_event(detection, event_type))

    return events


def _safety_violation_event(
    detection: dict[str, str | float],
    event_type: SafetyEventType,
) -> dict[str, str | float]:
    rule = SAFETY_RULES[event_type]

    return {
        "event_type": event_type,
        "event": rule["event"],
        "timestamp": str(detection["timestamp"]),
        "timestamp_seconds": float(detection["timestamp_seconds"]),
        "confidence": float(detection["confidence"]),
        "risk": rule["risk"],
        "what_happened": rule["what_happened"],
        "explanation": rule["explanation"],
        "recommendation": rule["recommendation"],
        "frame_path": str(detection["frame_path"]),
    }


def _normalize_class_name(name: str) -> str:
    return name.lower().replace("_", " ").strip()
