import psutil

# Module-level cache keeps Process objects alive between ticks so
# cpu_percent() measures elapsed time rather than always returning 0.
_cache: dict[int, psutil.Process] = {}


def get_processes(limit: int = 20) -> list[dict]:
    current_pids = set()
    try:
        current_pids = {p.pid for p in psutil.process_iter()}
    except Exception:
        pass

    # Register new processes (first cpu_percent call initialises the counter)
    for pid in current_pids - set(_cache):
        try:
            p = psutil.Process(pid)
            p.cpu_percent()  # initialise — always returns 0.0
            _cache[pid] = p
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass

    # Evict dead processes
    for pid in set(_cache) - current_pids:
        _cache.pop(pid, None)

    procs = []
    for pid, p in list(_cache.items()):
        try:
            with p.oneshot():
                name = p.name()
                try:
                    user = p.username()
                except (psutil.AccessDenied, OSError):
                    user = "?"
                mem_mb = round(p.memory_info().rss / (1024 * 1024), 2)
                cpu = round(p.cpu_percent(), 1)

            procs.append({
                "pid": pid,
                "name": name,
                "user": user,
                "memory_mb": mem_mb,
                "cpu_percent": cpu,
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            _cache.pop(pid, None)

    return sorted(procs, key=lambda x: x["memory_mb"], reverse=True)[:limit]
