const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

// Folder sumber pencarian
const sourceDirs = [
  { path: "Q:/", label: "krd" },
  { path: "L:/", label: "database" },
];

// Fungsi untuk mencari file
async function searchFiles(dir, query) {
  let results = [];
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (let item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        results = results.concat(await searchFiles(fullPath, query));
      } else if (item.name.toLowerCase().includes(query.toLowerCase())) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
  }
  return results;
}

// Fungsi untuk mendapatkan tanggal dan waktu saat ini
function getCurrentDateTime() {
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  return now.toLocaleDateString('id-ID', options);
}

// Tampilan pencarian
router.get("/", async (req, res) => {
  const query = req.query.q || "";
  let searchResults = [];

  if (query) {
    for (const src of sourceDirs) {
      const found = await searchFiles(src.path, query);
      found.forEach(file => {
        searchResults.push({
          filePath: file,
          source: src.label
        });
      });
    }
  }

  const currentTime = getCurrentDateTime(); // Ambil waktu saat ini

  const resultHTML = searchResults.length
    ? `<ul>
        ${searchResults
          .map(result => {
            const relativePath = result.filePath.replace(/\\/g, "/").replace(/^Q:\//, "");
            const fileName = path.basename(result.filePath);
            return `<li><span class="tag">${result.source}</span> <a href="/qdb_new/file/${encodeURIComponent(relativePath)}" target="_blank">${fileName}</a></li>`;
          })
          .join("")}
      </ul>`
    : query
      ? `<p style="margin-top:20px;">🔍 Tidak ditemukan hasil untuk "<b>${query}</b>"</p>`
      : "";

  res.send(`
    <html>
      <head>
        <title>Search Files - KRD & DATABASE</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Roboto', sans-serif;
            background: linear-gradient(to right, #e0e5ec, #f4f7fc);
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            color: #333;
          }
          .container {
            max-width: 80%;
            width: 90%;
            background: #fff;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
          }
          .sticky-header {
            position: sticky;
            top: 0;
            background: #fff;
            z-index: 10;
            text-align: center;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            padding: 15px;
            margin-bottom: 20px;
          }
          .header-text {
            font-family: 'Playfair Display', serif;
            font-size: 2em;
            color: #2c3e50;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 0;
            font-weight: bold;
          }
          .sub-header {
            font-family: 'Roboto', sans-serif;
            font-size: 1.2em;
            color: #3498db;
            margin: 5px 0;
          }
          .date-time {
            font-size: 1.1em;
            color: #7f8c8d;
            margin-top: 10px;
          }
          h2 {
            text-align: center;
            margin: 30px 0;
            color: #2980b9;
            font-size: 2.5em;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          form {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-bottom: 20px;
          }
          input[type="text"] {
            width: 60%;
            padding: 15px;
            border: 2px solid #3498db;
            border-radius: 30px;
            font-size: 16px;
            transition: border-color 0.3s;
            outline: none;
          }
          input[type="text"]:focus {
            border-color: #2980b9;
          }
          button {
            padding: 15px 25px;
            background: #3498db;
            border: none;
            color: #fff;
            font-size: 16px;
            border-radius: 30px;
            cursor: pointer;
            transition: background 0.3s, transform 0.2s;
          }
          button:hover {
            background: #2980b9;
            transform: scale(1.05);
          }
          ul {
            list-style: none;
            padding: 0;
          }
          li {
            background: #ecf9f8;
            margin-bottom: 15px;
             padding: 20px;
             border: 2px solid #3498db; /* tambah border biru */
             border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: background 0.2s, border-color 0.2s;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          }
            li:hover {
            background: #d1f8f6;
             border-color: #2980b9; /* saat hover, warna border biru lebih gelap */
          }

          a {
            color: #2980b9;
            text-decoration: none;
            font-weight: 500;
            flex: 1;
          }
          a:hover {
            text-decoration: underline;
          }
          .tag {
            background: #2ecc71;
            color: #fff;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-right: 10px;
          }
          p {
            text-align: center;
            color: #555;
            font-size: 1.2em;
          }
          /* Media Queries untuk tampilan responsif */
          @media (max-width: 600px) {
            h2 {
              font-size: 2em;
            }
            .container {
              padding: 20px;
            }
            .date-time {
              font-size: 1em;
            }
            button {
              width: 100%;
            }
          }
        </style>
        <script>
          function clearSearchInput() {
            document.getElementById('searchInput').value = '';
          }
          window.onload = function() {
            if (${searchResults.length} > 0) {
              clearSearchInput();
            }
          };
        </script>
      </head>
      <body>
        <div class="container">
          <div class="sticky-header">
            <div class="header-text">PT. Sumitomo Electric Wintec Indonesia</div>
            <div class="sub-header">Quality Database System</div>
            <div class="date-time">${currentTime}</div>
          </div>
          <h2>🔎 Cari File</h2>
          <form method="get" action="/qdb">
            <input type="text" id="searchInput" name="q" placeholder="Cari nama file..." value="${query}" required />
            <button type="submit">Cari</button>
          </form>
          ${resultHTML}
        </div>
      </body>
    </html>
  `);
});

// Route untuk akses file
router.get("/file/:path", async (req, res) => {
  const relativePath = decodeURIComponent(req.params.path);
  const fullPath = path.join("Q:/", relativePath);

  try {
    await fs.access(fullPath);
    res.sendFile(fullPath, (err) => {
      if (err) {
        console.error(`Error sending file ${fullPath}:`, err);
        res.status(404).send("File tidak ditemukan.");
      }
    });
  } catch (err) {
    console.error(`File not found: ${fullPath}`, err);
    res.status(404).send("File tidak ditemukan.");
  }
});

module.exports = router;
