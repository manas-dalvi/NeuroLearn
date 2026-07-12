# backend/app/core/redis.py
import logging
from redis.asyncio import Redis
from redis.exceptions import ConnectionError
from app.core.config import settings

logger = logging.getLogger(__name__)

# Redis Client Instance
redis_client: Redis = None


async def get_redis_client() -> Redis:
    global redis_client
    if redis_client is None:
        try:
            redis_client = Redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_timeout=5,
            )
            # Test connection
            await redis_client.ping()
            logger.info("Connected to Redis successfully.")
        except ConnectionError as e:
            logger.error(f"Failed to connect to Redis: {e}. Caching features will operate in degraded mode.")
            redis_client = None
    return redis_client


async def blacklist_token(token_jti: str, expire_seconds: int) -> None:
    client = await get_redis_client()
    if client:
        try:
            await client.setex(f"blacklist:{token_jti}", expire_seconds, "1")
        except ConnectionError:
            pass


async def is_token_blacklisted(token_jti: str) -> bool:
    client = await get_redis_client()
    if client:
        try:
            val = await client.get(f"blacklist:{token_jti}")
            return val is not None
        except ConnectionError:
            return False
    return False
