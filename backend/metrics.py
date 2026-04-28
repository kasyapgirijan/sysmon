import psutil
import os


def get_metrics():
    try:
        load_avg = list(os.getloadavg())
    except AttributeError:
        load_avg = [0.0, 0.0, 0.0]

    return {
        "cpu_percent": psutil.cpu_percent(interval=0.5),
        "memory": psutil.virtual_memory()._asdict(),
        "disk": psutil.disk_usage('/')._asdict(),
        "load_avg": load_avg,
    }
