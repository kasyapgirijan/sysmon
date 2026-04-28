import asyncio
import json
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles

from alerts import get_alerts
from metrics import get_metrics
from processes import get_processes

app = FastAPI()
_pool = ThreadPoolExecutor(max_workers=2)


async def _collect() -> dict:
    loop = asyncio.get_event_loop()
    metrics = await loop.run_in_executor(_pool, get_metrics)
    processes = await loop.run_in_executor(_pool, get_processes)
    return {"metrics": metrics, "processes": processes, "alerts": get_alerts(metrics)}


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
