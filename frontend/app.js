let ws;

function connect() {
  ws = new WebSocket(`ws://${location.host}/ws`);

  ws.onmessage = (event) => {
    const { metrics, processes, alerts } = JSON.parse(event.data);
    renderMetrics(metrics);
    renderProcesses(processes);
    renderAlerts(alerts);
  };

  ws.onclose = () => setTimeout(connect, 3000);
}

function renderMetrics(data) {
  document.getElementById('cpu').innerText  = `CPU: ${data.cpu_percent}%`;
  document.getElementById('ram').innerText  = `RAM: ${data.memory.percent}%`;
  document.getElementById('disk').innerText = `Disk: ${data.disk.percent}%`;
}

function renderProcesses(data) {
  const sort   = document.getElementById('sort').value;
  const search = document.getElementById('search').value.toLowerCase();

  const filtered = data
    .filter(p => !search || p.name.toLowerCase().includes(search))
    .sort((a, b) => sort === 'cpu'
      ? b.cpu_percent - a.cpu_percent
      : b.memory_mb   - a.memory_mb);

  const table = document.getElementById('processTable');
  table.innerHTML = filtered.map(p => `
    <tr>
      <td>${p.pid}</td>
      <td>${p.name}</td>
      <td>${p.user}</td>
      <td>${p.memory_mb}</td>
      <td>${p.cpu_percent}</td>
    </tr>`).join('');
}

function renderAlerts(alerts) {
  const banner = document.getElementById('alertBanner');
  if (alerts.length === 0) {
    banner.className = 'alert-banner hidden';
  } else {
    banner.className = 'alert-banner';
    banner.innerHTML = alerts.map(a => `&#9888; ${a.message}`).join('<br>');
  }
}

connect();
