document.addEventListener('DOMContentLoaded', () => {
    let filesList = [];
    const slideshowContent = document.getElementById('slideshow-content');

    // Fungsi untuk mendapatkan daftar file media dalam folder '/assets'
    async function loadFilesList() {
        try {
            const response = await fetch('/WINI-INFORMATION/get-files');
            if (!response.ok) {
                throw new Error('Gagal mengambil daftar file');
            }
            filesList = await response.json();
            
            if (filesList.length === 0) {
                showErrorPage(); // Menampilkan halaman error jika tidak ada file
            } else {
                startSlideshow(); // Jika ada file, mulai slideshow
            }
        } catch (error) {
            console.error('Error loading files:', error);
            showErrorPage(); // Menampilkan halaman error jika ada kesalahan
        }
    }

    // Fungsi untuk menampilkan halaman error
    function showErrorPage() {
        slideshowContent.innerHTML = ''; // Clear konten slideshow
        const errorMessage = document.createElement('div');
        errorMessage.classList.add('error-page');
        errorMessage.innerHTML = `
            <h1>Tidak ada Content yang Tersedia</h1>
            <p>Mohon maaf, saat ini tidak ada file media yang tersedia untuk ditampilkan.</p></br></br>
            <p>Halaman akan otomatis dimuat ulang untuk memeriksa ketersediaan file yang akan ditampilkan dalam <span id="countdown-timer">60</span> detik.</p>
        `;
        slideshowContent.appendChild(errorMessage);

        // Menambahkan styling error
        const style = document.createElement('style');
        style.innerHTML = `
            .error-page {
                text-align: center;
                padding: 50px;
                background-color: #f8d7da;
                border: 1px solid #f5c6cb;
                border-radius: 10px;
                max-width: 600px;
                margin: 100px auto;
                font-family: Arial, sans-serif;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            .error-page h1 {
                font-size: 36px;
                color: #721c24;
                margin-bottom: 20px;
            }
            .error-page p {
                font-size: 18px;
                color: #721c24;
            }
            .error-page span {
                font-weight: bold;
                font-size: 24px;
                color: #d6336c;
            }
        `;
        document.head.appendChild(style);

        // Countdown timer
        let countdown = 60; // Mulai dari 60 detik
        const countdownTimerElement = document.getElementById('countdown-timer');

        const countdownInterval = setInterval(() => {
            countdown--;
            countdownTimerElement.textContent = countdown;

            // Jika waktu habis, reload halaman
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                location.reload(); // Memuat ulang halaman
            }
        }, 1000); // Update setiap detik (1000 ms)
    }

    // Fungsi untuk memulai slideshow
    function startSlideshow() {
        let currentIndex = 0;

        const displayFile = (file) => {
            slideshowContent.innerHTML = ''; // Clear existing content

            const fileElement = document.createElement(file.type === 'video' ? 'video' : 'img');
            fileElement.src = `/WINI-INFORMATION/assets/${file.name}`;

            // Memastikan file bisa dimuat, jika tidak ada file maka lanjutkan ke file berikutnya
            fileElement.onerror = () => {
                console.error(`File ${file.name} tidak ditemukan, melanjutkan ke file berikutnya`);
                showNextFile(); // Pindah ke file berikutnya jika file tidak ditemukan
            };

            if (file.type === 'video') {
                fileElement.muted = true;
                fileElement.autoplay = true;
                fileElement.controls = false;
            }

            // Menambahkan elemen media ke kontainer tanpa animasi acak
            slideshowContent.appendChild(fileElement);
        };

        const showNextFile = () => {
            // Cek apakah ada file yang perlu ditampilkan
            if (filesList.length === 0) {
                console.log('Tidak ada file untuk ditampilkan');
                return; // Jika tidak ada file, keluar dari fungsi
            }

            const nextFile = filesList[currentIndex];
            displayFile(nextFile);

            let delayDuration = 30000; // Default delay untuk gambar

            if (nextFile.type === 'video') {
                const videoElement = slideshowContent.querySelector('video');
                videoElement.onended = () => showNextFile(); // Pindah ke file berikutnya setelah video selesai
                delayDuration = videoElement.duration * 1000; // Durasi video dalam milidetik
            } else {
                // Menunggu waktu yang cukup untuk animasi selesai sebelum mengganti gambar
                setTimeout(showNextFile, delayDuration); // Ganti gambar setelah durasi selesai
            }

            currentIndex = (currentIndex + 1) % filesList.length;
            console.log(currentIndex);

            // Cek apakah sudah kembali ke index 0 (berarti sudah menampilkan semua file)
            if (currentIndex === 0) {
                // Untuk memastikan file terakhir ditampilkan dengan baik
                const lastFile = filesList[filesList.length - 1];
                if (lastFile.type === 'video') {
                    // Tunggu video terakhir selesai, baru reload halaman
                    const videoElement = slideshowContent.querySelector('video');
                    videoElement.onended = () => {
                        setTimeout(() => {
                            location.reload(); // Mulai ulang slideshow
                        }, 1000); // Tunggu sebentar sebelum reload
                    };
                } else {
                    // Jika file terakhir adalah gambar, langsung reload
                    setTimeout(() => {
                        location.reload(); // Mulai ulang slideshow
                    }, delayDuration);
                }
            }
        };

        showNextFile();
    }

    // Load daftar file saat halaman di-load
    loadFilesList();
});
