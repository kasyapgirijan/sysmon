import psutil


def get_processes(sort_by="memory", limit=50, search=None):
    procs = []

    for p in psutil.process_iter(['pid', 'name', 'username']):
        try:
            mem = p.memory_info().rss / (1024 * 1024)
            cpu = p.cpu_percent(interval=0.0)

            proc = {
                "pid": p.pid,
                "name": p.info['name'],
                "user": p.info['username'],
                "memory_mb": round(mem, 2),
                "cpu_percent": cpu,
            }

            if search and search.lower() not in proc["name"].lower():
                continue

            procs.append(proc)

        except Exception:
            continue

    key = "memory_mb" if sort_by == "memory" else "cpu_percent"
    return sorted(procs, key=lambda x: x[key], reverse=True)[:limit]
