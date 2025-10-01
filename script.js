const API_BASE = "https://4b07b8d1-5cf2-4d6d-bd0b-352fbfc2a886-00-6y30akrlro5p.pike.replit.dev";  // ganti dengan URL Replit backend
const chartCtx = document.getElementById('logChart').getContext('2d');
let logChart;

async function fetchLogs() {
  try {
    const res = await fetch("/logs");
    const data = await res.json();

    if (data.length > 0) {
      updateTable(data);
      updateChart(data);

      // tampilkan status terakhir
      const lastStatus = data[data.length - 1].status;
      document.getElementById("statusText").textContent =
        lastStatus === "OFF" ? "⚠️ Chamber OFF" : "✅ Chamber ON";
    } else {
      // kalau DB kosong total
      document.getElementById("statusText").textContent = "Belum ada data log";
    }

    // daftar CSV harus tetap muncul
    loadArchives();
  } catch (err) {
    console.error("Error fetch logs:", err);
  }
}

// fungsi untuk update tabel
function updateTable(data) {
    const tbody = document.querySelector("#logTable tbody");
    tbody.innerHTML = ""; // bersihkan dulu

    data.forEach(log => {
        const tr = document.createElement("tr");

        let date = log.tanggal;       
        let time = log.waktu;         
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

function updateChart(labels, temp1, temp2, hum1, hum2) {
    const datasetsData = [
        { label: 'Temp 1', data: temp1, borderColor: 'red'},
        { label: 'Temp 2', data: temp2, borderColor: 'purple'},
        { label: 'Hum 1', data: hum1, borderColor: 'blue'},
        { label: 'Hum 2', data: hum2, borderColor: 'green'}
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
                        align: 'end', //top
                        anchor: 'start', //'end'
                        display: (ctx) => ctx.dataIndex === ctx.dataset.data.length - 1,
                        offset: (ctx) => 10 + ctx.datasetIndex * 5, // offset berbeda tiap line ctx.datasetIndex * 15
                        color: (ctx) => ctx.dataset.borderColor, // warna sesuai line
						formatter: (value) => value.toFixed(2)
                        //formatter: (value, ctx) => `${ctx.dataset.prefix}${value.toFixed(2)}` // tambahkan awalan
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


// Tombol download CSV
document.getElementById('downloadBtn').addEventListener('click', () => {
    const url = archiveSelect.value;
	if (url) {
		const a = document.createElement("a");
		a.href = url;
		a.download = url.split("/").pop(); // otomatis ambil nama file dari URL
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}
});

document.getElementById('refreshBtn').addEventListener('click', loadArchives);


// Load daftar file saat halaman pertama dibuka
loadArchives();


// Refresh setiap 60 detik
setInterval(fetchLogs, 60000);
fetchLogs();


