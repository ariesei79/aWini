const express = require("express")
const path = require("path")
const fs = require("fs")
const router = express.Router()

const folders = [
  { path: "Q:\\Indication Slip", route: "indication-slip" },
  { path: "Q:\\IDS", route: "ids" },
  { path: "Q:\\Worksheet", route: "worksheet" },
]

function isImage(filename) {
  return /\.(jpg|jpeg|png|gif)$/i.test(filename)
}

router.get("/search", (req, res) => {
  const { year, month, mesin } = req.query

  if (!year || !month || !mesin) {
    return res.status(400).json({ error: "Parameter tidak lengkap" })
  }

  const mesinLower = mesin.toLowerCase()

  const result = folders.map(({ path: rootPath, route }) => {
    const targetPath = path.join(rootPath, year, month, mesinLower)
    let files = []

    try {
      if (fs.existsSync(targetPath)) {
        const foundFiles = fs.readdirSync(targetPath)
        files = foundFiles.map((file) => {
          const urlPath = `/files/${route}/${year}/${month}/${mesinLower}/${file}`
          return {
            name: file,
            openUrl: urlPath,
            downloadUrl: urlPath, // Sama saja, tinggal dipakai <a download>
            type: isImage(file) ? "image" : "other",
          }
        })
      }
    } catch (err) {
      console.error(`Gagal membaca folder ${targetPath}:`, err)
    }

    return {
      path: rootPath,
      files,
    }
  })

  res.json(result)
})

module.exports = router
