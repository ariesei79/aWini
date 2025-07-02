const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Path ke database
const dbPath = path.join(__dirname, '../winisys/zztatic/kanbanku/kanbanku.db');
const db = new sqlite3.Database(dbPath);

// Inisialisasi tabel jika belum ada
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    initial TEXT UNIQUE,
    name TEXT,
    avatar_url TEXT,
    note_theme TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    user_initial TEXT,
    column_name TEXT,
    FOREIGN KEY (user_initial) REFERENCES users(initial)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER,
    content TEXT,
    completed INTEGER DEFAULT 0,
    FOREIGN KEY (note_id) REFERENCES notes(id)
  )`);
});

//
// ========= ROUTES =========
//

// GET semua note dan subtask
router.get('/notes', (req, res) => {
  db.all(`SELECT * FROM notes`, (err, notes) => {
    if (err) return res.status(500).send(err.message);
    db.all(`SELECT * FROM subtasks`, (err2, subtasks) => {
      if (err2) return res.status(500).send(err2.message);
      res.json({ notes, subtasks });
    });
  });
});

// POST tambah note
router.post('/notes', (req, res) => {
  const { title, user_initial, column_name } = req.body;
  db.run(`INSERT INTO notes (title, user_initial, column_name) VALUES (?, ?, ?)`,
    [title, user_initial, column_name],
    function (err) {
      if (err) return res.status(500).send(err.message);
      res.json({ id: this.lastID });
    });
});

// PUT update kolom note
router.put('/notes/:id', (req, res) => {
  const { column_name } = req.body;
  db.run(`UPDATE notes SET column_name = ? WHERE id = ?`,
    [column_name, req.params.id],
    function (err) {
      if (err) return res.status(500).send(err.message);
      res.sendStatus(200);
    });
});

// DELETE note dan subtask terkait
router.delete('/notes/:id', (req, res) => {
  const noteId = req.params.id;
  db.run(`DELETE FROM notes WHERE id = ?`, [noteId], function (err) {
    if (err) return res.status(500).send(err.message);
    db.run(`DELETE FROM subtasks WHERE note_id = ?`, [noteId]);
    res.sendStatus(200);
  });
});

//
// ===== SUBTASKS =====
//

// POST tambah subtask
router.post('/subtask', (req, res) => {
  const { note_id, content } = req.body;
  db.run(`INSERT INTO subtasks (note_id, content) VALUES (?, ?)`,
    [note_id, content],
    function (err) {
      if (err) return res.status(500).send(err.message);
      res.json({ id: this.lastID });
    });
});

// PUT update isi subtask
router.put('/subtask/:id', (req, res) => {
  const { content } = req.body;
  db.run(`UPDATE subtasks SET content = ? WHERE id = ?`,
    [content, req.params.id],
    function (err) {
      if (err) return res.status(500).send(err.message);
      res.sendStatus(200);
    });
});

// PUT toggle checkbox subtask
router.put('/subtask/check/:id', (req, res) => {
  const { completed } = req.body;
  db.run(`UPDATE subtasks SET completed = ? WHERE id = ?`,
    [completed ? 1 : 0, req.params.id],
    function (err) {
      if (err) return res.status(500).send(err.message);
      res.sendStatus(200);
    });
});

// DELETE subtask
router.delete('/subtask/:id', (req, res) => {
  db.run(`DELETE FROM subtasks WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).send(err.message);
    res.sendStatus(200);
  });
});

//
// ===== USERS =====
//

// POST tambah/update user
router.post('/users', (req, res) => {
  const { initial, name, avatar_url, note_theme } = req.body;
  db.run(`
    INSERT INTO users (initial, name, avatar_url, note_theme)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(initial) DO UPDATE SET
      name = excluded.name,
      avatar_url = excluded.avatar_url,
      note_theme = excluded.note_theme
  `, [initial, name, avatar_url, note_theme], function (err) {
    if (err) return res.status(500).send(err.message);
    res.sendStatus(200);
  });
});

// GET semua user
router.get('/users', (req, res) => {
  db.all(`SELECT * FROM users`, (err, users) => {
    if (err) return res.status(500).send(err.message);
    res.json(users);
  });
});

//
// ===== AVATAR FILE LIST =====
//

// GET list file avatar dari folder avatar/
router.get('/avatars', (req, res) => {
  const avatarDir = path.join(__dirname, '../winisys/zztatic/kanbanku/avatar');
  fs.readdir(avatarDir, (err, files) => {
    if (err) return res.status(500).send(err.message);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    res.json(imageFiles);
  });
});
router.post('/users', (req, res) => {
  const { name, initial, avatar_url, note_theme } = req.body;

  db.get(`SELECT * FROM users WHERE initial = ?`, [initial], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row) {
      // UPDATE user
      db.run(`UPDATE users SET name = ?, avatar_url = ?, note_theme = ? WHERE initial = ?`,
        [name, avatar_url, note_theme, initial],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'User updated' });
        });
    } else {
      // INSERT user
      db.run(`INSERT INTO users (name, initial, avatar_url, note_theme) VALUES (?, ?, ?, ?)`,
        [name, initial, avatar_url, note_theme],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'User added' });
        });
    }
  });
});
router.delete('/users/:initial', (req, res) => {
  const initial = req.params.initial;

  db.serialize(() => {
    // 1. Ambil semua note id milik user
    db.all(`SELECT id FROM notes WHERE user_initial = ?`, [initial], (err, notes) => {
      if (err) return res.status(500).json({ error: err.message });

      const noteIds = notes.map(n => n.id);
      const placeholders = noteIds.map(() => '?').join(',');

      // 2. Hapus semua subtask dari note2 itu
      if (noteIds.length > 0) {
        db.run(`DELETE FROM subtasks WHERE note_id IN (${placeholders})`, noteIds, function (err) {
          if (err) return res.status(500).json({ error: err.message });

          // 3. Hapus semua note milik user
          db.run(`DELETE FROM notes WHERE user_initial = ?`, [initial], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // 4. Hapus user-nya
            db.run(`DELETE FROM users WHERE initial = ?`, [initial], function (err) {
              if (err) return res.status(500).json({ error: err.message });

              res.json({ message: 'User and related notes deleted' });
            });
          });
        });
      } else {
        // Tidak ada note, langsung hapus user
        db.run(`DELETE FROM users WHERE initial = ?`, [initial], function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'User deleted (no notes)' });
        });
      }
    });
  });
});

router.get('/users', (req, res) => {
  db.all(`SELECT * FROM users`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
