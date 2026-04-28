const HISTORY_LEN = 30; // 30 ticks × 2 s = 60 s
const cpuHistory = Array(HISTORY_LEN).fill(null);
const labels = Array(HISTORY_LEN).fill('');

let chart;
let lastProcesses = [];
let totalRamMb = 0;
let sortState = {
  key: 'memory_mb', // Default sort key
  dir: 'desc',      // Default sort direction
};

function initChart() {
  const ctx = document.getElementById('cpuChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: cpuHistory,
        borderColor: '#4fc3f7',
        backgroundColor: 'rgba(79,195,247,0.12)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
      }],
    },
    options: {
      animation: false,
      scales: {
        x: { display: false },
        y: {
          min: 0, max: 100,
          ticks: { color: '#818596', callback: v => v + '%' },
          grid: { color: '#282a33' },
        },
      },
      plugins: { legend: { display: false } },
    },
  });
}

function levelClass(pct) {
  if (pct >= 80) return 'level-high';
  if (pct >= 50) return 'level-mid';
  return 'level-ok';
}

function fmtBytes(bytes) {
  const gb = bytes / (1024 ** 3);
  return gb >= 1 ? gb.toFixed(1) + ' GB' : (bytes / (1024 ** 2)).toFixed(0) + ' MB';
}

function setBar(id, pct) {
  const el = document.getElementById(id);
  el.style.width = pct + '%';
  el.className = 'bar-fill ' + levelClass(pct);
}

function renderMetrics(m) {
  const cpu = m.cpu_percent;
  document.getElementById('cpu-value').textContent = cpu + '%';
  setBar('cpu-bar', cpu);

  cpuHistory.push(cpu);
  cpuHistory.shift();
  chart.update('none');

  const ram = m.memory.percent;
  document.getElementById('ram-value').textContent = ram + '%';
  setBar('ram-bar', ram);
  const usedRam = m.memory.total - m.memory.available;
  totalRamMb = m.memory.total / (1024 * 1024);
  document.getElementById('ram-detail').textContent =
    fmtBytes(usedRam) + ' / ' + fmtBytes(m.memory.total);

  const disk = m.disk.percent;
  document.getElementById('disk-value').textContent = disk + '%';
  setBar('disk-bar', disk);
  document.getElementById('disk-detail').textContent =
    fmtBytes(m.disk.used) + ' / ' + fmtBytes(m.disk.total);

  const [l1, l5, l15] = m.load_avg;
  document.getElementById('l1').textContent = l1.toFixed(2);
  document.getElementById('l5').textContent = l5.toFixed(2);
  document.getElementById('l15').textContent = l15.toFixed(2);
}

function renderProcesses(procs) {
  lastProcesses = procs;
  applyFilter();
}

function applyFilter() {
  const search = document.getElementById('search').value.toLowerCase();

  const filtered = lastProcesses
    .filter(p => !search || p.name.toLowerCase().includes(search))
    .sort((a, b) => {
      const valA = a[sortState.key];
      const valB = b[sortState.key];
      if (sortState.dir === 'asc') {
        return valA - valB;
      }
      return valB - valA;
    });

  const maxCpu = Math.max(...filtered.map(p => p.cpu_percent), 1);

  const table = document.getElementById('processTable');
  table.innerHTML = filtered.map(p => {
    const memPct = totalRamMb ? Math.min((p.memory_mb / totalRamMb) * 100, 100) : 0;
    const cpuPct = Math.min((p.cpu_percent / maxCpu) * 100, 100);
    return `
      <tr>
        <td class="pid">${p.pid}</td>
        <td class="pname" title="${p.name}">${p.name}</td>
        <td class="puser">${p.user}</td>
        <td>
          <div class="proc-bar-wrap">
            <div class="proc-bar ${levelClass(memPct)}" style="width:${memPct.toFixed(1)}%"></div>
            <span>${p.memory_mb} MB</span>
          </div>
        </td>
        <td>
          <div class="proc-bar-wrap">
            <div class="proc-bar ${levelClass(p.cpu_percent)}" style="width:${cpuPct.toFixed(1)}%"></div>
            <span>${p.cpu_percent}%</span>
          </div>
        </td>
      </tr>`;
  }).join('');

  updateSortHeaders();
}

function renderAlerts(alerts) {
  const el = document.getElementById('alertBanner');
  if (!alerts.length) { el.className = 'alert-banner hidden'; return; }
  el.className = 'alert-banner';
  el.innerHTML = alerts.map(a => `&#9888; ${a.message}`).join('&nbsp;&nbsp;|&nbsp;&nbsp;');
}

function updateSortHeaders() {
  document.querySelectorAll('th.sortable').forEach(th => {
    th.classList.remove('sorted-asc', 'sorted-desc');
    if (th.dataset.sortKey === sortState.key) {
      th.classList.add(sortState.dir === 'asc' ? 'sorted-asc' : 'sorted-desc');
    }
  });
}

function renderExtraStats(stats) {
  if (!stats) return;

  document.getElementById('uptime-value').textContent = stats.uptime;

  const peakCpuValueEl = document.getElementById('peak-cpu-value');
  const peakCpuTimeEl = document.getElementById('peak-cpu-time');

  if (stats.last_peak && stats.last_peak.timestamp) {
    peakCpuValueEl.textContent = stats.last_peak.percent + '%';
    const peakTime = new Date(stats.last_peak.timestamp * 1000);
    peakCpuTimeEl.textContent = 'at ' + peakTime.toLocaleTimeString();
  }
}

let ws;
function connect() {
  const dot = document.getElementById('connStatus');
  ws = new WebSocket(`ws://${location.host}/ws`);

  ws.onopen = () => { dot.className = 'conn-dot connected'; };

  ws.onmessage = ({ data }) => {
    const { metrics, processes, alerts, extra_stats } = JSON.parse(data);
    renderMetrics(metrics);
    renderProcesses(processes);
    renderAlerts(alerts);
    renderExtraStats(extra_stats);
  };

  ws.onclose = () => {
    dot.className = 'conn-dot disconnected';
    setTimeout(connect, 3000);
  };
}

document.getElementById('search').addEventListener('input', () => applyFilter());

document.querySelectorAll('th.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.dataset.sortKey;
    if (sortState.key === key) {
      sortState.dir = sortState.dir === 'desc' ? 'asc' : 'desc';
    } else {
      sortState.key = key;
      sortState.dir = 'desc';
    }
    applyFilter();
  });
});

initChart();
connect();
updateSortHeaders();
