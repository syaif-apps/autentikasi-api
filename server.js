// file: server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 3000;

// Ini adalah kunci rahasia Anda. Simpan di variabel lingkungan, jangan di hardcode!
const JWT_SECRET = 'kunci_rahasia_super_aman_anda';

app.use(cors()); 
app.use(express.json());

// Middleware untuk mem-parsing body request JSON
app.use(express.json());

// --- ENDPOINT LOGIN ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Di sini Anda akan memeriksa username dan password di database Anda
    // Untuk contoh ini, kita pakai kredensial dummy
    if (username === 'user123' && password === 'passwordkuat') {
        // Jika kredensial valid, buat JWT
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
    } else {
        res.status(401).json({ message: 'Username atau password salah.' });
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


app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});