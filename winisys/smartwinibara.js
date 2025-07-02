const express = require("express")
const fs = require("fs")
const path = require("path")
const app = express()
const port = 80
const bodyParser = require("body-parser")
//tambahan barakids
const searchRoute = require('./routes/search');

//tambahan dari arie
const sqlite3 = require("sqlite3").verbose()
let db = new sqlite3.Database("./todo.db", (err) => {
  if (err) {
    console.error(err.message)
  }
  console.log("Connected to the todo.db database.")
})

// Menggunakan aplikasi Express dari wini-information (server.js)
const informationWINIApp = require(path.join(__dirname, "winisys", "WINI-INFORMATION", "server.js"))
const dirnoRouter = require(path.join(__dirname, "winisys", "PE_stuff", "dirno.js"))
const qdbRouter = require(path.join(__dirname, "winisys", "qdb", "qdb.js"));
const kanbanRouter = require(path.join(__dirname, "winisys", "kanbanboard", "router"));
const kanbankuapp = require(path.join(__dirname, "winisys", "kanbanku", "server.js"))
const PasslineApp = require(path.join(__dirname, "winisys", "passline", "server.js"))


// Middleware untuk melayani file statis (non express)
app.use(express.static(path.join(__dirname, "winisys/zztatic")))
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use("/PE_stuff", dirnoRouter);
app.use("/qdb", qdbRouter);


// Middleware untuk melayani file statis (CSS)
app.use(express.static(path.join(__dirname, "public")))
app.use("/kanbanboard", express.static(path.join(__dirname, "winisys", "kanbanboard", "public")));
//Tambahan barakids
app.use("/cari",express.static(path.join(__dirname, 'winisys', 'cari', 'public')));
app.use("/passline",express.static(path.join(__dirname, 'winisys', 'passline', 'public')));
// Tamabahan dari barakids (Static untuk file hasil pencarian)
app.use('/files', express.static('Q:/')); // sesuaikan direktori file asli
app.use('/files', express.static('L:/')); // sesuaikan direktori file asli
// tambahan dari barakids API route
app.use('/', searchRoute);


app.get("/", async (req, res) => {
  const directoryPath = path.join(__dirname, "winisys/zztatic") // folder yang ingin Anda tampilkan

  try {
    // Membaca daftar folder di direktori
    const files = await fs.promises.readdir(directoryPath, { withFileTypes: true })

    // Menyaring hanya folder
    const directories = files
      .filter((file) => file.isDirectory())
      .map((file) => file.name)
      .sort()
    //console.log('Folder yang ditemukan:', directories);

    // Fungsi untuk memeriksa apakah ada file index.html di dalam folder
    const checkForIndexHtml = async (dir) => {
      const folderPath = path.join(directoryPath, dir)
      try {
        const subFiles = await fs.promises.readdir(folderPath)
        const hasIndexHtml = subFiles.includes("index.html")
        return hasIndexHtml ? `<li><a href="/${dir}" target="_blank">${dir}</a></li>` : `<li><a href="/winiapp/${dir}">${dir}</a></li>`
      } catch (err) {
        console.error(`Gagal membaca isi folder ${dir}:`, err)
        throw err
      }
    }

    // Proses semua folder dan ambil linknya
    const folderLinks = await Promise.all(directories.map((dir) => checkForIndexHtml(dir)))

    // Menambahkan link untuk Information Board setelah semua folder diproses
    folderLinks.push('<li><a href="/WINI-INFORMATION" target="_blank">WINI Information</a></li>')
    folderLinks.push('<li><a href="/PE_stuff" target="_blank">PE Tools</a></li>')
    folderLinks.push('<li><a href="/qdb" target="_blank">QDB</a></li>')
    folderLinks.push('<li><a href="/cari" target="_blank">CAri File</a></li>')
    folderLinks.push('<li><a href="/kanbanku" target="_blank">Kanban Board</a></li>')
    folderLinks.push('<li><a href="/passline" target="_blank">Passline check</a></li>')
    // Kirimkan HTML dengan daftar folder yang sudah terurut
    res.send(`
            <html>
            <head>
                <title>Welcome to WINI DX Information</title>
                <link rel="stylesheet" type="text/css" href="/css/style.css">
            </head>
            <body>
                <div class="fixed-header">
                    <h1>Wintec Indonesia DX Information Center</h1>
                </div>
                <ul>
                    ${folderLinks.join("")}
                </ul>
            </body>
            </html>
        `)

    //console.log('Folder links yang telah diproses:', folderLinks.join(''));
  } catch (err) {
    console.error("Terjadi kesalahan saat memproses folder:", err)
    res.status(500).send("Terjadi kesalahan saat memproses folder")
  }
})

// Rute untuk menampilkan folder tertentu
app.get("/winiapp/:folderName", (req, res) => {
  const folderName = req.params.folderName
  const folderPath = path.join(__dirname, "winisys/zztatic", folderName)

  // Pastikan folder ada
  fs.readdir(folderPath, { withFileTypes: true }, (err, files) => {
    if (err) {
      return res.status(404).send("Folder tidak ditemukan")
    }

    // Menampilkan daftar isi folder dengan link ke file
    let folderContent = files
      .map((file) => {
        if (file.isDirectory()) {
          // Jika folder, tampilkan sebagai link
          return `<li><a href="/winiapp/${folderName}/${file.name}">${file.name}</a></li>`
        } else {
          // Jika file, tampilkan sebagai link unduhan
          const fileUrl = `/files/${folderName}/${file.name}`
          return `<li><a href="${fileUrl}" target="_blank">${file.name}</a></li>`
        }
      })
      .join("")

    res.send(`
            <html>
            <head>
                <title>Isi Folder: ${folderName}</title>
                <link rel="stylesheet" type="text/css" href="/css/style.css">
            </head>
            <body>
                <!-- Header yang tetap di atas -->
                <div class="fixed-header">
                    <h1>${folderName}</h1>
                    <a href="/">Kembali ke Daftar Folder</a>
                </div>
                <!-- Daftar isi folder -->
                <ul>
                    ${folderContent}
                </ul>
            </body>
            </html>
        `)
  })
})

// Rute untuk melayani file dalam folder
// app.get('/files/:folderName/:fileName', (req, res) => {
//     const folderName = req.params.folderName;
//     const fileName = req.params.fileName;
//     const filePath = path.join(__dirname, 'winisys/zztatic', folderName, fileName);

//     // Mengirim file jika ada
//     res.sendFile(filePath, (err) => {
//         if (err) {
//             res.status(404).send('File tidak ditemukan');
//         }
//     });
// });

app.get("/files/:folderName/:fileName", (req, res, next) => {
  const folderName = req.params.folderName
  const fileName = req.params.fileName
  const filePath = path.join(__dirname, "winisys/zztatic", folderName, fileName)

  // Mengirim file jika ada
  res.sendFile(filePath, (err) => {
    if (err) {
      // Menjalankan rute alternatif jika terjadi kesalahan
      next()
    }
  })
})

app.get("/files/:folderName/foldername/:fileName", (req, res) => {
  const folderName = req.params.folderName
  const fileName = req.params.fileName
  const filePath = path.join(__dirname, "winisys/zztatic", folderName, "foldername", fileName)

  // Mengirim file jika ada
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send("File tidak ditemukan")
    }
  })
})

// Integrasi aplikasi 'Information Board' di bawah rute '/information-board'
app.use("/WINI-INFORMATION", informationWINIApp)
app.use("/passline", PasslineApp)
app.use("/kanbanku",kanbankuapp)
//app.use("/PE_stuff", dirnoRouter)
// Menjalankan server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`)
})
