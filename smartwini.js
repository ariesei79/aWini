const express = require("express")
const fs = require("fs")
const path = require("path")
const app = express()
const port = 80
const bodyParser = require("body-parser")
const redis = require("redis")
const cors = require("cors")
const sql = require("mssql");

app.use(
  cors({
    origin: "*",
  })
)
const config = {
  user: "oee",
  password: "oee",
  server: "172.17.44.106",
  database: "GRWINI",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

sql.connect(config)
  .then(pool => {
    global.dbPool = pool;
    console.log("Connected to SQL Server");
  })
  .catch(err => {
    console.log("Gagal koneksi Sql")
  });

//tambahan dari arie
const sqlite3 = require("sqlite3").verbose()
// let db = new sqlite3.Database("./PE_data.db", (err) => {
//   if (err) {
//     console.error(err.message)
//   }
//   console.log("Connected to the PE.db database Server OK")
// })

// Menggunakan aplikasi Express dari wini-information (server.js)
const informationWINIApp = require(path.join(__dirname, "winisys", "WINI-INFORMATION", "server.js"))
const informationCari = require(path.join(__dirname, "winisys", "cari", "server.js"))
const kanbankuRouter = require(path.join(__dirname, "routes", "kanbanku"))

const mainRoute = require("./routes/main")
const todoApp = require("./routes/todo")
const obeyaApp = require("./routes/obeyaRute")
const trelloApp = require("./routes/trello")
const qdbApp = require("./routes/qdb")
const qdbApp2 = require("./routes/qdb2")
const searchRoute = require("./routes/search")
const checksheet = require("./routes/checksheet")
const baraAppRoute = require("./routes/baraApp")
const uploadfile = require("./routes/uploadpdf")

// const mainRoute = require(path.join(__dirname, "routes", "main.js"))

// Middleware untuk melayani file statis (non express)
app.use(express.static(path.join(__dirname, "winisys/zztatic")))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Middleware untuk melayani file statis (CSS)
app.use("/public", express.static(path.join(__dirname, "public")))
app.use(express.static(path.join(__dirname, "public")))
app.use("/files/indication-slip", express.static("Q:/Indication Slip"))
app.use("/files/ids", express.static("Q:/IDS"))
app.use("/files/worksheet", express.static("Q:/Worksheet"))
app.use("/files", express.static("Q:\\"))
app.use("/files", express.static("L:\\"))
app.use("/files", express.static("L:/"))
// app.get("/", async (req, res) => {
//   const directoryPath = path.join(__dirname, "winisys/zztatic") // folder yang ingin Anda tampilkan

//   try {
//     // Membaca daftar folder di direktori
//     const files = await fs.promises.readdir(directoryPath, { withFileTypes: true })

//     // Menyaring hanya folder
//     const directories = files
//       .filter((file) => file.isDirectory())
//       .map((file) => file.name)
//       .sort()
//     //console.log('Folder yang ditemukan:', directories);

//     // Fungsi untuk memeriksa apakah ada file index.html di dalam folder
//     const checkForIndexHtml = async (dir) => {
//       const folderPath = path.join(directoryPath, dir)
//       try {
//         const subFiles = await fs.promises.readdir(folderPath)
//         const hasIndexHtml = subFiles.includes("index.html")
//         return hasIndexHtml ? `<li><a href="/${dir}" target="_blank">${dir}</a></li>` : `<li><a href="/winiapp/${dir}">${dir}</a></li>`
//       } catch (err) {
//         console.error(`Gagal membaca isi folder ${dir}:`, err)
//         throw err
//       }
//     }

//     // Proses semua folder dan ambil linknya
//     const folderLinks = await Promise.all(directories.map((dir) => checkForIndexHtml(dir)))

//     // Menambahkan link untuk Information Board setelah semua folder diproses
//     folderLinks.push('<li><a href="/WINI-INFORMATION" target="_blank">WINI Information</a></li>')
//     // folderLinks.push('<li><a href="/PE_stuff" target="_blank">PE Tools</a></li>')

//     // Kirimkan HTML dengan daftar folder yang sudah terurut
//     res.send(`
//             <html>
//             <head>
//                 <title>Welcome to WINI DX Information</title>
//                 <link rel="stylesheet" type="text/css" href="/css/style.css">
//             </head>
//             <body>
//                 <div class="fixed-header">
//                     <h1>Wintec Indonesia DX Information Center</h1>
//                 </div>
//                 <ul>
//                     ${folderLinks.join("")}
//                 </ul>
//             </body>
//             </html>
//         `)

//     //console.log('Folder links yang telah diproses:', folderLinks.join(''));
//   } catch (err) {
//     console.error("Terjadi kesalahan saat memproses folder:", err)
//     res.status(500).send("Terjadi kesalahan saat memproses folder")
//   }
// })

// // Rute untuk menampilkan folder tertentu
// app.get("/winiapp/:folderName", (req, res) => {
//   const folderName = req.params.folderName
//   const folderPath = path.join(__dirname, "winisys/zztatic", folderName)

//   // Pastikan folder ada
//   fs.readdir(folderPath, { withFileTypes: true }, (err, files) => {
//     if (err) {
//       return res.status(404).send("Folder tidak ditemukan")
//     }

//     // Menampilkan daftar isi folder dengan link ke file
//     let folderContent = files
//       .map((file) => {
//         if (file.isDirectory()) {
//           // Jika folder, tampilkan sebagai link
//           return `<li><a href="/winiapp/${folderName}/${file.name}">${file.name}</a></li>`
//         } else {
//           // Jika file, tampilkan sebagai link unduhan
//           const fileUrl = `/files/${folderName}/${file.name}`
//           return `<li><a href="${fileUrl}" target="_blank">${file.name}</a></li>`
//         }
//       })
//       .join("")

//     res.send(`
//             <html>
//             <head>
//                 <title>Isi Folder: ${folderName}</title>
//                 <link rel="stylesheet" type="text/css" href="/css/style.css">
//             </head>
//             <body>
//                 <!-- Header yang tetap di atas -->
//                 <div class="fixed-header">
//                     <h1>${folderName}</h1>
//                     <a href="/">Kembali ke Daftar Folder</a>
//                 </div>
//                 <!-- Daftar isi folder -->
//                 <ul>
//                     ${folderContent}
//                 </ul>
//             </body>
//             </html>
//         `)
//   })
// })

// Integrasi aplikasi 'Information Board' di bawah rute '/information-board'
app.use("/WINI-INFORMATION", informationWINIApp)
app.use("/cari", informationCari)

app.use("/", mainRoute)
app.use("/PE/whiteboard2", todoApp)
app.use("/PE/whiteboard2", obeyaApp)
app.use("/QDB_Last", qdbApp)
app.use("/QDB_Last", qdbApp2)
app.use("/", searchRoute)
app.use("/kanbanku", kanbankuRouter)
app.use("/scanku", checksheet)
app.use("/baraApp", baraAppRoute)
app.use("/uploadPdf", uploadfile)


app.use("/PE_Trello", trelloApp)
// Menjalankan server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`)
})
