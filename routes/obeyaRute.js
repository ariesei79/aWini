const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const router = express.Router()
const db = require("./database")

// Create obeyas table if it doesn't exist
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS obeya (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, completed BOOLEAN)")
})

//Get all obeyas
router.get("/obeyas", (req, res) => {
  db.all("SELECT * FROM obeya", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.json(rows)
  })
})

// Add a new obeya
router.post("/obeyas", (req, res) => {
  const { item } = req.body
  const completed = false
  db.run("INSERT INTO obeya (item, completed) VALUES (?, ?)", [item, completed], function (err) {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.json({ id: this.lastID })
  })
})

// Delete a obeya
router.delete("/obeyas/:id", (req, res) => {
  const { id } = req.params
  const sql = "DELETE FROM obeya WHERE id = ?"
  db.run(sql, id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.json({ changes: this.changes })
  })
})

// Update obeya status (completed)
router.put("/obeyas/:id", (req, res) => {
  const { id } = req.params
  const { item, completed } = req.body
  db.run("UPDATE obeya SET item= ?, completed = ? WHERE id = ? ", [item, completed, id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.json({ changes: this.changes })
  })
})

// Delete all obeyas
router.delete("/obeyas", (req, res) => {
  db.run("DELETE FROM obeya", function (err) {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.json({ changes: this.changes })
  })
})

module.exports = router
