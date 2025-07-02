const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

// Setup SQLite3 Database
const db = new sqlite3.Database('./kanban.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Database connected!');
  }
});

// Create table if not exists
db.run(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  description TEXT,
  status TEXT
)`);

// Middleware untuk file statis
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Endpoint untuk mendapatkan data task
app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ tasks: rows });
  });
});

// Endpoint untuk menambahkan task
app.post('/api/tasks', (req, res) => {
  const { title, description, status } = req.body;
  const sql = 'INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)';
  db.run(sql, [title, description, status], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, title, description, status });
  });
});

// Endpoint untuk mengupdate status task
app.put('/api/tasks/:id', (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const sql = 'UPDATE tasks SET status = ? WHERE id = ?';
  db.run(sql, [status, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Task updated successfully' });
  });
});

// Endpoint untuk mengupdate task (edit title dan description)
app.put('/api/tasks/edit/:id', (req, res) => {
  const { title, description } = req.body;
  const { id } = req.params;
  const sql = 'UPDATE tasks SET title = ?, description = ? WHERE id = ?';
  db.run(sql, [title, description, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Task updated successfully' });
  });
});

// Endpoint untuk menghapus task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM tasks WHERE id = ?';
  db.run(sql, [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Task deleted successfully' });
  });
});

// Jalankan server
app.listen(port, () => {
  console.log(`Kanban app listening at http://localhost:${port}`);
});
