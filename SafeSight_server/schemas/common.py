from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    message: str = Field(examples=["Upload routes ready"])


class HealthResponse(BaseModel):
    status: str = Field(examples=["ok"])
