const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// Tentukan lokasi folder assets di dalam information-board
const assetsDir = path.join(__dirname, 'assets');

// Menyajikan file static (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Menyajikan file media dari folder assets
app.use('/assets', express.static(assetsDir));

// Endpoint untuk mendapatkan daftar file media dalam folder 'assets'
app.get('/get-files', (req, res) => {
    fs.readdir(assetsDir, (err, files) => {
        if (err) {
            return res.status(500).send('Error reading assets directory');
        }

        const fileList = files.map(file => {
            const ext = path.extname(file).toLowerCase();
            const fileType = ext === '.mp4' || ext === '.webm' ? 'video' : 'image';
            return { name: file, type: fileType };
        });

        res.json(fileList);
    });
});

// Jangan memulai server di sini lagi
module.exports = app;
