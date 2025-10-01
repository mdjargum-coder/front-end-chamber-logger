const API_BASE = "https://4b07b8d1-5cf2-4d6d-bd0b-352fbfc2a886-00-6y30akrlro5p.pike.replit.dev";  
const chartCtx = document.getElementById('logChart').getContext('2d');
let logChart;

// ==== FETCH LOGS ====
async function fetchLogs() {
  try {
    const res = await fetch(`${API_BASE}/logs?t=${Date.now()}`);
    const data = await res.json();

    if (data.length > 0) {
      updateTable(data);

      // siapkan data untuk grafik
      const labels = data.map(log => new Date(log.timestamp).toLocaleTimeString("id-ID"));
      const temp1 = data.map(log => log.temperature1);
      const temp2 = data.map(log => log.temperature2);
      const hum1 = data.map(log => log.humidity1);
      const hum2 = data.map(log => log.humidity2);

      updateChart(labels, temp1, temp2, hum1, hum2);

      // status ambil dari log terakhir
      const lastStatus = data[data.length - 1].status;
      document.getElementById("statusText").textContent =
        lastStatus === "OFF" ? "⚠️ Chamber OFF" : "✅ Chamber ON";
    } else {
      document.getElementById("statusText").textContent = "Belum ada data log";
    }
  } catch (err) {
    console.error("Error fetch logs:", err);
    document.getElementById("statusText").textContent = "⚠️ Gagal ambil data log";
  }
}

// ==== FETCH STATUS ====
async function fetchStatus() {
  try {
    const res = await fetch(`${API_BASE}/status?t=${Date.now()}`);
    const data = await res.json();
    document.getElementById("statusText").textContent =
      data.status === "OFF" ? "⚠️ Chamber OFF" : "✅ Chamber ON";
  } catch (err) {
    document.getElementById("statusText").textContent = "⚠️ Gagal ambil status";
  }
}

// ==== UPDATE TABEL ====
function updateTable(data) {
  const tbody = document.querySelector("#logTable tbody");
  tbody.innerHTML = ""; // bersihkan dulu

  data.forEach(log => {
    const tr = document.createElement("tr");
    const dt = log.timestamp ? new Date(log.timestamp) : new Date();
    let date = dt.toLocaleDateString("id-ID");
    let time = dt.toLocaleTimeString("id-ID");

    let status = log.status || "ON";

    tr.innerHTML = `
      <td>${date}</td>
      <td>${time}</td>
      <td>${log.temperature1}</td>
      <td>${log.temperature2}</td>
      <td>${log.humidity1}</td>
      <td>${log.humidity2}</td>
      <td>${status}</td>
    `;
    tbody.appendChild(tr);
  });

  // AUTO SCROLL ke bawah
  const tableWrapper = document.querySelector(".table-wrapper");
  tableWrapper.scrollTop = tableWrapper.scrollHeight;
}

// ==== UPDATE CHART ====
function updateChart(labels, temp1, temp2, hum1, hum2) {
  const datasetsData = [
    { label: 'Temp 1', data: temp1, borderColor: 'red' },
    { label: 'Temp 2', data: temp2, borderColor: 'purple' },
    { label: 'Hum 1', data: hum1, borderColor: 'blue' },
    { label: 'Hum 2', data: hum2, borderColor: 'green' }
  ];

  if (!logChart) {
    logChart = new Chart(chartCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasetsData
      },
      options: {
        responsive: true,
        plugins: {
          datalabels: {
            align: 'end',
            anchor: 'start',
            display: (ctx) => ctx.dataIndex === ctx.dataset.data.length - 1,
            offset: (ctx) => 10 + ctx.datasetIndex * 5,
            color: (ctx) => ctx.dataset.borderColor,
            formatter: (value) => value.toFixed(2)
          }
        },
        scales: {
          y: { beginAtZero: true }
        }
      },
      plugins: [ChartDataLabels]
    });
  } else {
    logChart.data.labels = labels;
    logChart.data.datasets[0].data = temp1;
    logChart.data.datasets[1].data = temp2;
    logChart.data.datasets[2].data = hum1;
    logChart.data.datasets[3].data = hum2;
    logChart.update();
  }
}

// ==== LOAD ARCHIVES ====
async function loadArchives() {
  try {
    const res = await fetch(`${API_BASE}/archives?t=${Date.now()}`);
    const data = await res.json();
    const files = data.archives;

    const select = document.getElementById('archiveSelect');
    select.innerHTML = '<option value="">-- Pilih file log --</option>';

    files.forEach(fileUrl => {
      const filename = fileUrl.split('/').pop();
      const option = document.createElement('option');
      option.value = fileUrl;
      option.textContent = filename;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Gagal load archives:", err);
  }
}

// ==== DOWNLOAD CSV ====
document.getElementById('downloadBtn').addEventListener('click', () => {
  const url = archiveSelect.value;
  if (url) {
    const a = document.createElement("a");
    a.href = url;
    a.download = url.split("/").pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
});

document.getElementById('refreshBtn').addEventListener('click', loadArchives);

// ==== INIT ====
loadArchives();
fetchLogs();
fetchStatus();

// auto refresh tiap 60 detik
setInterval(() => {
  fetchLogs();
  fetchStatus();
}, 60000);


