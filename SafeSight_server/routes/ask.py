from fastapi import APIRouter, HTTPException, Request

from schemas.ask import AskRequest, AskResponse
from services.event_service import load_safety_events
from services.qa_service import QAConfigurationError, QAProviderError, answer_question

router = APIRouter(prefix="/ask", tags=["ask"])


@router.get("")
def ask_root() -> dict[str, str]:
    return {"message": "Ask routes ready"}


@router.post("/{video_id}", response_model=AskResponse)
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

    return AskResponse(**answer)
