from datetime import datetime
from pydantic import BaseModel, Field


class IngestPosition(BaseModel):
    device_id: str = Field(min_length=1)
    device_ts: datetime

    lat: float
    lon: float
    speed_kmh: float | None = None
    heading_deg: float | None = None
    ignition_on: bool | None = None


class LocationResponse(BaseModel):
    device_id: str
    device_ts: datetime
    lat: float
    lon: float
    speed_kmh: float | None = None
    heading_deg: float | None = None
    ignition_on: bool | None = None

    source: str