// auth.js - Improved Version

// Pastikan Firebase SDK sudah dimuat dan diinisialisasi
// Contoh:
// <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
// <script>
//   const firebaseConfig = { ... }; // Konfigurasi Firebase Anda
//   firebase.initializeApp(firebaseConfig);
//   const auth = firebase.auth(); // Pastikan 'auth' dideklarasikan secara global atau diakses dari window
// </script>

document.addEventListener("DOMContentLoaded", function() {
    // Dapatkan elemen-elemen UI
    const loginForm = document.querySelector('#login-form');
    const errorMessageElement = document.getElementById("error-message");
    const loginButton = document.getElementById("login-button");

    // Pastikan elemen-elemen penting ada sebelum melanjutkan
    if (!loginForm || !errorMessageElement || !loginButton) {
        console.error("Error: Elemen UI login tidak ditemukan. Pastikan ID HTML sudah benar.");
        return;
    }

    // Fungsi untuk menampilkan/menyembunyikan pesan error
    function displayError(message) {
        errorMessageElement.innerHTML = message;
        errorMessageElement.style.display = message ? 'block' : 'none'; // Tampilkan jika ada pesan, sembunyikan jika kosong
    }

    // Fungsi untuk mengaktifkan/menonaktifkan tombol login dan menampilkan loading
    function setLoginLoading(isLoading) {
        if (isLoading) {
            loginButton.disabled = true;
            loginButton.textContent = 'Logging in...'; // Atau gunakan spinner
            displayError(''); // Hapus pesan error saat loading dimulai
        } else {
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        }
    }

    // Listener untuk perubahan status autentikasi
    // Asumsi 'auth' adalah variabel global yang sudah diinisialisasi dari Firebase SDK.
    // Asumsi 'setupUI' adalah fungsi global yang didefinisikan di 'index.js'.
    if (typeof auth !== 'undefined' && auth.onAuthStateChanged) {
        auth.onAuthStateChanged(user => {
            if (user) {
                console.log("Login sebagai email:", user.email);
                console.log("UID Pengguna:", user.uid);
                if (typeof setupUI === 'function') {
                    setupUI(user);
                } else {
                    console.warn("Fungsi setupUI tidak ditemukan. Pastikan index.js dimuat dengan benar.");
                }
                displayError(''); // Bersihkan pesan error saat berhasil login
            } else {
                console.log("Pengguna logout.");
                if (typeof setupUI === 'function') {
                    setupUI(); // Panggil setupUI tanpa argumen untuk menampilkan UI logout
                } else {
                    console.warn("Fungsi setupUI tidak ditemukan. Pastikan index.js dimuat dengan benar.");
                }
            }
        });
    } else {
        console.error("Firebase Auth object (auth) tidak ditemukan atau tidak diinisialisasi dengan benar. Pastikan Firebase SDK dimuat sebelum auth.js.");
        displayError("Aplikasi tidak dapat terhubung ke autentikasi. Mohon coba lagi nanti.");
    }

    // Event listener untuk form login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Mencegah reload halaman
        setLoginLoading(true); // Aktifkan loading

        const email = loginForm['input-email'].value;
        const password = loginForm['input-password'].value;

        // Coba login
        auth.signInWithEmailAndPassword(email, password)
            .then((cred) => {
                // Login berhasil
                loginForm.reset(); // Reset form
                console.log("Login berhasil untuk email:", email);
                // setupUI akan dipanggil oleh onAuthStateChanged listener
            })
            .catch((error) => {
                // Login gagal
                const errorMessage = error.message;
                console.error("Login gagal:", errorMessage);
                displayError(errorMessage); // Tampilkan pesan error ke pengguna
            })
            .finally(() => {
                setLoginLoading(false); // Nonaktifkan loading, terlepas dari berhasil/gagal
            });
    });

    // Event listener untuk tombol logout
    // Asumsi 'logout-link' ada di DOM
    const logoutLink = document.querySelector('#logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault(); // Mencegah reload halaman
            auth.signOut()
                .then(() => {
                    console.log("Pengguna berhasil logout.");
                    // setupUI akan dipanggil oleh onAuthStateChanged listener
                })
                .catch((error) => {
                    console.error("Error saat logout:", error.message);
                    displayError("Gagal logout: " + error.message); // Tampilkan pesan error logout
                });
        });
    } else {
        console.warn("Elemen '#logout-link' tidak ditemukan. Pastikan ID HTML sudah benar.");
    }
});
