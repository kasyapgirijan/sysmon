import asyncio
import json
import time
import datetime
from concurrent.futures import ThreadPoolExecutor

import psutil
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles

from alerts import get_alerts
from metrics import get_metrics
from processes import get_processes

app = FastAPI()
_pool = ThreadPoolExecutor(max_workers=2)

# --- State Management ---
# We track these in memory for the lifetime of the server process.
BOOT_TIME = psutil.boot_time()
LAST_PEAK = {"percent": 0, "timestamp": None}


async def _collect() -> dict:
    loop = asyncio.get_event_loop()
    metrics = await loop.run_in_executor(_pool, get_metrics)
    processes = await loop.run_in_executor(_pool, get_processes)

    # Update peak CPU if a new high is reached
    if metrics.get("cpu_percent", 0) > LAST_PEAK["percent"]:
        LAST_PEAK["percent"] = metrics["cpu_percent"]
        LAST_PEAK["timestamp"] = time.time()

    # Calculate uptime
    uptime_seconds = time.time() - BOOT_TIME
    uptime_str = str(datetime.timedelta(seconds=int(uptime_seconds)))

    extra_stats = {"uptime": uptime_str, "last_peak": LAST_PEAK}

    return {
        "metrics": metrics,
        "processes": processes,
        "alerts": get_alerts(metrics),
        "extra_stats": extra_stats,
    }


@app.get("/api/metrics")
def metrics_endpoint():
    return get_metrics()


@app.get("/api/processes")
def processes_endpoint(limit: int = 20):
    return get_processes(limit=limit)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            payload = await _collect()
            await ws.send_text(json.dumps(payload))
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass


app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")
