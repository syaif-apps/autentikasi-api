// file: client.js (jalankan di browser console atau environment Node.js dengan tool seperti 'node-fetch')

let authToken = ''; // Variabel untuk menyimpan token setelah login

// --- Langkah 1: Login untuk mendapatkan JWT ---
async function login() {
    const username = 'user123';
    const password = 'passwordkuat';

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token; // Simpan token
            console.log('Login Berhasil!', data.message);
            console.log('Token JWT:', authToken);
            // Lanjutkan untuk mengambil data yang dilindungi
            await getTasks();
            await createNewTask("Pelajari Autentikasi API Lebih Lanjut");
        } else {
            console.error('Login Gagal:', data.message);
        }
    } catch (error) {
        console.error('Terjadi kesalahan saat login:', error);
    }
}

// --- Langkah 2: Menggunakan JWT untuk mengakses endpoint yang dilindungi ---
async function getTasks() {
    if (!authToken) {
        console.log('Anda belum login. Silakan login terlebih dahulu.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/tasks', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}` // Sertakan token di header
            }
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Daftar Tugas (akses berhasil):', data);
        } else {
            console.error('Gagal mendapatkan tugas:', data.message);
        }
    } catch (error) {
        console.error('Terjadi kesalahan saat mengambil tugas:', error);
    }
}

// --- Contoh: Mencoba membuat tugas (akan gagal jika role bukan admin) ---
async function createNewTask(title) {
    if (!authToken) {
        console.log('Anda belum login. Silakan login terlebih dahulu.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ title })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Tugas berhasil dibuat:', data.message);
        } else {
            console.error('Gagal membuat tugas:', data.message);
        }
    } catch (error) {
        console.error('Terjadi kesalahan saat membuat tugas:', error);
    }
}

// Panggil fungsi login untuk memulai alur
login();