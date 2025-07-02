const express = require("express")
const router = express.Router()
const db = require("./database")
const multer = require("multer");
const path = require("path");
const fs = require('fs')
const PROJECT_ROOT = path.join(__dirname, "..")
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public", "files")


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder); // folder tujuan
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname); // ambil ekstensi asli
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage: storage });
const uploadFolder = path.join(__dirname, "../public/files");


// Aktifkan foreign key
db.run("PRAGMA foreign_keys = ON")

// Buat tabel-tabel jika belum ada
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS section (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section TEXT NOT NULL UNIQUE
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS member (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL,
      member TEXT NOT NULL,
      FOREIGN KEY (section_id) REFERENCES section(id) ON DELETE CASCADE
    )
  `)
  
  db.run(`
    CREATE TABLE IF NOT EXISTS boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      position INTEGER,
      FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS taskBoard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      position INTEGER,
      color TEXT,
      filePath TEXT,
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS title (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    )
  `)
})

/* ------------------ SECTION ------------------ */

// Get all sections
router.get("/sections", (req, res) => {
  db.all("SELECT * FROM section ORDER BY section ASC", [], (err, sections) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(sections)
  })
})

// Create section
router.post("/sections", (req, res) => {
  const { section } = req.body
  if (!section) return res.status(400).json({ error: "Section name is required" })

  db.run("INSERT INTO section (section) VALUES (?)", [section], function (err) {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ id: this.lastID, section })
  })
})

// Update section name
router.put("/sections/:id", (req, res) => {
  const { section } = req.body
  if (!section) return res.status(400).json({ error: "Section name is required" })

  db.run(
    "UPDATE section SET section = ? WHERE id = ?",
    [section, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ updated: this.changes })
    }
  )
})

// Delete section (members cascade deleted)
router.delete("/sections/:id", (req, res) => {
  db.run("DELETE FROM section WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ deleted: this.changes })
  })
})

/* ------------------ MEMBER ------------------ */

// Get all members, optionally filter by section_id
router.get("/members", (req, res) => {
  const { section_id } = req.query
  let sql = "SELECT * FROM member"
  let params = []

  if (section_id) {
    sql += " WHERE section_id = ?"
    params.push(section_id)
  }

  sql += " ORDER BY id ASC"

  db.all(sql, params, (err, members) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(members)
  })
})

// Create member
router.post("/members", (req, res) => {
  const { section_id, member } = req.body
  if (!section_id || !member) return res.status(400).json({ error: "section_id and member name are required" })

  db.run(
    "INSERT INTO member (section_id, member) VALUES (?, ?)",
    [section_id, member],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ id: this.lastID, section_id, member })
    }
  )
})

// Update member (section_id and/or member name)
router.put("/members/:id", (req, res) => {
  const { section_id, member } = req.body

  db.run(
    `UPDATE member 
     SET section_id = COALESCE(?, section_id), 
         member = COALESCE(?, member) 
     WHERE id = ?`,
    [section_id, member, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ updated: this.changes })
    }
  )
})

// Delete member (boards cascade deleted)
router.delete("/members/:id", (req, res) => {
  db.run("DELETE FROM member WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ deleted: this.changes })
  })
})

/* ------------------ BOARDS ------------------ */

// Get all boards
router.get("/boards", (req, res) => {
  db.all("SELECT * FROM boards", [], (err, boards) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(boards)
  })
})

router.get("/boards/member/:memberId", (req, res) => {
  db.all(
    "SELECT * FROM boards WHERE member_id = ?",
    [req.params.memberId],
    (err, boards) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json(boards)
    }
  )
})


// Create board (tambahkan member_id)
router.post("/boards", (req, res) => {
  const { member_id, name, position } = req.body
  if (!member_id || !name) return res.status(400).json({ error: "member_id and name are required" })

  db.run(
    "INSERT INTO boards (member_id, name, position) VALUES (?, ?, ?)",
    [member_id, name, position],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ id: this.lastID, member_id, name, position })
    }
  )
})

// Update board (member_id optional)
router.put("/boards/:id", (req, res) => {
  const { member_id, name, position } = req.body
  db.run(
    `UPDATE boards 
     SET member_id = COALESCE(?, member_id),
         name = COALESCE(?, name), 
         position = COALESCE(?, position) 
     WHERE id = ?`,
    [member_id, name, position, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ updated: this.changes })
    }
  )
})

// Delete board
router.delete("/boards/:id", (req, res) => {
  db.run("DELETE FROM boards WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ deleted: this.changes })
  })
})

/* ------------------ TASKS ------------------ */

// Get tasks by board id
router.get("/tasks/:boardId", (req, res) => {
  db.all(
    `SELECT * FROM taskBoard
     WHERE board_id = ?
     ORDER BY 
       completed ASC,
       position ASC`,
    [req.params.boardId],
    (err, tasks) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json(tasks)
    }
  )
});


// Create task
router.post("/tasks", (req, res) => {
  const { board_id, content, position } = req.body
  db.run(
    "INSERT INTO taskBoard (board_id, content, position) VALUES (?, ?, ?)",
    [board_id, content, position],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ id: this.lastID, board_id, content, position })
    }
  )
})

// Update task (content, board_id, position)
router.put("/tasks/:id", (req, res) => {
  const { content, board_id, position, completed, color, filePath } = req.body
  db.run(
    `UPDATE taskBoard 
     SET content = COALESCE(?, content), 
         board_id = COALESCE(?, board_id), 
         position = COALESCE(?, position),
         completed = COALESCE(?, completed),
         color = COALESCE(?, color),
         filePath = COALESCE(?, filePath)
     WHERE id = ?`,
    [content, board_id, position, completed, color, filePath, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ updated: this.changes })
    }
  )
})



// Delete task
// router.delete("/tasks/:id", (req, res) => {
//   db.run("DELETE FROM taskBoard WHERE id = ?", [req.params.id], function (err) {
//     if (err) return res.status(500).json({ error: err.message })
//     res.json({ deleted: this.changes })
//   })
// })
router.delete("/tasks/:id", (req, res) => {
  const taskId = req.params.id;

  // Ambil data task untuk cek filePath
  db.get("SELECT * FROM taskBoard WHERE id = ?", [taskId], (err, task) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Jika task punya file, hapus dulu
    if (task.filePath) {
      const oldFilePath = path.basename(task.filePath); // Ambil nama file saja
      const fullPath = path.join(PUBLIC_DIR, oldFilePath);

      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
          console.log("✅ File berhasil dihapus:", fullPath);
        } catch (unlinkErr) {
          console.error("❌ Gagal menghapus file:", unlinkErr);
          // Tetap lanjutkan hapus task meskipun file gagal dihapus
        }
      }
    }

    // Setelah file lama dihapus (jika ada), baru hapus task dari database
    db.run("DELETE FROM taskBoard WHERE id = ?", [taskId], function (deleteErr) {
      if (deleteErr) {
        return res.status(500).json({ error: deleteErr.message });
      }

      res.json({ deleted: this.changes });
    });
  });
});
/* ------------------ TITLE ------------------ */

// Get title
router.get("/title", (req, res) => {
  db.get("SELECT name FROM title WHERE id = 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ title: row ? row.name : "PE Activity Plan Status" })
  })
})

// Set title
router.post("/title", (req, res) => {
  const { title } = req.body
  if (!title) return res.status(400).json({ error: "Title is required" })

  db.run(
    "INSERT OR REPLACE INTO title (id, name) VALUES (1, ?)",
    [title],
    function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ title })
    }
  )
})

// Pindahkan task ke board dan posisi baru
router.put("/tasks/:id/move", (req, res) => {
  const { board_id, position } = req.body;

  if (typeof board_id === "undefined" || typeof position === "undefined") {
    return res.status(400).json({ error: "board_id and position are required" });
  }

  db.run(
    `UPDATE taskBoard 
     SET board_id = ?, position = ?
     WHERE id = ?`,
    [board_id, position, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});


// Endpoint upload file untuk task tertentu
router.post("/tasks/:id/upload", upload.single("file"), (req, res) => {
  const taskId = req.params.id;
  const file = req.file;

  if (!file) return res.status(400).json({ error: "No file uploaded" });

  // Hapus file lama jika ada
  db.get("SELECT filePath FROM taskBoard WHERE id = ?", [taskId], (err, task) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (task && task.filePath) {
      const oldFilePath = path.basename(task.filePath); // Ambil hanya nama file saja
      const fullPath = path.join(PUBLIC_DIR, oldFilePath);

      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
          console.log("✅ File lama berhasil dihapus:", fullPath);
        } catch (unlinkErr) {
          console.error("❌ Gagal menghapus file lama:", unlinkErr);
        }
      }
    }

    // Setelah hapus file lama, simpan file baru
    const newFilePath = `/public/files/${file.filename}`;

    db.run(
      "UPDATE taskBoard SET filePath = ? WHERE id = ?",
      [newFilePath, taskId],
      function (updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: updateErr.message });
        }

        res.json({ filePath: newFilePath });
      }
    );
  });
});

// Hapus file
router.delete("/tasks/:taskId/remove-file", (req, res) => {
  const { taskId } = req.params

  db.get("SELECT * FROM taskBoard WHERE id = ?", [taskId], (err, task) => {
    if (err || !task) {
      return res.status(404).json({ error: "Task not found" })
    }

    if (!task.filePath) {
      return res.status(400).json({ error: "No file attached" })
    }

    // ✅ Susun path file dengan benar
    const filePath = path.join(PROJECT_ROOT, task.filePath)
    console.log("Trying to delete file at:", filePath) // 🔍 Debug path

    // 🧪 Cek apakah file benar-benar ada
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath) // ❌ Hapus file dari sistem
      } catch (unlinkErr) {
        console.error("Error deleting file:", unlinkErr)
        return res.status(500).json({ error: "Failed to delete file from server" })
      }
    }

    // ✅ Kosongkan filePath di database
    db.run("UPDATE taskBoard SET filePath = NULL WHERE id = ?", [taskId], function (updateErr) {
      if (updateErr) {
        console.error("Database update error:", updateErr)
        return res.status(500).json({ error: "Failed to update task in database" })
      }

      res.json({ success: true, message: "File removed successfully" })
    })
  })
})

module.exports = router
