const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

const DATABASE_FOLDER = 'Q:/';
const KRD_FOLDER = 'L:/'; // Folder khusus untuk file .krd

// Serve static files for frontend
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files for database
app.use('/', express.static(DATABASE_FOLDER));
app.use('/', express.static(KRD_FOLDER)); // Serve static files for .krd

// Search endpoint
app.get('/search', (req, res) => {
    const query = req.query.query.toLowerCase();
    
    const searchFiles = (dir, isKRD = false) => {
        let results = [];
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                results = results.concat(searchFiles(filePath, isKRD));
            } else {
                const ext = path.extname(file).toLowerCase();
                // Jika kita mencari file .krd, gunakan KRD_FOLDER
                if (isKRD) {
                    if (ext === '.krd' && file.toLowerCase().includes(query)) {
                        const webPath = `/${path.relative(KRD_FOLDER, filePath)}`;
                        results.push(webPath);
                    }
                } else {
                    // Untuk file lain di DATABASE_FOLDER
                    if (['.jpg', '.jpeg', '.png', '.tif', '.pdf', '.xls', '.xlsx'].includes(ext) && file.toLowerCase().includes(query)) {
                        const webPath = `/${path.relative(DATABASE_FOLDER, filePath)}`;
                        results.push(webPath);
                    }
                }
            }
        }
        return results;
    };

    // Menyimpan hasil pencarian dari kedua folder
    const results = searchFiles(DATABASE_FOLDER).concat(searchFiles(KRD_FOLDER, true));
    
    res.json(results);
});

// Jangan memulai server di sini lagi
module.exports = app;
