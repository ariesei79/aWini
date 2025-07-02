const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const sqlite3 = require("sqlite3").verbose()
const app = express()

// Setup untuk parsing JSON
app.use(express.json())

// Membuat atau membuka database SQLite
const db = new sqlite3.Database("./todo.db", (err) => {
  if (err) {
    console.error("Gagal membuka database:", err.message)
  } else {
    console.log("Database berhasil dibuka.")
  }
})

// Membuat tabel "tasks" jika belum ada
db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT 0
    )
`)

// Endpoint untuk mendapatkan semua tugas
app.get("/tasks", (req, res) => {
  db.all("SELECT * FROM tasks", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.json({ tasks: rows })
  })
})

// Endpoint untuk menambah tugas baru
app.post("/tasks", (req, res) => {
  const { task } = req.body
  if (!task) {
    return res.status(400).json({ message: "Tugas tidak boleh kosong" })
  }

  const stmt = db.prepare("INSERT INTO tasks (task) VALUES (?)")
  stmt.run(task, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    res.status(201).json({ id: this.lastID, task })
  })
})

// Endpoint untuk menghapus tugas berdasarkan ID
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params
  db.run("DELETE FROM tasks WHERE id = ?", id, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    res.json({ message: "Tugas dihapus" })
  })
})

// Endpoint untuk mengedit tugas berdasarkan ID
app.put("/tasks/:id", (req, res) => {
  const { id } = req.params
  const { task } = req.body

  if (!task) {
    return res.status(400).json({ message: "Tugas tidak boleh kosong" })
  }

  db.run("UPDATE tasks SET task = ? WHERE id = ?", [task, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Tugas tidak ditemukan" })
    }
    res.json({ message: "Tugas diperbarui" })
  })
})
// Menggunakan port dari environment variable atau default ke 3000
const PORT = process.env.PORT || 3000

// Melayani file statis dari folder files
app.use(express.static(path.join(__dirname, "77")))

// Endpoint untuk menampilkan semua file dalam folder files
app.get("/files", (req, res) => {
  const page = req.params.page
  const filePath = path.join(__dirname, "files", page)

  // Membaca isi direktori files
  fs.readdir(filesDir, (err, files) => {
    if (err) {
      res.status(500).send("Error reading files directory")
      return
    }
    // Konfigurasi multer untuk menyimpan file di folder "foto"
    const upload = multer({
      dest: path.join(__dirname, "files", "foto"), // Folder tujuan
      limits: { fileSize: 5 * 1024 * 1024 }, // Maksimum ukuran file 5MB
    })

    // Endpoint untuk mengunggah file
    app.post("/upload", upload.single("file"), (req, res) => {
      if (!req.file) {
        return res.status(400).send("No file uploaded.")
      }

      const tempPath = req.file.path
      const targetPath = path.join(__dirname, "files", "foto", req.file.originalname)

      // Pindahkan file ke lokasi tujuan dengan nama asli
      fs.rename(tempPath, targetPath, (err) => {
        if (err) {
          return res.status(500).send("Error while saving file.")
        }

        res.send(`
        <h1>File Uploaded Successfully</h1>
        <p><a href="/uploader.html">Upload Another File</a></p>
      `)
      })
    })
    // Membuat daftar file sebagai HTML
    const fileListHTML = files.map((file) => `<li><a href="/${file}" target="_blank">${file}</a></li>`).join("")
  })
})

// Menjalankan server di port yang ditentukan
// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });
