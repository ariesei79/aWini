const express = require("express")
const fs = require("fs")
const path = require("path")
const router = express.Router()

const SOURCES = [
  { root: path.join("Q:/"), label: "Q" },
  { root: path.join("L:/"), label: "L" },
]

// router.get("/", (req, res) => {
//   res.send("cari OK")
// })

router.get("/search", (req, res) => {
  const query = req.query.query?.toLowerCase()
  if (!query) return res.json([])

  const results = []

  function searchDir(currentPath, rootPath, label) {
    const items = fs.readdirSync(currentPath)
    items.forEach((item) => {
      const itemPath = path.join(currentPath, item)
      const stat = fs.statSync(itemPath)
      if (stat.isDirectory()) {
        searchDir(itemPath, rootPath, label) // rekursi
      } else if (item.toLowerCase().includes(query)) {
        const relativePath = path.relative(rootPath, itemPath).replace(/\\/g, "/")
        results.push({
          label,
          path: `/files/${relativePath}`,
        })
      }
    })
  }

  try {
    for (const source of SOURCES) {
      searchDir(source.root, source.root, source.label)
    }
    res.json(results)
  } catch (err) {
    console.error("Search error:", err)
    res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router
