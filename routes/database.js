const sqlite3 = require("sqlite3").verbose()

// Membuat koneksi database
let db = new sqlite3.Database("./PE_data.db", (err) => {
  if (err) {
    console.error(err.message)
  }
  console.log("Connected to the PE.db database.")
})

// Ekspor objek db
module.exports = db
