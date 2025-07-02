const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Folder tujuan
const uploadDir = path.join(__dirname, '../winisys/zztatic/PE/file');


if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Gunakan memoryStorage agar req.file.buffer tersedia
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route upload
router.post('/upload', upload.single('pdfFile'), (req, res) => {
    
    if (!req.file) {
        return res.status(400).json({ error: 'File tidak diterima' });
    }
    let customFileName = (req.body.customFileName || 'default.pdf').trim();
    customFileName = customFileName.replace(/[\r\n]+/g, '-');
    const customFileName2 = customFileName.substring(customFileName.lastIndexOf("-") + 1); // Pastikan hanya nama file

    const filePath = path.join(uploadDir, customFileName2);

    // Tulis buffer ke file
    fs.writeFile(filePath, req.file.buffer, (err) => {
        if (err) {
            console.error('Gagal menyimpan file:', err);
            return res.status(500).json({ error: 'Gagal menyimpan file' });
        }

        res.json({
            message: `File berhasil disimpan sebagai: ${customFileName2}`,
            path: filePath
        });
    });
});

module.exports = router;