const express = require("express")
const fs = require("fs")
const path = require("path")
const router = express.Router()

// Route to display directory contents
router.get("/", async (req, res) => {
  // const directoryPath = path.join(__dirname, "../winisys/zztatic")
  const adress = "//172.17.44.106//aWINI"
  const directoryPath = path.join(adress, "winisys/zztatic")

  try {
    const files = await fs.promises.readdir(directoryPath, { withFileTypes: true })
    const directories = files
      .filter((file) => file.isDirectory())
      .map((file) => file.name)
      .sort()

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

    const folderLinks = await Promise.all(directories.map((dir) => checkForIndexHtml(dir)))
    folderLinks.push('<li><a href="/WINI-INFORMATION" target="_blank">WINI Information</a></li>')
    folderLinks.push('<li><a href="/cari" target="_blank">Cari File</a></li>')

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
  } catch (err) {
    console.error("Terjadi kesalahan saat memproses folder:", err)
    res.status(500).send("Terjadi kesalahan saat memproses folder")
  }
})

// Route to display specific folder contents
router.get("/winiapp/:folderName", (req, res) => {
  const folderName = req.params.folderName
  const adress = "//172.17.44.106//aWINI"
  // const folderPath = path.join(__dirname, "../winisys/zztatic", folderName)

  const folderPath = path.join(adress, "winisys/zztatic", folderName)

  fs.readdir(folderPath, { withFileTypes: true }, (err, files) => {
    if (err) {
      return res.status(404).send("Folder tidak ditemukan")
    }

    let folderContent = files
      .map((file) => {
        if (file.isDirectory()) {
          return `<li><a href="/winiapp/${folderName}/${file.name}">${file.name}</a></li>`
        } else {
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
        <div class="fixed-header">
          <h1>${folderName}</h1>
          <a href="/">Kembali ke Daftar Folder</a>
        </div>
        <ul>
          ${folderContent}
        </ul>
      </body>
      </html>
    `)
  })
})

module.exports = router
