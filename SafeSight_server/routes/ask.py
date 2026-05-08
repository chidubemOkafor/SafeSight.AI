from fastapi import APIRouter, HTTPException, Request

from schemas.common import MessageResponse
from schemas.ask import AskRequest, AskResponse
from services.event_service import load_safety_events
from services.inspection_service import save_qa_entry
from services.qa_service import QAConfigurationError, QAProviderError, answer_question

router = APIRouter(prefix="/ask", tags=["ask"])


@router.get(
    "",
    response_model=MessageResponse,
    summary="Ask route status",
    description="Confirms that the natural-language ask route is available.",
)
def ask_root() -> MessageResponse:
    return MessageResponse(message="Ask routes ready")


@router.post(
    "/{video_id}",
    response_model=AskResponse,
    summary="Ask about safety concerns",
    description=(
        "Answers a natural-language question about detected safety concerns for an inspected video. "
        "The response includes a natural-language answer plus structured evidence frame URLs."
    ),
    responses={
        404: {"description": "Events not found for this video"},
        502: {"description": "Hugging Face model request failed"},
        503: {"description": "HF_TOKEN is not configured"},
    },
)
def ask_video_events(video_id: str, request_body: AskRequest, request: Request) -> AskResponse:
    events_payload = load_safety_events(video_id)
    if events_payload is None:
        raise HTTPException(status_code=404, detail="Events not found for this video.")

    try:
        answer = answer_question(video_id, request_body.question, events_payload, str(request.base_url))
    except QAConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except QAProviderError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    save_qa_entry(video_id, request_body.question, str(answer["answer"]), str(answer["model"]))

    return AskResponse(**answer)
