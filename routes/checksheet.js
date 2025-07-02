const express = require("express")
const sql = require("mssql")
const router = express.Router()
const mqtt = require('mqtt');

// SQL Server configuration
const config = {
  user: "oee", // Replace with your username
  password: "oee", // Replace with your password
  server: "172.17.44.106", // IP address of the SQL Server
  database: "GRWINI", // Replace with your database name
  options: {
    encrypt: false, // Use this if you're on Windows Azure
    trustServerCertificate: true, // Change to false if you have a valid certificate
    enableArithAbort: true,
  },
}

router.post("/get-checksheet", async (req, res) => {
    const { mesin, date } = req.body;
    let pool;
  
    if (!mesin || !date) {
      return res.status(400).send("Parameter 'mesin' dan 'tanggal' wajib diisi.");
    }
  
    try {
      pool = await sql.connect(config);
  
      const result = await pool
        .request()
        .input("mesin", sql.VarChar, mesin)
        .input("date", sql.Date, date)
        .query(`
          SELECT * FROM dbo.CheckSheetData
          WHERE mesin = @mesin AND tanggal = @date
        `);
  
      res.json(result.recordset);
    } catch (err) {
      console.error("SQL error", err);
      res.status(500).send("Error retrieving data");
    } finally {
      if (pool) {
        await pool.close();
        console.log("Database connection closed.");
      }
    }
  });
   
  

router.post("/submit-checksheet", async (req, res) => {
    const { identitas, checks } = req.body;
    let pool;
  
    try {
      pool = await sql.connect(config);
  
      for (const item of checks) {
        await pool.request()
          .input("lot", sql.VarChar, identitas.lot)
          .input("tanggal", sql.Date, identitas.date)
        //   .input("jam", sql.Time, new Date(`1970-01-01T${identitas.time}`))

        //   .input("jam", sql.Time, identitas.time)
          .input("shift", sql.VarChar, identitas.shift)
          .input("nama", sql.VarChar, identitas.nama)
          .input("mesin", sql.VarChar, identitas.mesin)
          .input("section", sql.VarChar, identitas.section)
          .input("area", sql.VarChar, identitas.area)
          .input("no", sql.Int, item.no)
          .input("checkItem", sql.VarChar, item.checkItem)
          .input("status", sql.VarChar, item.status)
          .input("note", sql.VarChar, item.note || "")
          .input("checked", sql.Bit, item.note || 0)
          .input("jenis_report", sql.VarChar, identitas.jenisReport || "CheckList")
          .query(`
            INSERT INTO dbo.ChecksheetData (
              lot, tanggal , shift, nama, mesin, section, area,
              no, checkItem, status, note, checked, jenis_report
            ) VALUES (
              @lot, @tanggal, @shift, @nama, @mesin, @section, @area,
              @no, @checkItem, @status, @note,  @checked, @jenis_report
            )
          `);
      }
  
      res.status(200).json({ message: "Data berhasil disimpan" });
    } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ message: "Gagal menyimpan ke database" });
    } finally {
      if (pool) {
        await pool.close();
      }
    }
  });
  

    

  
module.exports = router
