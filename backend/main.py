from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import sqlite3
import requests
import os
import random
import asyncio
import json
from datetime import datetime, timedelta

app = FastAPI(title="SpiderNet AQI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.db")
WAQI_TOKEN = "b2cc92eb7a941b1da252d56e483c46119a507f74"

# AQI threshold levels for alerts
ALERT_LEVELS = {
    301: {"label": "HAZARDOUS",                    "severity": 4},
    201: {"label": "VERY UNHEALTHY",               "severity": 3},
    151: {"label": "UNHEALTHY",                    "severity": 2},
    101: {"label": "UNHEALTHY FOR SENSITIVE",      "severity": 1},
}

# ─── SSE Alert Queue ──────────────────────────────────────────────────────────
# Active SSE subscribers (each is an asyncio.Queue)
_alert_subscribers: list[asyncio.Queue] = []

def get_alert_level(aqi: int):
    """Return the correct alert level config for a given AQI."""
    for threshold in sorted(ALERT_LEVELS.keys(), reverse=True):
        if aqi >= threshold:
            return ALERT_LEVELS[threshold]
    return None

async def _broadcast_alert(city: str, aqi: int):
    """Push an alert event to all connected SSE clients."""
    level = get_alert_level(aqi)
    if not level:
        return
    payload = json.dumps({
        "city": city,
        "aqi": aqi,
        "label": level["label"],
        "severity": level["severity"],
        "timestamp": datetime.now().isoformat(),
    })
    dead = []
    for q in _alert_subscribers:
        try:
            await q.put(payload)
        except Exception:
            dead.append(q)
    for q in dead:
        _alert_subscribers.remove(q)


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/api/aqi/{city}")
async def get_city_aqi(city: str):
    """Fetch live data for ANY city on demand."""
    url = f"https://api.waqi.info/feed/{city}/?token={WAQI_TOKEN}"
    response = requests.get(url).json()

    if response.get("status") != "ok":
        raise HTTPException(status_code=404, detail="City not found")

    data = response["data"]
    aqi = data.get("aqi", 0)
    temp = data.get("iaqi", {}).get("t", {}).get("v", 0.0)
    geo = data.get("city", {}).get("geo", [20.5937, 78.9629])

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO aqi_data (city, aqi, temp) VALUES (?, ?, ?)",
        (city, aqi, temp),
    )
    conn.commit()
    conn.close()

    city_name = data.get("city", {}).get("name", city)

    # ✅ Broadcast alert to all SSE subscribers if AQI is above threshold
    if aqi > 100:
        await _broadcast_alert(city_name, aqi)

    return {
        "city": city_name,
        "aqi": aqi,
        "temp": temp,
        "lat": geo[0],
        "lng": geo[1],
    }


@app.get("/api/trends/{city}")
def get_city_trends(city: str):
    """Fetch trends, backfill with simulated data if new city."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT aqi, timestamp FROM aqi_data WHERE city COLLATE NOCASE = ? ORDER BY timestamp DESC LIMIT 7",
        (city,),
    )
    rows = cursor.fetchall()
    conn.close()

    trends = [
        {"day": row["timestamp"].split()[1][:5], "aqi": row["aqi"]}
        for row in reversed(rows)
    ]

    if len(trends) < 7:
        current_aqi = trends[-1]["aqi"] if trends else 50
        now = datetime.now()
        missing_count = 7 - len(trends)
        backfill = []
        for i in range(missing_count, 0, -1):
            past_time = now - timedelta(minutes=5 * i)
            variance = random.randint(-12, 12)
            fake_aqi = max(1, current_aqi + variance)
            backfill.append({"day": past_time.strftime("%H:%M"), "aqi": fake_aqi})
        trends = backfill + trends

    return trends


@app.get("/api/alerts/stream")
async def alert_stream():
    """
    SSE endpoint — the React frontend connects here to receive real-time alerts.
    Each alert is a JSON blob pushed as a Server-Sent Event.
    """
    queue: asyncio.Queue = asyncio.Queue()
    _alert_subscribers.append(queue)

    async def event_generator():
        try:
            # Send a heartbeat immediately so the client knows the connection is alive
            yield "event: connected\ndata: {\"status\": \"Spider-Net Alert Stream Online\"}\n\n"
            while True:
                try:
                    # Wait for an alert (with a 30s heartbeat to keep connection alive)
                    payload = await asyncio.wait_for(queue.get(), timeout=30)
                    yield f"event: aqi_alert\ndata: {payload}\n\n"
                except asyncio.TimeoutError:
                    # Send a keep-alive comment
                    yield ": heartbeat\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if queue in _alert_subscribers:
                _alert_subscribers.remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/alerts/test")
async def test_alert(city: str = "Delhi", aqi: int = 175):
    """Dev helper — manually fire a test alert without hitting WAQI."""
    await _broadcast_alert(city, aqi)
    return {"status": "alert fired", "city": city, "aqi": aqi}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)