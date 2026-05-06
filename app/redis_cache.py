import redis

from app.settings import settings

redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)


def redis_healthcheck() -> bool:
    try:
        return redis_client.ping() is True
    except Exception:
        return False