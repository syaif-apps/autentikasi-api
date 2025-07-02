// file: server.js
const express = require('express');
const cors = require('cors'); // Mengimpor pustaka CORS
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 3000;

// Ini adalah kunci rahasia Anda. Simpan di variabel lingkungan, jangan di hardcode!
const JWT_SECRET = 'kunci_rahasia_super_aman_anda';

// Middleware CORS untuk mengizinkan permintaan lintas origin dari frontend
app.use(cors());

// Middleware untuk mem-parsing body request JSON
// Pastikan hanya ada SATU baris ini
app.use(express.json());

// --- ENDPOINT LOGIN ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Di sini Anda akan memeriksa username dan password di database Anda
    // Untuk contoh ini, kita pakai kredensial dummy
    if (username === 'user123' && password === 'passwordkuat') {
        // Jika kredensial valid, buat JWT untuk user biasa
        const user = {
            id: 1,
            username: 'user123',
            role: 'member' // Contoh role
        };

        // Buat JWT: payload, secret, dan opsi (misalnya, waktu kadaluwarsa)
        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' }); // Token berlaku 1 jam

        res.json({
            message: 'Login berhasil!',
            token: token // Kirim token kembali ke klien
        });
    } else if (username === 'admin' && password === 'adminpass') {
        // Jika kredensial valid, buat JWT untuk admin
        const user = {
            id: 2,
            username: 'admin',
            role: 'admin' // Role: admin
        };
        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
        res.json({
            message: 'Login berhasil!',
            token: token
        });
    } else {
        // Jika kredensial tidak valid
        res.status(401).json({
            message: 'Username atau password salah.'
        });
    }
});

// --- MIDDLEWARE AUTENTIKASI (Melindungi Endpoint) ---
function authenticateToken(req, res, next) {
    // Ambil token dari header Authorization
    // Format: Authorization: Bearer <TOKEN>
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Ambil bagian token setelah 'Bearer'

    if (token == null) {
        return res.status(401).json({ message: 'Token tidak tersedia. Akses ditolak.' });
    }

    // Verifikasi token
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // Jika ada kesalahan (misalnya token tidak valid atau kadaluwarsa)
            return res.status(403).json({ message: 'Token tidak valid atau kadaluwarsa. Akses ditolak.' });
        }
        // Jika token valid, tambahkan informasi user ke objek request
        req.user = user;
        next(); // Lanjutkan ke handler route
    });
}

// Middleware Otorisasi untuk Admin (RBAC)
function authorizeAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Akses ditolak: Hanya admin yang diizinkan.' });
    }
    next();
}

// --- ENDPOINT YANG DILINDUNGI (Hanya bisa diakses dengan JWT valid) ---
app.get('/api/tasks', authenticateToken, (req, res) => {
    // req.user sekarang berisi payload dari JWT
    console.log(`User ${req.user.username} (${req.user.id}) mengakses daftar tugas.`);
    res.json([
        { id: 1, title: 'Beli bahan makanan', completed: false, assignedTo: req.user.username },
        { id: 2, title: 'Selesaikan laporan', completed: true, assignedTo: 'admin' }
    ]);
});

// Contoh endpoint lain yang dilindungi
app.post('/api/tasks', authenticateToken, (req, res) => {
    // Tambahan: Anda bisa menambahkan logika otorisasi di sini (misalnya, hanya admin yang bisa membuat tugas baru)
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Anda tidak memiliki izin untuk melakukan ini.' });
    }
    const { title } = req.body;
    res.status(201).json({ message: `Tugas "${title}" berhasil ditambahkan oleh ${req.user.username}.` });
});

// --- ENDPOINT YANG DILINDUNGI DAN HANYA UNTUK ADMIN ---
// Hanya admin yang bisa mendapatkan daftar semua pengguna
app.get('/api/users', authenticateToken, authorizeAdmin, (req, res) => {
    console.log(`Admin ${req.user.username} mengakses daftar semua pengguna.`);
    res.json([
        { id: 1, username: 'user123', role: 'member' },
        { id: 2, username: 'admin456', role: 'admin' },
        { id: 3, username: 'editor789', role: 'editor' }
    ]);
});

// Hanya admin yang bisa menghapus pengguna
app.delete('/api/users/:id', authenticateToken, authorizeAdmin, (req, res) => {
    const userIdToDelete = req.params.id;
    console.log(`Admin ${req.user.username} mencoba menghapus user ID: ${userIdToDelete}`);
    // Logika penghapusan user dari database akan ada di sini
    res.json({ message: `User ID ${userIdToDelete} berhasil dihapus oleh admin.` });
});

// --- ENDPOINT DENGAN OTORISASI BERDASARKAN KEPEMILIKAN DATA ---
// Contoh data dummy yang "dimiliki" oleh pengguna
const userSpecificData = {
    '1': [ // User ID 1 memiliki data ini
        { id: 101, content: 'Catatan pribadi user123', ownerId: 1 },
        { id: 102, content: 'Daftar belanja user123', ownerId: 1 }
    ],
    '2': [ // User ID 2 (admin) memiliki data ini
        { id: 201, content: 'Pengaturan sistem rahasia admin', ownerId: 2 }
    ]
};

// Pengguna hanya bisa melihat data pribadi mereka sendiri
app.get('/api/my-data', authenticateToken, (req, res) => {
    console.log('Menerima permintaan GET /api/my-data'); // Debug log
    const currentUserId = req.user.id.toString(); // Pastikan tipe data sama untuk key object
    console.log('currentUserId dari token:', currentUserId); // Debug log

    if (userSpecificData[currentUserId]) {
        console.log('Mengirim data untuk user ID:', currentUserId); // Debug log
        res.json(userSpecificData[currentUserId]);
    } else {
        console.log('Data tidak ditemukan untuk user ID:', currentUserId); // Debug log
        res.status(404).json({ message: 'Tidak ada data pribadi ditemukan untuk pengguna ini.' });
    }
});

// Pengguna hanya bisa mengakses data tertentu jika mereka adalah pemiliknya (atau admin)
app.get('/api/data/:dataId', authenticateToken, (req, res) => {
    const requestedDataId = parseInt(req.params.dataId);
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    let foundData = null;
    let dataOwnerId = null;

    // Cari data di semua daftar data userSpecificData
    for (const userIdKey in userSpecificData) {
        const dataItems = userSpecificData[userIdKey];
        for (const item of dataItems) {
            if (item.id === requestedDataId) {
                foundData = item;
                dataOwnerId = item.ownerId;
                break;
            }
        }
        if (foundData) break;
    }

    if (!foundData) {
        return res.status(404).json({ message: 'Data tidak ditemukan.' });
    }

    // Otorisasi: Hanya pemilik atau admin yang bisa mengakses data ini
    if (currentUserId === dataOwnerId || currentUserRole === 'admin') {
        console.log(`User ${req.user.username} berhasil mengakses data ID: ${requestedDataId}`);
        res.json(foundData);
    } else {
        res.status(403).json({ message: 'Akses ditolak: Anda tidak memiliki izin untuk melihat data ini.' });
    }
});


// --- Middleware Penanganan Error Umum (harus di bagian paling bawah, sebelum app.listen) ---
app.use((err, req, res, next) => {
    console.error(err.stack); // Log error stack ke konsol server
    res.status(500).json({
        message: 'Terjadi kesalahan server internal.',
        error: err.message // Berikan pesan error, tapi hati-hati di produksi
    });
});

// --- Middleware 404 (Not Found) (harus di bagian paling bawah, setelah semua route) ---
app.use((req, res) => {
    res.status(404).json({
        message: 'Endpoint tidak ditemukan.'
    });
});


app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
