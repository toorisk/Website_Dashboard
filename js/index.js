// index.js (Versi Ditingkatkan)

// --- KONFIGURASI FIREBASE & INISIALISASI ---
// PENTING: Pastikan Anda telah memuat Firebase App, Auth, dan Database SDK
// di index.html sebelum memuat file ini. Contoh:
// <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>

const firebaseConfig = {
    apiKey: "AIzaSyDoo1oc66UGuGEN6VMKVkpFUJZ9_9XroBE",
    authDomain: "kualitasairunivtelkom.firebaseapp.com",
    databaseURL: "https://kualitasairunivtelkom-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "kualitasairunivtelkom",
    storageBucket: "kualitasairunivtelkom.appspot.com",
    messagingSenderId: "764075188772",
    appId: "1:764075188772:web:e2484d7d62d16b25766eb1",
    measurementId: "G-VHPCXS9ZQB"
};

// Inisialisasi Firebase App hanya sekali
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.database();

// --- GLOBAL VARIABLES & HIGHCHARTS/GAUGES OBJECTS ---
var chartT, chartH, chartP; // Highcharts objects
let gaugeT, gaugeH, gaugeP; // JustGage objects

let currentDataLocation = 'inlet'; // 'inlet' atau 'outlet'
let currentView = 'card'; // 'card', 'gauge', 'chart', 'datatable'
let currentUserUid = null; // Untuk menyimpan UID pengguna yang sedang login
let dbRefInlet = null; // Referensi Firebase untuk pembacaan inlet
let dbRefOutlet = null; // Referensi Firebase untuk pembacaan outlet

// Flags untuk melacak apakah grafik/gauge sudah diinisialisasi
let chartsInitialized = false;
let gaugesInitialized = false;

// Variabel untuk pagination tabel data
const DATA_PAGE_SIZE = 50; // Jumlah data per halaman
let lastLoadedKey = null; // Kunci terakhir yang dimuat untuk pagination
let allDataLoaded = false; // Flag untuk menandakan semua data sudah dimuat

// --- UTILITY FUNCTIONS ---
function epochToJsDate(epochTime) {
    return new Date(epochTime * 1000);
}

function epochToDateTime(epochTime) {
    var epochDate = new Date(epochToJsDate(epochTime));
    var dateTime = epochDate.getFullYear() + "/" +
        ("00" + (epochDate.getMonth() + 1)).slice(-2) + "/" +
        ("00" + epochDate.getDate()).slice(-2) + " " +
        ("00" + epochDate.getHours()).slice(-2) + ":" +
        ("00" + epochDate.getMinutes()).slice(-2) + ":" +
        ("00" + epochDate.getSeconds()).slice(-2);
    return dateTime;
}

// Fungsi untuk menambahkan poin ke chart (untuk data real-time)
function plotValues(chart, timestamp, value) {
    var x = epochToJsDate(timestamp).getTime();
    var y = Number(value);
    console.log(x, y);
    if (chart && chart.series && chart.series[0]) {
        // addPoint(point, redraw, shift, animation)
        // shift: true akan menghapus poin tertua saat poin baru ditambahkan
        chart.series[0].addPoint([x, y], true, false);
    }
}

// --- GLOBAL UI MANAGEMENT ---
const setupUI = (user) => {
    const loginElement = document.querySelector('#login-form');
    const contentElement = document.querySelector("#content-sign-in");
    const sidecontentElement = document.querySelector("#sidecontent-sign-in");
    const userDetailsElement = document.querySelector('#user-details');
    const authStatusElement = document.querySelector('#authentication-status');
    // const adminLinks = document.querySelectorAll('.admin'); // Jika ada elemen admin

    if (user) {
        currentUserUid = user.uid;
        userDetailsElement.innerHTML = user.email;
        loginElement.style.display = 'none';
        contentElement.style.display = 'block';
        sidecontentElement.style.display = 'block';
        authStatusElement.innerHTML = 'Email Perangkat Pengguna';
        // adminLinks.forEach(link => link.style.display = 'block');

        initializeFirebaseListeners(currentUserUid);

        // Setelah login, panggil fungsi untuk memuat tampilan default (misal: 'card')
        // Ini akan memicu tampilan tab "Dashboard" dengan data terbaru.
        // Chart dan Gauge akan diinisialisasi saat tab mereka diklik.
        switchView('card'); // Tampilkan default view 'card'
        refreshDataForCurrentLocation(); // Muat data untuk lokasi dan tampilan saat ini

    } else {
        currentUserUid = null;
        userDetailsElement.innerHTML = '';
        loginElement.style.display = 'block';
        contentElement.style.display = 'none';
        sidecontentElement.style.display = 'none';
        authStatusElement.innerHTML = 'Anda Belum Login';
        // adminLinks.forEach(link => link.style.display = 'none');

        clearAllChartsAndGauges();
        clearDataTable(); // Bersihkan tabel data saat logout
        // Juga, set ulang flag inisialisasi jika user logout
        chartsInitialized = false;
        gaugesInitialized = false;
    }
};

// --- FIREBASE DATA HANDLING ---
function initializeFirebaseListeners(uid) {
    // Hapus listener sebelumnya jika ada untuk menghindari duplikasi
    if (dbRefInlet) { dbRefInlet.off('value'); }
    if (dbRefOutlet) { dbRefOutlet.off('value'); }

    dbRefInlet = db.ref('UsersData/' + uid + '/inlet/readings');
    dbRefOutlet = db.ref('UsersData/' + uid + '/outlet/readings');

    // Listener untuk data real-time (hanya untuk tampilan kartu dan gauge)
    dbRefInlet.on('value', snapshot => {
        if (currentDataLocation === 'inlet' && (currentView === 'card' || currentView === 'gauge')) {
            processSnapshotForLiveValues(snapshot, 'inlet');
        }
    }, error => {
        console.error("Error fetching inlet live data:", error);
    });

    dbRefOutlet.on('value', snapshot => {
        if (currentDataLocation === 'outlet' && (currentView === 'card' || currentView === 'gauge')) {
            processSnapshotForLiveValues(snapshot, 'outlet');
        }
    }, error => {
        console.error("Error fetching outlet live data:", error);
    });

    // Listener khusus untuk chart (akan memuat ulang semua data dalam rentang waktu)
    // Ini akan dipicu saat lokasi atau rentang waktu chart berubah
    // dbRefInlet.on('value', snapshot => {
    //     if (currentDataLocation === 'inlet' && currentView === 'chart') {
    //         processSnapshotForCharts(snapshot, 'inlet');
    //     }
    // }, error => {
    //     console.error("Error fetching inlet chart data:", error);
    // });

    dbRefOutlet.on('value', snapshot => {
        if (currentDataLocation === 'outlet' && currentView === 'chart') {
            processSnapshotForCharts(snapshot, 'outlet');
        }
    }, error => {
        console.error("Error fetching outlet chart data:", error);
    });
}

// Memproses snapshot untuk nilai langsung (kartu dan gauge)
function processSnapshotForLiveValues(snapshot, location) {
    const data = snapshot.val();
    if (data) {
        const sortedData = Object.keys(data).map(key => ({
            timestamp: parseInt(key),
            ...data[key]
        })).sort((a, b) => a.timestamp - b.timestamp);

        const latestEntry = sortedData[sortedData.length - 1];
        if (latestEntry) {
            updateCurrentValues(latestEntry.ph, latestEntry.turbidity, latestEntry.temperature);
            document.getElementById('lastUpdate').innerHTML = epochToDateTime(latestEntry.timestamp);
        }
    } else {
        updateCurrentValues('-', '-', '-');
        document.getElementById('lastUpdate').innerHTML = 'No data';
        console.log(`No live data available for ${location}.`);
    }
}

function refreshChartManually() {
    const uid = currentUserUid; // pastikan kamu punya variabel ini
    const location = currentDataLocation;

    const chartRefPath = `UsersData/${uid}/${location}/readings`;
    db.ref(chartRefPath).once('value')
        .then(snapshot => {
            processSnapshotForCharts(snapshot, location);
        })
        .catch(error => {
            console.error("Error refreshing chart manually:", error);
        });
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

document.getElementById('charts-dayrange').addEventListener('change', async () => {
    const chart = document.getElementById('container-charts');
    const loadingIndicator = document.getElementById('loading-indicator');

    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
        chart.style.display = 'none';
        document.getElementById('loader').style.display = 'block';
        document.getElementById('loading-text').innerText = 'Memuat data...';
        await wait(1000); // supaya terlihat ada loading
    }

    refreshChartManually(); // panggil fungsi pembaruan chart
});

// Memproses snapshot untuk chart (memuat data dalam rentang waktu)
async function processSnapshotForCharts(snapshot, location) {
    const data = snapshot.val();
    const loadingIndicator = document.getElementById('loading-indicator');
    const chart = document.getElementById('container-charts');
    
    if (data) {
        const sortedData = Object.keys(data).map(key => ({
            timestamp: parseInt(key),
            ...data[key]
        })).sort((a, b) => a.timestamp - b.timestamp);

        // Filter data berdasarkan rentang hari yang dipilih
        const daysToDisplay = parseFloat(document.getElementById('charts-dayrange').value);
        const now = new Date().getTime(); // Waktu sekarang dalam milidetik
        const filterTime = now - (daysToDisplay * 24 * 60 * 60 * 1000); // Waktu batas bawah
        console.log('Waktu batas bawah: ' + new Date(filterTime).toLocaleString('id-ID'));
        const filteredData = sortedData.filter(entry => {
            return epochToJsDate(entry.timestamp).getTime() >= filterTime && epochToJsDate(entry.timestamp).getTime() <= now;
        });

        if (filteredData.length === 0) {
            console.log(`🚨 Tidak ada data dalam rentang waktu ${new Date(filterTime).toLocaleString('id-ID')} - ${new Date(now).toLocaleString('id-ID')}`);
            if (chart) chart.style.display = 'none';
            await wait(2000);
            document.getElementById('loader').style.display = 'none';
            document.getElementById('loading-text').innerText = '⚠️ Tidak ada data dalam rentang waktu tersebut';
            return;
        }

        // Hanya plot ke chart jika chart sudah diinisialisasi
        if (chartsInitialized) {
            // Reset data chart sebelum menambahkan yang baru
            if (chartT && chartT.series && chartT.series[0]) chartT.series[0].setData([]);
            if (chartH && chartH.series && chartH.series[0]) chartH.series[0].setData([]);
            if (chartP && chartP.series && chartP.series[0]) chartP.series[0].setData([]);
            console.log(filteredData);
            filteredData.forEach(entry => {
                plotValues(chartT, entry.timestamp, entry.temperature);
                plotValues(chartH, entry.timestamp, entry.turbidity);
                plotValues(chartP, entry.timestamp, entry.ph);
            });

            // Redraw chart setelah semua poin ditambahkan
            if (chartT) chartT.redraw();
            if (chartH) chartH.redraw();
            if (chartP) chartP.redraw();
        }

        const latestEntry = sortedData[sortedData.length - 1];
        if (latestEntry) {
            document.getElementById('lastUpdate').innerHTML = epochToDateTime(latestEntry.timestamp);
        }

    } else {
        clearAllChartsAndGauges();
        document.getElementById('lastUpdate').innerHTML = 'No data';
        console.log(`No chart data available for ${location}.`);
    }

    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
        chart.style.display = 'block';
    }
}

// Memperbarui nilai yang ditampilkan di kartu dan gauge
function updateCurrentValues(ph, turbidity, temperature) {
    document.getElementById('phValue').innerHTML = ph;
    document.getElementById('turbidityValue').innerHTML = turbidity;
    document.getElementById('temperatureValue').innerHTML = temperature;

    // Hanya update gauge jika sudah diinisialisasi dan tampilan saat ini adalah 'gauge'
    if (gaugesInitialized && currentView === 'gauge') {
        if (typeof gaugeT !== 'undefined' && gaugeT) {
            gaugeT.value = temperature;
        }
        if (typeof gaugeH !== 'undefined' && gaugeH) {
            gaugeH.value = turbidity;
        }
        if (typeof gaugeP !== 'undefined' && gaugeP) {
            gaugeP.value = ph;
        }
    }
}

// Membersihkan semua chart dan gauge
function clearAllChartsAndGauges() {
    if (chartsInitialized) {
        if (chartT && chartT.series && chartT.series[0]) chartT.series[0].setData([]);
        if (chartH && chartH.series && chartH.series[0]) chartH.series[0].setData([]);
        if (chartP && chartP.series && chartP.series[0]) chartP.series[0].setData([]);
    }

    if (gaugesInitialized) {
        if (typeof gaugeT !== 'undefined' && gaugeT) gaugeT.value = 0;
        if (typeof gaugeH !== 'undefined' && gaugeH) gaugeH.value = 0;
        if (typeof gaugeP !== 'undefined' && gaugeP) gaugeP.value = 0;
    }
}

// Fungsi untuk memuat ulang data berdasarkan lokasi dan tampilan saat ini
function refreshDataForCurrentLocation() {
    if (!currentUserUid) {
        console.log("Tidak ada pengguna yang login untuk memuat ulang data.");
        updateCurrentValues('-', '-', '-');
        clearAllChartsAndGauges();
        clearDataTable();
        document.getElementById('lastUpdate').innerHTML = 'Tidak ada pengguna yang login';
        return;
    }

    const currentDbRef = (currentDataLocation === 'inlet') ? dbRefInlet : dbRefOutlet;

    if (currentDbRef) {
        // Untuk tampilan kartu dan gauge, kita hanya perlu nilai terbaru
        if (currentView === 'card' || currentView === 'gauge') {
            currentDbRef.limitToLast(1).once('value').then(snapshot => {
                processSnapshotForLiveValues(snapshot, currentDataLocation);
            }).catch(error => {
                console.error("Error fetching live data for refresh:", error);
                updateCurrentValues('-', '-', '-');
                document.getElementById('lastUpdate').innerHTML = 'Error memuat data';
            });
        }
        // Untuk tampilan chart, kita perlu semua data dalam rentang waktu yang dipilih
        // else if (currentView === 'chart') {
        //     // Memanggil listener 'value' yang sudah ada untuk chart
        //     // Ini akan memicu processSnapshotForCharts
        //     currentDbRef.once('value').then(snapshot => {
        //         processSnapshotForCharts(snapshot, currentDataLocation);
        //     }).catch(error => {
        //         console.error("Error fetching chart data for refresh:", error);
        //         clearAllChartsAndGauges();
        //         document.getElementById('lastUpdate').innerHTML = 'Error memuat data';
        //     });
        // }
        // Untuk tampilan datatable, muat data secara bertahap
        else if (currentView === 'datatable') {
            loadMoreDataToTable(true); // Muat data awal untuk tabel
        }
    }
}

// --- VIEW SWITCHING LOGIC ---
function switchView(viewName) {
    currentView = viewName;
    console.log(`Mengganti tampilan ke: ${currentView}`);

    const cardsDiv = document.getElementById('cards-div');
    const gaugesDiv = document.getElementById('gauges-div');
    const chartsDiv = document.getElementById('charts-div');
    const datatableDiv = document.getElementById('datatable-div');

    // Sembunyikan semua div konten
    [cardsDiv, gaugesDiv, chartsDiv, datatableDiv].forEach(div => {
        if (div) div.style.display = 'none';
    });

    // Tampilkan div yang dipilih dan inisialisasi/reflow jika perlu
    if (currentView === 'card') {
        if (cardsDiv) cardsDiv.style.display = 'block';
    } else if (currentView === 'gauge') {
        if (gaugesDiv) {
            gaugesDiv.style.display = 'block';
            if (!gaugesInitialized) {
                gaugeT = createTemperatureGauge();
                gaugeH = createHumidityGauge();
                gaugeP = createPressureGauge();
                gaugesInitialized = true;
            } else {
                if (gaugeT) gaugeT.value = gaugeT;
                if (gaugeH) gaugeH.value = gaugeH;
                if (gaugeP) gaugeP.value = gaugeP;
            }
        }
    } else if (currentView === 'chart') {
        if (chartsDiv) {
            chartsDiv.style.display = 'block';
            if (!chartsInitialized) {
                chartT = createTemperatureChart();
                chartH = createHumidityChart();
                chartP = createPressureChart();
                chartsInitialized = true;
            } else {
                if (chartT) chartT.reflow();
                if (chartH) chartH.reflow();
                if (chartP) chartP.reflow();
            }
        }
    } else if (currentView === 'datatable') {
        if (datatableDiv) datatableDiv.style.display = 'block';
    }

    // Setelah mengganti tampilan, muat ulang data yang relevan
    refreshDataForCurrentLocation();
}

// --- DATA TABLE FUNCTIONS ---
function clearDataTable() {
    const tbody = document.getElementById('tbody');
    if (tbody) tbody.innerHTML = '';
    lastLoadedKey = null;
    allDataLoaded = false;
    document.getElementById('load-data').style.display = 'none';
    document.getElementById('hide-data-button').style.display = 'none';
    document.getElementById('table-container').style.display = 'none';
}

function loadMoreDataToTable(reset = false) {
    if (!currentUserUid) {
        console.log("Tidak ada pengguna yang login untuk memuat data tabel.");
        return;
    }

    const tbody = document.getElementById('tbody');
    const loadMoreButton = document.getElementById('load-data');
    const hideDataButton = document.getElementById('hide-data-button');
    const tableContainer = document.getElementById('table-container');
    const loadingIndicator = document.getElementById('loading-indicator');

    if (!tbody || !loadMoreButton || !hideDataButton || !tableContainer) {
        console.error("Elemen tabel data tidak ditemukan.");
        return;
    }

    if (reset) {
        tbody.innerHTML = ''; // Bersihkan tabel
        lastLoadedKey = null;
        allDataLoaded = false;
        loadMoreButton.style.display = 'none';
        hideDataButton.style.display = 'none';
        tableContainer.style.display = 'none';
    }

    if (allDataLoaded && !reset) {
        console.log("Semua data sudah dimuat.");
        loadMoreButton.style.display = 'none';
        return;
    }

    if (loadingIndicator) loadingIndicator.style.display = 'block';

    const currentDbRef = (currentDataLocation === 'inlet') ? dbRefInlet : dbRefOutlet;
    let query = currentDbRef.orderByKey();

    if (lastLoadedKey) {
        query = query.endAt(lastLoadedKey).limitToLast(DATA_PAGE_SIZE + 1); // +1 untuk mendapatkan kunci sebelumnya
    } else {
        query = query.limitToLast(DATA_PAGE_SIZE);
    }

    query.once('value').then(snapshot => {
        const data = [];
        snapshot.forEach(childSnapshot => {
            data.push({
                key: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        // Urutkan data dari yang paling baru ke paling lama untuk tampilan tabel
        data.sort((a, b) => parseInt(b.key) - parseInt(a.key));

        // Hapus kunci terakhir yang mungkin duplikat jika menggunakan endAt
        if (lastLoadedKey && data.length > DATA_PAGE_SIZE) {
            data.shift(); // Hapus elemen pertama (yang sama dengan lastLoadedKey)
        }

        if (data.length === 0) {
            allDataLoaded = true;
            loadMoreButton.style.display = 'none';
            console.log("Tidak ada data lagi untuk dimuat.");
            if (tbody.children.length === 0) {
                tableContainer.style.display = 'none'; // Sembunyikan tabel jika tidak ada data sama sekali
            }
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            return;
        }

        // Simpan kunci tertua yang dimuat sebagai lastLoadedKey untuk permintaan berikutnya
        lastLoadedKey = data[data.length - 1].key;

        data.forEach(entry => {
            const row = tbody.insertRow(tbody.rows.length); // Tambahkan di akhir
            row.insertCell(0).innerHTML = epochToDateTime(entry.key);
            row.insertCell(1).innerHTML = entry.temperature.toFixed(2);
            row.insertCell(2).innerHTML = entry.turbidity.toFixed(2);
            row.insertCell(3).innerHTML = entry.ph.toFixed(2);
        });

        tableContainer.style.display = 'block';
        hideDataButton.style.display = 'inline-block';

        if (data.length < DATA_PAGE_SIZE) {
            allDataLoaded = true;
            loadMoreButton.style.display = 'none';
        } else {
            loadMoreButton.style.display = 'inline-block';
        }

    }).catch(error => {
        console.error("Error loading data to table:", error);
        displayError("Gagal memuat data tabel: " + error.message);
    }).finally(() => {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    });
}

// Fungsi untuk menampilkan pesan error di UI (dari auth.js)
// Ini adalah placeholder, pastikan fungsi displayError di auth.js dapat diakses
function displayError(message) {
    const errorMessageElement = document.getElementById("error-message");
    if (errorMessageElement) {
        errorMessageElement.innerHTML = message;
        errorMessageElement.style.display = message ? 'block' : 'none';
    } else {
        console.error("Error message element not found.");
    }
}


// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // Event listener untuk tombol navigasi sidebar (Dashboard, Gauge, Chart, Log Data)
    // Menggunakan data-view untuk menentukan tampilan
    const sidebarLinks = document.querySelectorAll('.sidebar a[data-view]');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            sidebarLinks.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            switchView(this.dataset.view); // Panggil switchView
        });
    });

    // Event listener untuk radio button lokasi (Inlet/Outlet)
    const locationRadioButtons = document.querySelectorAll('input[name="location"]');
    locationRadioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            currentDataLocation = this.value; // Update lokasi data
            console.log(`Mengganti lokasi data ke: ${currentDataLocation}`);
            // Muat ulang data untuk tampilan saat ini dengan lokasi baru
            refreshDataForCurrentLocation();
        });
    });

    // Event listener untuk rentang hari chart
    const chartsDayRangeSelect = document.getElementById('charts-dayrange');
    if (chartsDayRangeSelect) {
        chartsDayRangeSelect.addEventListener('change', function() {
            if (currentView === 'chart') {
                refreshDataForCurrentLocation(); // Muat ulang data chart dengan rentang baru
            }
        });
    }

    // Event listener untuk tombol "Lihat semua data"
    const viewDataButton = document.getElementById('view-data-button');
    if (viewDataButton) {
        viewDataButton.addEventListener('click', () => {
            loadMoreDataToTable(true); // Muat data awal, reset tabel
            document.getElementById('table-container').style.display = 'block';
            document.getElementById('hide-data-button').style.display = 'inline-block';
            viewDataButton.style.display = 'none'; // Sembunyikan tombol "Lihat semua data"
        });
    }

    // Event listener untuk tombol "Sembunyikan data"
    const hideDataButton = document.getElementById('hide-data-button');
    if (hideDataButton) {
        hideDataButton.addEventListener('click', () => {
            clearDataTable(); // Bersihkan dan sembunyikan tabel
            document.getElementById('view-data-button').style.display = 'inline-block'; // Tampilkan kembali tombol "Lihat semua data"
        });
    }

    // Event listener untuk tombol "Tampilkan lebih banyak..."
    const loadMoreButton = document.getElementById('load-data');
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => {
            loadMoreDataToTable(false); // Muat lebih banyak data tanpa mereset
        });
    }

    // Event listener untuk tombol "Export ke CSV"
    const exportButton = document.getElementById('export-button');
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            if (!currentUserUid) {
                alert('Silakan login untuk mengekspor data.');
                return;
            }

            const dbRefExport = db.ref(`UsersData/${currentUserUid}/${currentDataLocation}/readings`);
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) loadingIndicator.style.display = 'block';

            dbRefExport.orderByKey().once('value', snapshot => { // Mengambil semua data untuk ekspor
                const data = [];
                if (snapshot.exists()) {
                    snapshot.forEach(childSnapshot => {
                        const jsonData = childSnapshot.val();
                        data.push({
                            Timestamp: epochToDateTime(childSnapshot.key),
                            Temperature: jsonData.temperature,
                            Turbidity: jsonData.turbidity,
                            pH: jsonData.ph
                        });
                    });
                    const ws = XLSX.utils.json_to_sheet(data);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, `SensorData_${currentDataLocation}`);
                    XLSX.writeFile(wb, `SensorData_${currentDataLocation}.csv`);
                } else {
                    alert('Tidak ada data untuk diekspor!');
                }
            }).catch(error => {
                console.error("Error exporting data:", error);
                alert("Gagal mengekspor data: " + error.message);
            }).finally(() => {
                if (loadingIndicator) loadingIndicator.style.display = 'none';
            });
        });
    }

    // Event listener untuk tombol "Hapus data" (modal)
    const deleteButton = document.getElementById('delete-button');
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteButton = document.querySelector('#delete-data-form .deletebtn');
    const cancelDeleteButton = document.querySelector('#delete-data-form .cancelbtn');
    const closeModalSpan = document.querySelector('#delete-modal .close');

    if (deleteButton && deleteModal && confirmDeleteButton && cancelDeleteButton && closeModalSpan) {
        deleteButton.addEventListener('click', () => {
            if (!currentUserUid) {
                alert('Silakan login untuk menghapus data.');
                return;
            }
            deleteModal.style.display = 'block';
        });

        closeModalSpan.addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });

        cancelDeleteButton.addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });

        confirmDeleteButton.addEventListener('click', (e) => {
            e.preventDefault(); // Mencegah form submit
            deleteModal.style.display = 'none';
            
            const dbRefToDelete = db.ref(`UsersData/${currentUserUid}/${currentDataLocation}/readings`);
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) loadingIndicator.style.display = 'block';

            dbRefToDelete.remove()
                .then(() => {
                    console.log(`Data dari ${currentDataLocation} berhasil dihapus.`);
                    alert(`Semua data dari ${currentDataLocation} berhasil dihapus!`);
                    clearAllChartsAndGauges();
                    clearDataTable();
                    updateCurrentValues('-', '-', '-');
                    document.getElementById('lastUpdate').innerHTML = 'Tidak ada data';
                })
                .catch(error => {
                    console.error("Error menghapus data:", error);
                    alert("Gagal menghapus data: " + error.message);
                })
                .finally(() => {
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                });
        });

        // Tutup modal jika user klik di luar area modal
        window.addEventListener('click', (event) => {
            if (event.target == deleteModal) {
                deleteModal.style.display = 'none';
            }
        });
    } else {
        console.warn("Elemen modal delete atau tombolnya tidak ditemukan.");
    }
});

// CATATAN PENTING:
// Pastikan di index.html Anda, setiap tombol navigasi sidebar memiliki atribut `data-view`
// yang sesuai (contoh: `<a href="#" data-view="card">Dashboard</a>`).
// Pastikan juga div dengan ID yang sesuai: `cards-div`, `gauges-div`, `charts-div`, `datatable-div`.
// Pastikan library JustGage (raphael.js dan justgage.js) sudah dimuat di index.html
// sebelum gauges-definition.js.
