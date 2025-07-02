const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const router = express.Router()
let db = require("./database")

// let db = new sqlite3.Database("./PE_data.db", (err) => {
//   if (err) {
//     console.error(err.message)
//   }
//   console.log("Connected to the PE.db database.")
// })

router.get("/todos", (req, res) => {
  const sql = "SELECT * FROM tasks"
  db.all(sql, [], (err, rows) => {
    if (err) {
      throw err
    }
    res.json(rows)
  })
})

// router.get("/todos", (req, res) => {
//   res.send("todos OK")
// })

router.post("/todos", (req, res) => {
  const { task, completed } = req.body
  const sql = "INSERT INTO tasks (task, completed) VALUES (?, ?)"
  db.run(sql, [task, completed], function (err) {
    if (err) {
      return console.error(err.message)
    }
    res.json({ id: this.lastID })
  })
})

router.put("/todos/:id", (req, res) => {
  const { id } = req.params
  const { task, completed } = req.body
  const sql = "UPDATE tasks SET task = ?, completed = ? WHERE id = ?"
  db.run(sql, [task, completed, id], function (err) {
    if (err) {
      return console.error(err.message)
    }
    res.json({ changes: this.changes })
  })
})

router.delete("/todos/:id", (req, res) => {
  const { id } = req.params
  const sql = "DELETE FROM tasks WHERE id = ?"
  db.run(sql, id, function (err) {
    if (err) {
      return console.error(err.message)
    }
    res.json({ changes: this.changes })
  })
})

module.exports = router
