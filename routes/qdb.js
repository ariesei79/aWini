// const express = require("express")
// const path = require("path")
// const fs = require("fs")
// const router = express.Router()

// const folders = [
//   { path: "Q:\\Indication Slip", route: "indication-slip" },
//   { path: "Q:\\IDS", route: "ids" },
//   { path: "Q:\\Worksheet", route: "worksheet" },
// ]

// function isImage(filename) {
//   return /\.(jpg|jpeg|png|gif)$/i.test(filename)
// }

// router.get("/search", (req, res) => {
//   const { year, month, mesin } = req.query

//   if (!year || !month || !mesin) {
//     return res.status(400).json({ error: "Parameter tidak lengkap" })
//   }

//   const mesinLower = mesin.toLowerCase()

//   const result = folders.map(({ path: rootPath, route }) => {
//     const targetPath = path.join(rootPath, year, month, mesinLower)
//     let files = []

//     try {
//       if (fs.existsSync(targetPath)) {
//         const foundFiles = fs.readdirSync(targetPath)
//         files = foundFiles.map((file) => {
//           const urlPath = `/files/${route}/${year}/${month}/${mesinLower}/${file}`
//           return {
//             name: file,
//             openUrl: urlPath,
//             downloadUrl: urlPath, // Sama saja, tinggal dipakai <a download>
//             type: isImage(file) ? "image" : "other",
//           }
//         })
//       }
//     } catch (err) {
//       console.error(`Gagal membaca folder ${targetPath}:`, err)
//     }

//     return {
//       path: rootPath,
//       files,
//     }
//   })

//   res.json(result)
// })

// module.exports = router

const express = require("express");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const router = express.Router();

const folders = [
  { path: "Q:\\Indication Slip", route: "indication-slip" },
  { path: "Q:\\IDS", route: "ids" },
  { path: "Q:\\Worksheet", route: "worksheet" },
];

function isImage(filename) {
  return /\.(jpg|jpeg|png|gif|tif|tiff)$/i.test(filename);
}

// 🔍 Route pencarian file
router.get("/search", (req, res) => {
  const { year, month, mesin } = req.query;

  if (!year || !month || !mesin) {
    return res.status(400).json({ error: "Parameter tidak lengkap" });
  }

  const mesinLower = mesin.toLowerCase();
  const results = [];

  folders.forEach(({ path: rootPath, route }) => {
    const targetPath = path.join(rootPath, year, month, mesinLower);
    if (!fs.existsSync(targetPath)) return;

    try {
      const files = fs.readdirSync(targetPath);

      files.forEach((file) => {
        const ext = path.extname(file).toLowerCase();
        const isTif = ext === ".tif" || ext === ".tiff";
        const isImg = isImage(file);

        const openUrl = isTif
          ? `/QDB_Last/convert-tif?folder=${route}&year=${year}&month=${month}&mesin=${mesinLower}&file=${encodeURIComponent(file)}`
          : `/files/${route}/${year}/${month}/${mesinLower}/${encodeURIComponent(file)}`;

        const filePath = path.join(targetPath, file);
        const stats = fs.statSync(filePath);

        results.push({
          name: file,
          path: filePath,
          folder: route,
          ext: ext.replace(".", ""),
          size: stats.size,
          openUrl,
          type: isImg ? "image" : "other",
        });
      });
    } catch (err) {
      console.error(`Gagal membaca folder ${targetPath}:`, err);
    }
  });

  res.json(results);
});

// 🖼️ Route konversi .tif → .png (file lain tidak boleh lewat sini)
router.get("/convert-tif", async (req, res) => {
  const { folder, year, month, mesin, file } = req.query;

  if (!folder || !year || !month || !mesin || !file) {
    return res.status(400).send("Parameter tidak lengkap.");
  }

  const ext = path.extname(file).toLowerCase();
  if (ext !== ".tif" && ext !== ".tiff") {
    return res.status(400).send("Hanya file .tif atau .tiff yang dapat dikonversi.");
  }

  const folderEntry = folders.find((f) => f.route === folder);
  if (!folderEntry) {
    return res.status(400).send("Folder tidak valid.");
  }

  const tifPath = path.join(
    folderEntry.path,
    year,
    month,
    mesin.toLowerCase(),
    file
  );

  try {
    if (!fs.existsSync(tifPath)) {
      return res.status(404).send("File tidak ditemukan.");
    }

    const imageBuffer = await sharp(tifPath)
      .png()
      .toBuffer();

    res.set("Content-Type", "image/png");
    res.send(imageBuffer);
  } catch (err) {
    console.error("Gagal mengonversi .tif:", err);
    res.status(500).send("Gagal mengonversi file .tif.");
  }
});


const mainFolder = "L:\\"
const monthMap = {
  A: "01",
  B: "02",
  C: "03",
  D: "04",
  E: "05",
  F: "06",
  G: "07",
  H: "08",
  I: "09",
  J: "10",
  K: "11",
  L: "12",
  X: "11",
  Y: "12",
}

router.post("/search-file", (req, res) => {
  const { inputValue } = req.body

  const result = buildFilePath2(inputValue)
  if (!result.success) {
    return res.json(result)
  }

  const { mesin, bulan, tahun, fileNamePattern } = result.path
  console.log(tahun, bulan, mesin, fileNamePattern)

  const mesinFolderPath = path.join(mainFolder, mesin, "DATA")

  if (!fs.existsSync(mesinFolderPath)) {
    return res.json({ success: false, error: `Folder mesin "${mesin}" tidak ditemukan.` })
  }

  const allItems = fs.readdirSync(mesinFolderPath)
  const folders = allItems.filter((item) => fs.statSync(path.join(mesinFolderPath, item)).isDirectory())

  if (folders.length === 0) {
    return res.json({ success: false, error: `Tidak ada subfolder di ${mesinFolderPath}` })
  }

  const randomFolder = folders[Math.floor(Math.random() * folders.length)]
  const fullPath = path.join(mesinFolderPath, randomFolder, tahun, bulan)
  console.log(fullPath)

  if (!fs.existsSync(fullPath)) {
    return res.json({ success: false, error: `Path tidak ditemukan: ${fullPath}` })
  }

  // Baca semua file di folder bulan
  const files = fs.readdirSync(fullPath)

  // Cari file yang sesuai dengan pattern
  const matchedFile = files.find((file) => file.includes(fileNamePattern))

  if (matchedFile) {
    const filePath = path.join(fullPath, matchedFile)
    res.json({
      success: true,
      message: "File ditemukan!",
      path: filePath,
      fileName: matchedFile,
    })
  } else {
    res.json({
      success: false,
      error: `File dengan pola "${fileNamePattern}" tidak ditemukan di path: ${fullPath}`,
    })
  }
})

function getBulanFromChar(char) {
  const c = char?.toUpperCase()

  // Angka 1–9 langsung jadi bulan
  if (/^[1-9]$/.test(c)) {
    return c.padStart(2, "0") // format "01", ..., "09"
  }

  // Mapping huruf A-L, X, Y
  if (monthMap[c]) {
    return monthMap[c]
  }

  return null
}

function buildFilePath2(inputValue) {
  inputValue = (inputValue || "").trim().toUpperCase()

  if (inputValue.length < 7) {
    return { success: false, error: "Input harus minimal 7 karakter." }
  }
  let mesin = inputValue.substring(0, 3) // 3 huruf pertama = "12B"
  const mesinHead = inputValue.charAt(0) // 3 huruf pertama = "12B"
  if (mesinHead === "1") {
    mesin = "V" + mesin
  }
  const fourthChar = inputValue.charAt(3)
  const fifthChar = inputValue.charAt(4) // huruf ke-5 = "5"
  const bulan = getBulanFromChar(fifthChar)

  if (!bulan) {
    return { success: false, error: "Bulan tidak valid dari huruf ke-5 input." }
  }

  const tahun3Digit = new Date().getFullYear().toString().substring(0, 3) // contoh: "202"
  const tahun = tahun3Digit + fourthChar // contoh: "2025"
  const tanggal = inputValue.slice(-2) // 2 karakter terakhir = "12"

  // Buat fileNamePattern untuk pencarian
  const fileNamePattern = `${mesin}$${tahun}${bulan}${tanggal}`

  return {
    success: true,
    path: {
      mesin,
      tahun,
      bulan,
      tanggal,
      fileNamePattern, // bukan ekstensi .krd dulu, hanya pattern
    },
  }
}



module.exports = router;
