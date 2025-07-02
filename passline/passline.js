const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('passline.db');

db.run(`CREATE TABLE IF NOT EXISTS checklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode TEXT,
    area TEXT,
    shift TEXT,
    time TEXT
)`);

app.post('/submit-checklist', (req, res) => {
    const { barcode, area, shift, time } = req.body;
    db.run(
        `INSERT INTO checklist (barcode, area, shift, time) VALUES (?, ?, ?, ?)`,
        [barcode, area, shift, time],
        function (err) {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
            } else {
                res.json({ success: true, id: this.lastID });
            }
        }
    );
});


// Jalankan server
// Jangan memulai server di sini lagi
module.exports = app;