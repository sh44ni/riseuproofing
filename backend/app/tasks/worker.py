from arq.connections import RedisSettings
from arq.cron import cron
from app.core.config import settings
from app.tasks.review_tasks import cron_sync_all_reviews
from app.tasks.image_tasks import process_photo_optimization

def parse_redis_settings(url: str) -> RedisSettings:
    # Basic URL parser for arq RedisSettings
    clean = url.replace("redis://", "")
    parts = clean.split("/")
    host_port = parts[0].split(":")
    host = host_port[0] or "localhost"
    port = int(host_port[1]) if len(host_port) > 1 else 6379
    database = int(parts[1]) if len(parts) > 1 and parts[1] else 0
    return RedisSettings(host=host, port=port, database=database)

class WorkerSettings:
    functions = [
        process_photo_optimization,
        cron_sync_all_reviews,
    ]
    cron_jobs = [
        # Run review sync daily at 03:00 UTC
        cron(cron_sync_all_reviews, hour=3, minute=0),
    ]
    redis_settings = parse_redis_settings(settings.REDIS_URL)
