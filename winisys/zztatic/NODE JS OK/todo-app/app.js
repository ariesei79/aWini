const express = require('express');
const db = require('./database');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Endpoint untuk mendapatkan semua tugas
app.get('/todos', (req, res) => {
    db.all('SELECT * FROM todos', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Endpoint untuk menambah tugas
app.post('/todos', (req, res) => {
    const { task } = req.body;
    db.run('INSERT INTO todos (task) VALUES (?)', [task], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, task });
    });
});

// Endpoint untuk mengupdate tugas
app.put('/todos/:id', (req, res) => {
    const { id } = req.params;
    const { task } = req.body;
    db.run('UPDATE todos SET task = ? WHERE id = ?', [task, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id, task });
    });
});

// Endpoint untuk menghapus tugas
app.delete('/todos/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM todos WHERE id = ?', id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ deletedID: id });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});