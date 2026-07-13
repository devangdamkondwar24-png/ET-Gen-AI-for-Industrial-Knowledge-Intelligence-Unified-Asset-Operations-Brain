import asyncio
import json
import logging
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/alerts")

# In a real system, this would be a Redis PubSub or similar message queue.
# For this implementation, we use an in-memory asyncio Queue.
alert_queue = asyncio.Queue()

async def emit_alert(title: str, message: str, severity: str = "High"):
    """
    Push a new proactive warning to all connected clients.
    Call this function from background jobs or triggers.
    """
    alert = {
        "title": title,
        "message": message,
        "severity": severity,
        "timestamp": asyncio.get_event_loop().time()
    }
    await alert_queue.put(alert)
    logger.info(f"[SSE] Alert queued: {title}")

@router.get("/stream")
async def alert_stream():
    """
    Server-Sent Events stream for proactive warnings.
    """
    async def event_generator():
        try:
            while True:
                # Wait for an alert to be pushed to the queue
                alert = await alert_queue.get()
                yield {
                    "event": "proactive_warning",
                    "data": json.dumps(alert)
                }
        except asyncio.CancelledError:
            logger.info("[SSE] Client disconnected from alert stream.")

    return EventSourceResponse(event_generator())
