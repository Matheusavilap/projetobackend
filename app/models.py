from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, DateTime, Float, Integer, String, Boolean, Index, UniqueConstraint
from sqlalchemy.sql import func

Base = declarative_base()


class PositionEvent(Base):
    __tablename__ = "position_events"

    id = Column(Integer, primary_key=True)
    device_id = Column(String, nullable=False, index=True)

    device_ts = Column(DateTime(timezone=True), nullable=False, index=True)

    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    speed_kmh = Column(Float, nullable=True)
    heading_deg = Column(Float, nullable=True)

    ignition_on = Column(Boolean, nullable=True)

    received_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_position_events_device_ts", "device_id", "device_ts"),
    )


class UserDevice(Base):
    __tablename__ = "user_devices"

    id = Column(Integer, primary_key=True)
    user_id = Column(String, nullable=False)
    device_id = Column(String, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "device_id", name="uq_user_devices_user_device"),
        Index("idx_user_devices_user", "user_id"),
        Index("idx_user_devices_device", "device_id"),
    )