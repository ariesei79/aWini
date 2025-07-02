const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const router = express.Router();
const dbPath = path.join(__dirname, "../winisys/zztatic/baraApp/pcr.db");

const db = new sqlite3.Database(dbPath);
db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    container TEXT NOT NULL
)`);

// GET all tasks
router.get("/tasks", (req, res) => {
  db.all("SELECT * FROM tasks", (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

// ADD task
router.post("/tasks", (req, res) => {
  const { title, container } = req.body;
  db.run("INSERT INTO tasks (title, container) VALUES (?, ?)", [title, container], function (err) {
    if (err) return res.status(500).send(err.message);
    res.json({ id: this.lastID });
  });
});

// UPDATE task
router.put("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { title, container } = req.body;
  let query = "", params = [];

  if (title) {
    query = "UPDATE tasks SET title = ? WHERE id = ?";
    params = [title, id];
  } else if (container) {
    query = "UPDATE tasks SET container = ? WHERE id = ?";
    params = [container, id];
  }

  db.run(query, params, function (err) {
    if (err) return res.status(500).send(err.message);
    res.json({ success: true });
  });
});

// DELETE task
router.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM tasks WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).send(err.message);
    res.json({ success: true });
  });
});

module.exports = router;
