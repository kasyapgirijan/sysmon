THRESHOLDS = {"cpu_percent": 90.0, "memory_percent": 85.0}


def get_alerts(metrics: dict) -> list:
    alerts = []

    if metrics["cpu_percent"] >= THRESHOLDS["cpu_percent"]:
        alerts.append({
            "type": "cpu",
            "value": metrics["cpu_percent"],
            "threshold": THRESHOLDS["cpu_percent"],
            "message": f"CPU at {metrics['cpu_percent']}% (threshold {THRESHOLDS['cpu_percent']}%)",
        })

    if metrics["memory"]["percent"] >= THRESHOLDS["memory_percent"]:
        alerts.append({
            "type": "memory",
            "value": metrics["memory"]["percent"],
            "threshold": THRESHOLDS["memory_percent"],
            "message": f"RAM at {metrics['memory']['percent']}% (threshold {THRESHOLDS['memory_percent']}%)",
        })

    return alerts
