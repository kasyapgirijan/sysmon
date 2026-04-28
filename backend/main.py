import asyncio
import json

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles

from alerts import get_alerts
from metrics import get_metrics
from processes import get_processes

app = FastAPI()


@app.get("/api/metrics")
def metrics_endpoint():
    return get_metrics()


@app.get("/api/processes")
def processes_endpoint(sort: str = "memory", limit: int = 50, search: str = None):
    return get_processes(sort_by=sort, limit=limit, search=search)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            metrics = get_metrics()
            payload = {
                "metrics": metrics,
                "processes": get_processes(),
                "alerts": get_alerts(metrics),
            }
            await ws.send_text(json.dumps(payload))
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass


app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")
