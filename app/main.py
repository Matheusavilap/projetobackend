import json
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db import engine, get_db
from app.models import Base, UserDevice
from app.redis_cache import redis_client, redis_healthcheck
from app.schemas import LocationResponse
from app.auth import create_access_token, get_current_user_id

app = FastAPI(title="Softruck Location Service", version="0.1.0")

Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {
        "ok": True,
        "redis_ok": redis_healthcheck(),
    }


@app.post("/dev/login")
def dev_login(user_id: str):
    token = create_access_token(user_id=user_id)
    return {"access_token": token, "token_type": "bearer"}


def assert_user_can_access_device(db: Session, user_id: str, device_id: str) -> None:
    stmt = select(UserDevice).where(UserDevice.user_id == user_id, UserDevice.device_id == device_id)
    row = db.execute(stmt).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=403, detail="Forbidden")


@app.get("/api/v1/location/{device_id}", response_model=LocationResponse)
def get_location(
    device_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    assert_user_can_access_device(db=db, user_id=user_id, device_id=device_id)

    key = "last_location:" + device_id
    payload = redis_client.get(key)
    if payload is None:
        raise HTTPException(status_code=404, detail="No location found")

    data = json.loads(payload)
    data["source"] = "redis"
    return data