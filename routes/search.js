const express = require('express');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const router = express.Router();

// 📁 Folder sumber pencarian
const sourceFolders = [
  // 'M:\\PE',
  'Q:\\Indication Slip'
];

// 📝 Optional log ke file
const ENABLE_LOG_FILE = false;
const logStream = fs.createWriteStream('./log-pencarian.txt', { flags: 'a' });
function logToFile(text) {
  if (ENABLE_LOG_FILE) {
    logStream.write(`[${new Date().toISOString()}] ${text}\n`);
  }
}

// 🔍 Fungsi pencarian file dalam folder (rekursif)
function cariFileDalamFolder(folder, query, year) {
  let hasil = [];
  let files;

  try {
    files = fs.readdirSync(folder);
  } catch (err) {
    logToFile(`❌ Gagal membaca folder: ${folder}`);
    return hasil;
  }

  for (const file of files) {
    const filePath = path.join(folder, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        hasil = hasil.concat(cariFileDalamFolder(filePath, query, year));
      } else {
        const fileNameLower = file.toLowerCase();
        const queryLower = query.toLowerCase();
        const modYear = new Date(stat.mtime).getFullYear();

        if (
          fileNameLower.includes(queryLower) &&
          (year === 'all' || String(modYear) === String(year))
        ) {
          hasil.push({
            path: filePath,
            folder: folder.replace(/\\/g, '/'),
            size: stat.size,
            ext: path.extname(file).substring(1),
            mtime: stat.mtime
          });

          logToFile(`✔️ ${file} | Tahun: ${modYear}`);
        }
      }
    } catch (err) {
      logToFile(`❌ Gagal membaca file: ${filePath}`);
    }
  }

  return hasil;
}

// 🌐 Endpoint pencarian file
router.get('/search', (req, res) => {
  const { q, year } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Query minimal 2 huruf.' });
  }

  const targetYear = (year && year.trim() !== '') ? year.trim() : 'all';
  logToFile(`🔎 Cari: "${q}", Tahun: ${targetYear}`);

  let semuaHasil = [];

  for (const folder of sourceFolders) {
    if (fs.existsSync(folder)) {
      semuaHasil = semuaHasil.concat(cariFileDalamFolder(folder, q, targetYear));
    }
  }

  semuaHasil.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
  res.json(semuaHasil);
});

// 📂 Endpoint membuka file langsung
router.get('/open', (req, res) => {
  const filePath = req.query.path;

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).send('File tidak ditemukan.');
  }

  const ext = path.extname(filePath).toLowerCase();

  // ✅ Konversi .tif/.tiff ke PNG agar bisa langsung tampil di tab
  if (ext === '.tif' || ext === '.tiff') {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return sharp(filePath)
      .png()
      .on('error', () => res.status(500).send('Gagal konversi TIFF ke PNG.'))
      .pipe(res);
  }

  // 🎯 MIME types
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.txt': 'text/plain',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv',
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', fileSize);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=600');

  // ✅ Buka langsung di browser (PDF, Excel)
  if (ext === '.pdf' || ext === '.xls' || ext === '.xlsx') {
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
  }

  fs.createReadStream(filePath).pipe(res);
});

module.exports = router;
