// script.js

const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
const loginStatus = document.getElementById('loginStatus');

const getTasksButton = document.getElementById('getTasksButton');
const createTaskButton = document.getElementById('createTaskButton');
const getAllUsersButton = document.getElementById('getAllUsersButton');
const deleteUserButton = document.getElementById('deleteUserButton');
const deleteUserIdInput = document.getElementById('deleteUserIdInput');
const getMyDataButton = document.getElementById('getMyDataButton');
const getDataByIdButton = document.getElementById('getDataByIdButton');
const dataIdInput = document.getElementById('dataIdInput');

const outputArea = document.getElementById('output');
const statusMessage = document.getElementById('statusMessage');

let authToken = localStorage.getItem('authToken') || ''; // Coba ambil token dari Local Storage

// --- Fungsi Helper ---
function displayOutput(message) {
    outputArea.textContent = JSON.stringify(message, null, 2);
    console.log(message);
}

function displayStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    if (type === 'error') {
        console.error("Status:", message);
    } else {
        console.log("Status:", message);
    }
}

function updateUI() {
    if (authToken) {
        loginStatus.textContent = 'Login Berhasil!';
        loginButton.disabled = true;
        logoutButton.disabled = false;
        getTasksButton.disabled = false;
        createTaskButton.disabled = false;
        getAllUsersButton.disabled = false;
        deleteUserButton.disabled = false;
        getMyDataButton.disabled = false;
        getDataByIdButton.disabled = false;
    } else {
        loginStatus.textContent = 'Belum Login';
        loginButton.disabled = false;
        logoutButton.disabled = true;
        getTasksButton.disabled = true;
        createTaskButton.disabled = true;
        getAllUsersButton.disabled = true;
        deleteUserButton.disabled = true;
        getMyDataButton.disabled = true;
        getDataByIdButton.disabled = true;
    }
}

// --- Event Listeners ---
loginButton.addEventListener('click', async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken); // Simpan token
            displayStatus('Login berhasil!', 'success');
            displayOutput(data);
        } else {
            displayStatus(`Login Gagal: ${data.message}`, 'error');
            displayOutput(data);
        }
    } catch (error) {
        displayStatus(`Terjadi kesalahan saat login: ${error.message}`, 'error');
        displayOutput(error);
    } finally {
        updateUI();
    }
});

logoutButton.addEventListener('click', () => {
    authToken = '';
    localStorage.removeItem('authToken'); // Hapus token
    displayStatus('Logout berhasil.', 'success');
    displayOutput('Anda telah logout.');
    updateUI();
});

getTasksButton.addEventListener('click', async () => {
    try {
        const response = await fetch('http://localhost:3000/api/tasks', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            displayStatus('Daftar tugas berhasil diambil.', 'success');
            displayOutput(data);
        } else {
            displayStatus(`Gagal mendapatkan tugas: ${data.message}`, 'error');
            displayOutput(data);
        }
    } catch (error) {
        displayStatus(`Terjadi kesalahan saat mengambil tugas: ${error.message}`, 'error');
        displayOutput(error);
    }
});

createTaskButton.addEventListener('click', async () => {
    const taskTitle = prompt('Masukkan judul tugas baru:');
    if (!taskTitle) return;

    try {
        const response = await fetch('http://localhost:3000/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ title: taskTitle })
        });

        const data = await response.json();

        if (response.ok) {
            displayStatus(`Tugas "${taskTitle}" berhasil dibuat.`, 'success');
            displayOutput(data);
        } else {
            displayStatus(`Gagal membuat tugas: ${data.message}`, 'error');
            displayOutput(data);
        }
    } catch (error) {
        displayStatus(`Terjadi kesalahan saat membuat tugas: ${error.message}`, 'error');
        displayOutput(error);
    }
});

getAllUsersButton.addEventListener('click', async () => {
    try {
        const response = await fetch('http://localhost:3000/api/users', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            displayStatus('Daftar semua user berhasil diambil (Admin).', 'success');
            displayOutput(data);
        } else {
            displayStatus(`Gagal mendapatkan user: ${data.message}`, 'error');
            displayOutput(data);
        }
    } catch (error) {
        displayStatus(`Terjadi kesalahan saat mengambil user: ${error.message}`, 'error');
        displayOutput(error);
    }
});

deleteUserButton.addEventListener('click', async () => {
    const userIdToDelete = deleteUserIdInput.value;
    if (!userIdToDelete) {
        displayStatus('Masukkan User ID yang akan dihapus.', 'error');
        return;
    }

    if (!confirm(`Anda yakin ingin menghapus user ID ${userIdToDelete}? (Hanya Admin)`)) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/users/${userIdToDelete}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            displayStatus(`User ID ${userIdToDelete} berhasil dihapus.`, 'success');
            displayOutput(data);
        } else {
            displayStatus(`Gagal menghapus user: ${data.message}`, 'error');
            displayOutput(data);
        }
    } catch (error) {
        displayStatus(`Terjadi kesalahan saat menghapus user: ${error.message}`, 'error');
        displayOutput(error);
    }
});

getMyDataButton.addEventListener('click', async () => {
    try {
        const response = await fetch('http://localhost:3000/api/my-data', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            displayStatus('Data pribadi berhasil diambil.', 'success');
            displayOutput(data);
        } else {
            displayStatus(`Gagal mendapatkan data pribadi: ${data.message}`, 'error');
            displayOutput(data);
        }
    } catch (error) {
        displayStatus(`Terjadi kesalahan saat mengambil data pribadi: ${error.message}`, 'error');
        displayOutput(error);
    }
});

getDataByIdButton.addEventListener('click', async () => {
    const dataId = dataIdInput.value;
    if (!dataId) {
        displayStatus('Masukkan Data ID.', 'error');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/data/${dataId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            displayStatus(`Data ID ${dataId} berhasil diambil.`, 'success');
            displayOutput(data);
        } else {
            displayStatus(`Gagal mendapatkan data ID ${dataId}: ${data.message}`, 'error');
            displayOutput(data);
        }
    } catch (error) {
        displayStatus(`Terjadi kesalahan saat mengambil data ID ${dataId}: ${error.message}`, 'error');
        displayOutput(error);
    }
});

// Inisialisasi UI saat halaman dimuat
document.addEventListener('DOMContentLoaded', updateUI);