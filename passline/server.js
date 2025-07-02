const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();

// Middleware untuk parsing JSON request body
app.use(express.json());
// Middleware untuk menyajikan file statis dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Path ke database SQLite
const dbPath = path.join(__dirname, 'checklist.db');

// Koneksi ke database SQLite
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Buat tabel jika belum ada
        db.run(`CREATE TABLE IF NOT EXISTS checklist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            barcode TEXT NOT NULL,
            area TEXT NOT NULL,
            shift TEXT NOT NULL,
            time TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (createErr) => {
            if (createErr) {
                console.error('Error creating table:', createErr.message);
            } else {
                console.log('Table "checklist" is ready.');
            }
        });
    }
});

// Endpoint untuk menyimpan data
app.post('/save-data', (req, res) => {
    const { barcode, area, shift, time } = req.body;

    if (!barcode || !area || !shift || !time) {
        return res.status(400).json({ error: 'Missing required data: barcode, area, shift, or time.' });
    }

    const sql = `INSERT INTO checklist (barcode, area, shift, time) VALUES (?, ?, ?, ?)`;
    db.run(sql, [barcode, area, shift, time], function(err) {
        if (err) {
            console.error('Error saving data:', err.message);
            res.status(500).json({ error: 'Failed to save data.' });
        } else {
            console.log(`A row has been inserted with rowid ${this.lastID}`);
            res.status(201).json({ message: 'Data saved successfully.', id: this.lastID });
        }
    });
});

// Endpoint untuk mendapatkan semua data
app.get('/get-data', (req, res) => {
    const sql = `SELECT id, barcode, area, shift, time, timestamp FROM checklist ORDER BY timestamp DESC`; // Ambil juga timestamp
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching data:', err.message);
            res.status(500).json({ error: 'Failed to fetch data.' });
        } else {
            res.json(rows);
        }
    });
});

// --- Endpoint baru untuk menghapus data ---
app.post('/delete-data', (req, res) => {
    const { ids } = req.body; // Menerima array of IDs

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty list of IDs provided.' });
    }

    // Buat string placeholder untuk query SQL (?, ?, ?)
    const placeholders = ids.map(() => '?').join(',');
    const sql = `DELETE FROM checklist WHERE id IN (${placeholders})`;

    db.run(sql, ids, function(err) {
        if (err) {
            console.error('Error deleting data:', err.message);
            res.status(500).json({ error: 'Failed to delete data.' });
        } else {
            console.log(`Deleted ${this.changes} row(s)`);
            res.json({ message: `Successfully deleted ${this.changes} row(s).` });
        }
    });
});
// --- Akhir Endpoint baru untuk menghapus data ---


// Jalankan server
// Jangan memulai server di sini lagi
module.exports = app;


// Tutup koneksi database saat aplikasi berhenti
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});