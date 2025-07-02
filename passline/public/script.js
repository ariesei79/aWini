// Variabel global
let barcodeHasil = '';
let selectedArea = '';
let selectedShift = '';
let isDeleteMode = false; // Status mode hapus

// Inisialisasi scanner QRCode
const html5QrCode = new Html5Qrcode("reader");
const qrCodeConfig = { fps: 20, qrbox: { width: 350, height: 400 } }; // Konfigurasi scanner

// --- Fungsi Utama Scan ---
function startScanner() {
    // Pastikan area dan shift sudah dipilih sebelum memulai scanner
    if (!selectedArea || !selectedShift) {
         console.log('Area atau Shift belum dipilih. Scanner tidak dimulai.');
         document.getElementById('scan-result').innerText = 'Pilih Area & Shift untuk memulai scan.';
         return; // Jangan mulai scanner jika belum siap
     }

    console.log('Memulai scanner...');
    document.getElementById('reader').style.display = 'block';
    document.getElementById('scan-result').innerText = 'Arahkan kamera ke barcode...';
    document.getElementById('scan-result').style.color = 'grey'; // Ubah warna status

    html5QrCode.start(
        { facingMode: "environment" }, // Gunakan kamera belakang
        qrCodeConfig,
        (decodedText) => {
            // Barcode berhasil discan
            barcodeHasil = decodedText.trim().toLowerCase();
            document.getElementById('scan-result').innerText = `Barcode Terdeteksi: ${barcodeHasil}`;
             document.getElementById('scan-result').style.color = 'green';
            console.log('Barcode discan:', barcodeHasil);

            // Hentikan scanner sementara setelah berhasil scan
            html5QrCode.stop().then(() => {
                 console.log("Scanner dihentikan sementara.");
                 checkScanResult(); // Lanjut ke proses verifikasi
            }).catch(err => {
                 console.error("Gagal menghentikan scanner:", err);
                 checkScanResult(); // Tetap lanjutkan proses meskipun gagal menghentikan scanner
            });

        },
        (errorMessage) => {
            // Error atau tidak ada QR yang terdeteksi dalam frame
            // console.warn(`Scan error: ${errorMessage}`); // Terlalu banyak log jika ini aktif
             // Jika ada error scan, pastikan status kembali ke normal
             if (!barcodeHasil) { // Hanya update jika belum ada barcode yang berhasil discan
                 document.getElementById('scan-result').innerText = 'Mencari barcode...';
                 document.getElementById('scan-result').style.color = 'grey';
             }
        }
    ).catch((err) => {
        console.error('Error saat memulai QR scanner:', err);
        document.getElementById('scan-result').innerText = `Error memulai scanner: ${err.message}`;
        document.getElementById('scan-result').style.color = 'red';
        alert('Gagal memulai scanner. Pastikan browser Anda mengizinkan akses kamera.');
        // Sembunyikan scanner jika gagal
        document.getElementById('reader').style.display = 'none';
    });
}

// --- Fungsi untuk memulai proses scan setelah area & shift dipilih ---
function initiateScanIfReady() {
    if (selectedArea && selectedShift) {
        console.log('Area dan Shift dipilih. Memulai proses scan.');
        startScanner(); // Langsung mulai scanner
    } else {
        console.log('Menunggu pemilihan Area dan Shift.');
    }
}


// --- Verifikasi hasil scan ---
function checkScanResult() {
    if (!selectedArea || !selectedShift) {
        console.error('Kesalahan sistem: Area atau Shift belum dipilih saat scan selesai.');
        document.getElementById('scan-result').innerText = 'Kesalahan: Area/Shift belum dipilih.';
        document.getElementById('scan-result').style.color = 'red';
         document.getElementById('reader').style.display = 'none'; // Sembunyikan scanner
        return;
    }

    if (selectedArea.toLowerCase() === barcodeHasil) {
        // Barcode cocok
        document.getElementById('scanned-barcode-text').innerText = barcodeHasil;
        document.getElementById('selected-area-text').innerText = selectedArea;
        showSuccessfulScanModal(); // Tampilkan modal sukses
        console.log('Barcode cocok. Menunggu konfirmasi simpan.');

    } else {
        // Barcode tidak cocok
        alert(`Hasil scan "${barcodeHasil}" tidak sesuai dengan Area "${selectedArea}".`);
        document.getElementById('scan-result').innerText = `Scan Gagal: "${barcodeHasil}" tidak cocok dengan Area "${selectedArea}".`;
        document.getElementById('scan-result').style.color = 'red';
        // Restart scanner agar bisa scan lagi setelah user melihat pesan error
        setTimeout(startScanner, 2000); // Tunggu 2 detik sebelum restart
    }
}

// --- Fungsi untuk menyimpan data scan ke database (dipanggil dari tombol di modal sukses scan) ---
async function saveScannedData() {
    const scannedBarcode = document.getElementById('scanned-barcode-text').innerText;
    const selectedAreaFromModal = document.getElementById('selected-area-text').innerText;
    const selectedShiftFromGlobal = selectedShift;

    const now = new Date();
    const waktuScan = now.toLocaleString('id-ID');

    const dataToSave = {
        barcode: scannedBarcode,
        area: selectedAreaFromModal,
        shift: selectedShiftFromGlobal,
        time: waktuScan
    };

    closeSuccessfulScanModal();

    document.getElementById('scan-result').innerText = `Menyimpan data "${dataToSave.barcode}"...`;
    document.getElementById('scan-result').style.color = 'orange'; // Status menyimpan

    try {
        const res = await fetch('/save-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSave)
        });
        const result = await res.json();

        if (res.ok) {
            console.log('Data berhasil disimpan:', result.message, 'ID:', result.id);
            document.getElementById('scan-result').innerText = `Data "${dataToSave.barcode}" berhasil disimpan!`;
            document.getElementById('scan-result').style.color = 'green';

             fetchDataFromDatabase(); // Refresh tabel data dari database setelah menyimpan

        } else {
             console.error('Gagal menyimpan data:', result.error);
             document.getElementById('scan-result').innerText = `Gagal menyimpan "${dataToSave.barcode}": ${result.error}`;
             document.getElementById('scan-result').style.color = 'red';
             alert('Gagal menyimpan data: ' + (result.error || 'Terjadi kesalahan'));
        }
    } catch (err) {
        console.error('Error saat mengirim data ke server:', err);
        document.getElementById('scan-result').innerText = `Error koneksi saat menyimpan "${dataToSave.barcode}".`;
        document.getElementById('scan-result').style.color = 'red';
        alert('Terjadi kesalahan koneksi saat menyimpan data.');
    } finally {
        // Scanner akan di-restart saat modal ditutup dengan closeSuccessfulScanModalAndRestartScan
    }
}

// Fungsi untuk menutup modal sukses scan dan langsung restart scanner
function closeSuccessfulScanModalAndRestartScan() {
    closeSuccessfulScanModal();
    startScanner();
}


// --- Fungsi untuk mengambil data dari database dan menampilkannya ---
async function fetchDataFromDatabase() {
    const tableBody = document.querySelector('#database-data-table tbody');
    const statusElement = document.getElementById('database-data-status');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const deleteButton = document.getElementById('delete-data-btn'); // Menggunakan ID yang sama

    tableBody.innerHTML = ''; // Kosongkan tabel sebelum memuat data baru
    statusElement.innerText = 'Memuat data...';
    statusElement.style.color = 'grey';
    //deleteButton.disabled = true; // Jangan nonaktifkan langsung, tergantung mode
    selectAllCheckbox.checked = false; // Pastikan checkbox select all tidak tercentang

    // Jika sedang dalam mode hapus, sembunyikan tombol hapus terpilih sementara
    if (isDeleteMode) {
         deleteButton.disabled = true;
         selectAllCheckbox.checked = false;
         // Sembunyikan header checkbox sementara
         document.querySelector('.select-all-checkbox-cell').style.display = 'none';
    }


    try {
        const res = await fetch('/get-data');
        const data = await res.json();

        if (res.ok) {
            if (data.length === 0) {
                statusElement.innerText = 'Tidak ada data tersimpan di database.';
                statusElement.style.color = 'grey';
                 // Jika tidak ada data, nonaktifkan tombol hapus (jika mode hapus aktif)
                 if (isDeleteMode) {
                     deleteButton.disabled = true;
                 }
            } else {
                statusElement.innerText = ''; // Hapus status jika data berhasil dimuat
                data.forEach(item => {
                    const row = tableBody.insertRow();
                    const savedTime = item.timestamp ? new Date(item.timestamp).toLocaleString('id-ID') : '-';

                    // Tambahkan sel untuk checkbox
                    const checkboxCell = row.insertCell(0);
                     // Tambahkan class untuk menyembunyikan/menampilkan sel ini
                    checkboxCell.classList.add('delete-checkbox-cell');
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'delete-checkbox'; // Tambahkan class untuk identifikasi
                    checkbox.value = item.id; // Simpan ID data di value checkbox
                    checkboxCell.appendChild(checkbox);

                    row.insertCell(1).textContent = item.id; // ID
                    row.insertCell(2).textContent = savedTime; // Waktu Simpan
                    row.insertCell(3).textContent = item.time; // Waktu Scan
                    row.insertCell(4).textContent = item.barcode; // Barcode
                    row.insertCell(5).textContent = item.area; // Area
                    row.insertCell(6).textContent = item.shift; // Shift

                    // Tambahkan sel untuk kolom Status
                    const statusCell = row.insertCell(7); // Indeks 7 karena ada 7 kolom sebelumnya (0-6)
                    if (item.barcode && item.area && item.barcode.toLowerCase() === item.area.toLowerCase()) {
                        statusCell.textContent = 'OK';
                        statusCell.style.color = 'green';
                        statusCell.style.fontWeight = 'bold';
                    } else {
                         statusCell.textContent = '';
                    }
                });

                // Tambahkan event listener ke semua checkbox setelah data dimuat
                const checkboxes = document.querySelectorAll('.delete-checkbox');
                checkboxes.forEach(cb => {
                    cb.addEventListener('change', updateDeleteButtonState);
                });

                // Tambahkan event listener ke checkbox "Select All"
                selectAllCheckbox.addEventListener('change', toggleAllCheckboxes);

                 // Jika sedang dalam mode hapus, tampilkan kembali elemen-elemen yang disembunyikan
                 if (isDeleteMode) {
                     toggleDeleteMode(true); // Paksa tampilkan elemen mode hapus
                     updateDeleteButtonState(); // Perbarui status tombol hapus terpilih
                 } else {
                     // Jika tidak dalam mode hapus, pastikan tombol hapus menampilkan teks "Hapus Data"
                     deleteButton.textContent = 'Hapus Data';
                     deleteButton.disabled = false; // Pastikan tombol utama aktif
                 }


            }
        } else {
            statusElement.innerText = `Gagal memuat data: ${data.error || 'Terjadi kesalahan'}`;
            statusElement.style.color = 'red';
            console.error('Gagal memuat data dari server:', data.error);
             // Jika gagal memuat data, nonaktifkan tombol hapus (jika mode hapus aktif)
             if (isDeleteMode) {
                 deleteButton.disabled = true;
             }
        }
    } catch (err) {
        statusElement.innerText = 'Gagal terhubung ke server untuk memuat data.';
        statusElement.style.color = 'red';
        console.error('Error saat fetching data dari database:', err);
         // Jika gagal koneksi, nonaktifkan tombol hapus (jika mode hapus aktif)
         if (isDeleteMode) {
             deleteButton.disabled = true;
         }
    }
}

// --- Fungsi untuk beralih antara mode tampilan normal dan mode hapus ---
function toggleDeleteMode(forceShow = false) {
    const deleteButton = document.getElementById('delete-data-btn');
    const selectAllCheckboxCell = document.querySelector('.select-all-checkbox-cell');
    const checkboxCells = document.querySelectorAll('.delete-checkbox-cell');
    const table = document.getElementById('database-data-table'); // Ambil tabel

    if (forceShow) {
        isDeleteMode = true;
    } else {
        isDeleteMode = !isDeleteMode;
    }

    if (isDeleteMode) {
        // Masuk ke mode hapus
        deleteButton.textContent = 'Hapus Data Terpilih';
        // Aktifkan tombol hapus terpilih hanya jika ada yang dicentang (akan di-update oleh updateDeleteButtonState)
        deleteButton.disabled = true;
        // Tampilkan kolom checkbox
        selectAllCheckboxCell.style.display = 'table-cell';
        checkboxCells.forEach(cell => cell.style.display = 'table-cell');
        // Tambahkan class ke tabel atau container untuk styling mode hapus jika perlu
        table.classList.add('delete-mode');


        // Tambahkan tombol "Batal Hapus" jika perlu, atau gunakan tombol yang sama untuk batal
        // Untuk kesederhanaan, kita bisa gunakan tombol yang sama dan mengubah teksnya lagi saat dibatalkan.
        // Tapi alur yang diminta adalah tombol "Hapus Data Terpilih" langsung membuka modal.
        // Jadi, tombol ini akan memicu modal konfirmasi.

    } else {
        // Keluar dari mode hapus (Misal setelah hapus atau refresh data)
        deleteButton.textContent = 'Hapus Data';
        deleteButton.disabled = false; // Aktifkan kembali tombol utama
        // Sembunyikan kolom checkbox
        selectAllCheckboxCell.style.display = 'none';
         // Pastikan checkbox select all tidak tercentang saat keluar mode hapus
        document.getElementById('select-all-checkbox').checked = false;
        checkboxCells.forEach(cell => {
             cell.style.display = 'none';
             // Juga pastikan checkbox individual tidak tercentang
             const checkbox = cell.querySelector('.delete-checkbox');
             if (checkbox) checkbox.checked = false;
        });
        // Hapus class mode hapus
        table.classList.remove('delete-mode');

        // Perbarui status tombol hapus setelah keluar mode
         updateDeleteButtonState(); // Ini akan menonaktifkan tombol jika tidak ada yang dicentang (karena semua sudah dilepas centangnya)

    }
     console.log('Mode Hapus:', isDeleteMode);
}

// --- Handler untuk klik tombol Hapus Data / Hapus Data Terpilih ---
function handleDeleteButtonClick() {
    if (isDeleteMode) {
        // Jika sudah dalam mode hapus, klik tombol berarti ingin menghapus yang terpilih
        openDeleteConfirmModal();
    } else {
        // Jika belum dalam mode hapus, klik tombol berarti ingin masuk ke mode hapus
        // Kita perlu memastikan ada data di tabel sebelum masuk mode hapus
        const tableBody = document.querySelector('#database-data-table tbody');
        if (tableBody.rows.length === 0) {
            alert('Tidak ada data di database untuk dihapus.');
            return;
        }
        toggleDeleteMode(true); // Masuk ke mode hapus
        // updateDeleteButtonState() akan dipanggil saat checkbox dicentang
    }
}


// --- Fungsi untuk mengaktifkan/menonaktifkan tombol hapus terpilih ---
function updateDeleteButtonState() {
    const deleteButton = document.getElementById('delete-data-btn'); // Menggunakan ID yang sama
     // Hanya perbarui status tombol jika sedang dalam mode hapus
    if (isDeleteMode) {
        const checkboxes = document.querySelectorAll('.delete-checkbox');
        let anyChecked = false;
        checkboxes.forEach(cb => {
            if (cb.checked) {
                anyChecked = true;
            }
        });
        deleteButton.disabled = !anyChecked;
         // Jika ada yang dicentang, ubah teks tombol (meskipun seharusnya sudah "Hapus Data Terpilih")
         if (anyChecked) {
             deleteButton.textContent = 'Hapus Data Terpilih';
         } else {
             deleteButton.textContent = 'Hapus Data Terpilih'; // Tetap teks ini, hanya disabled
         }
    } else {
         // Jika tidak dalam mode hapus, pastikan tombol utama aktif dan teksnya benar
         deleteButton.textContent = 'Hapus Data';
         deleteButton.disabled = false;
    }
}

// --- Fungsi untuk mencentang/menghilangkan centang semua checkbox ---
function toggleAllCheckboxes() {
     // Hanya berfungsi jika sedang dalam mode hapus
     if (!isDeleteMode) return;

    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const checkboxes = document.querySelectorAll('.delete-checkbox');
    const isChecked = selectAllCheckbox.checked;

    checkboxes.forEach(cb => {
        cb.checked = isChecked;
    });

    updateDeleteButtonState(); // Perbarui status tombol hapus setelah semua diubah
}


// --- Fungsi untuk mengumpulkan ID data yang dicentang ---
function getSelectedDataIds() {
    const checkboxes = document.querySelectorAll('.delete-checkbox:checked');
    const ids = [];
    checkboxes.forEach(cb => {
        ids.push(parseInt(cb.value, 10)); // Ambil value (ID) dan ubah ke integer
    });
    return ids;
}

// --- Modal Konfirmasi Hapus ---
function openDeleteConfirmModal() {
    const selectedIds = getSelectedDataIds();
    if (selectedIds.length === 0) {
        alert('Pilih data yang ingin dihapus terlebih dahulu.');
        // Jika tidak ada yang dipilih, keluar dari mode hapus
        toggleDeleteMode(false); // Keluar dari mode hapus
        return;
    }
    document.getElementById('deleteConfirmModal').style.display = 'block';
}

function closeDeleteConfirmModal() {
    document.getElementById('deleteConfirmModal').style.display = 'none';
}

// --- Fungsi untuk mengirim permintaan hapus ke server ---
async function deleteSelectedData() {
    const idsToDelete = getSelectedDataIds();

    if (idsToDelete.length === 0) {
        alert('Tidak ada data yang dipilih untuk dihapus.');
        closeDeleteConfirmModal();
        // Jika tidak ada yang dipilih saat klik "Delete" di modal, keluar dari mode hapus
        toggleDeleteMode(false); // Keluar dari mode hapus
        return;
    }

    closeDeleteConfirmModal(); // Tutup modal konfirmasi

    document.getElementById('database-data-status').innerText = `Menghapus ${idsToDelete.length} data...`;
    document.getElementById('database-data-status').style.color = 'orange';

    try {
        const res = await fetch('/delete-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: idsToDelete })
        });
        const result = await res.json();

        if (res.ok) {
            console.log('Data berhasil dihapus:', result.message);
            document.getElementById('database-data-status').innerText = `Berhasil menghapus ${idsToDelete.length} data.`;
            document.getElementById('database-data-status').style.color = 'green';

            // Setelah berhasil dihapus, keluar dari mode hapus dan refresh tabel
            toggleDeleteMode(false); // Keluar dari mode hapus
            fetchDataFromDatabase(); // Refresh tabel data

        } else {
             console.error('Gagal menghapus data:', result.error);
             document.getElementById('database-data-status').innerText = `Gagal menghapus data: ${result.error}`;
             document.getElementById('database-data-status').style.color = 'red';
             alert('Gagal menghapus data: ' + (result.error || 'Terjadi kesalahan'));
             // Jika gagal, tetap di mode hapus tapi refresh tabel untuk lihat data yang tersisa
             fetchDataFromDatabase(); // Refresh tabel data
        }
    } catch (err) {
        console.error('Error saat mengirim permintaan hapus ke server:', err);
        document.getElementById('database-data-status').innerText = 'Error koneksi saat menghapus data.';
        document.getElementById('database-data-status').style.color = 'red';
        alert('Terjadi kesalahan koneksi saat menghapus data.');
        // Jika gagal koneksi, tetap di mode hapus tapi refresh tabel
        fetchDataFromDatabase(); // Refresh tabel data
    }
}


// --- Modal Checklist Area ---
function openAreaModal() {
    document.getElementById('checklistAreaModal').style.display = 'block';
}
function closeAreaModal() {
    document.getElementById('checklistAreaModal').style.display = 'none';
}
function confirmArea() {
    const radios = document.querySelectorAll('input[name="area"]');
    let selected = '';
    radios.forEach(r => {
        if (r.checked) selected = r.value;
    });
    if (selected) {
        selectedArea = selected;
        document.getElementById('selected-area').innerText = `Area: ${selectedArea}`;
        closeAreaModal();
        initiateScanIfReady(); // Cek apakah sudah bisa mulai scan
    } else {
        alert('Pilih area terlebih dahulu!');
    }
}

// --- Modal Checklist Shift ---
function openShiftModal() {
    document.getElementById('checklistShiftModal').style.display = 'block';
}
function closeShiftModal() {
    document.getElementById('checklistShiftModal').style.display = 'none';
}
function confirmShift() {
    const radios = document.querySelectorAll('input[name="shift"]');
    let selected = '';
    radios.forEach(r => {
        if (r.checked) selected = r.value;
    });
    if (selected) {
        selectedShift = selected;
        document.getElementById('selected-shift').innerText = `Shift: ${selectedShift}`;
        closeShiftModal();
        initiateScanIfReady(); // Cek apakah sudah bisa mulai scan
    } else {
        alert('Pilih shift terlebih dahulu!');
    }
}

// --- Modal Sukses Scan ---
function showSuccessfulScanModal() {
    document.getElementById('successfulScanModal').style.display = 'block';
}
function closeSuccessfulScanModal() {
    document.getElementById('successfulScanModal').style.display = 'none';
}


// --- Update waktu secara real-time ---
setInterval(() => {
    const now = new Date();
    document.getElementById('datetime').innerText = now.toLocaleString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }) + ' ' + now.toLocaleTimeString('id-ID'); // Format waktu Indonesia
}, 1000);

// --- Inisialisasi saat halaman dimuat ---
document.addEventListener('DOMContentLoaded', (event) => {
    console.log('Halaman dimuat.');
    // Muat data dari database secara otomatis saat halaman pertama kali dimuat
    fetchDataFromDatabase();
     // Set status awal tombol hapus
    const deleteButton = document.getElementById('delete-data-btn');
    deleteButton.textContent = 'Hapus Data';
    deleteButton.disabled = false; // Aktifkan tombol hapus utama

});

// --- Menutup modal saat klik di luar area modal ---
window.onclick = function(event) {
  const areaModal = document.getElementById('checklistAreaModal');
  const shiftModal = document.getElementById('checklistShiftModal');
  const deleteModal = document.getElementById('deleteConfirmModal'); // Tambahkan modal hapus

  if (event.target == areaModal) {
    closeAreaModal();
  } else if (event.target == shiftModal) {
    closeShiftModal();
  } else if (event.target == deleteModal) { // Tambahkan kondisi untuk modal hapus
    closeDeleteConfirmModal();
  }
}