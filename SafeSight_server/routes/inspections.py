from fastapi import APIRouter, HTTPException

from schemas.common import MessageResponse
from schemas.inspections import InspectionDetailResponse, InspectionIndexItem
from services.inspection_service import delete_inspection, get_inspection, list_inspections


router = APIRouter(prefix="/inspections", tags=["inspections"])


@router.get(
    "",
    response_model=list[InspectionIndexItem],
    summary="List inspection history",
    description=(
        "Returns all persisted inspection records from `storage/inspections/index.json`. "
        "Use this endpoint to populate the frontend history screen."
    ),
)
def get_inspections() -> list[InspectionIndexItem]:
    return [InspectionIndexItem(**inspection) for inspection in list_inspections()]


@router.get(
    "/{video_id}",
    response_model=InspectionDetailResponse,
    summary="Get inspection detail",
    description=(
        "Returns metadata, events, report, and Q&A history for a stored inspection. "
        "Missing optional files are returned safely as `events: []`, `report: null`, and `qa_history: []`."
    ),
    responses={404: {"description": "Inspection not found"}},
)
def get_inspection_detail(video_id: str) -> InspectionDetailResponse:
    try:
        inspection = get_inspection(video_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if inspection is None:
        raise HTTPException(status_code=404, detail="Inspection not found.")

    return InspectionDetailResponse(**inspection)


@router.delete(
    "/{video_id}",
    response_model=MessageResponse,
    summary="Delete inspection",
    description=(
        "Deletes the persisted inspection folder and removes it from `index.json`. "
        "Uploaded video files are left untouched for now."
    ),
    responses={404: {"description": "Inspection not found"}},
)
def remove_inspection(video_id: str) -> MessageResponse:
    try:
        deleted = delete_inspection(video_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not deleted:
        raise HTTPException(status_code=404, detail="Inspection not found.")

    return MessageResponse(message="Inspection deleted")
