const express = require("express");
const sql = require("mssql");
const router = express.Router();
const { getLatestData } = require('./_checksheet1');

// Daftar check items
const checkItems = [
  "===> INLET HEATER <===", "LOWER(CENTER)",
   "LOWER HEATER",
  "LOWER 2(UPPER)", "UPPER ZONE", "-",
  "BEFORE CATALYST", "AFTER CATALYST", "UPPER HEATER", "LOWER BLOWOFF",
  "EXHAUST DUCT", "LOWER SLIT DUCT", "-",
  "IST ANNEAL INLET", "IST ANNEAL OUT", "2ND ANNEAL INLET", "2ND ANNEAL OUT",
  "PRESURE BOX", "CAPSTAN SPEED", "===> DRW.SPEED <==="
];
function stringToTimeObject(timeStr) {
    const [h, m, s] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, s || 0, 0);
    return date;
  }

  function parseTimeStringToDate(timeStr) {
    // timeStr = "HH:mm:ss"
    const [h, m, s] = timeStr.split(":").map(Number);
    const d = new Date(1970, 0, 1, h, m, s);
    return d;
  }
  

// Ambil data checksheet dari DB
router.post("/get-checksheet", async (req, res) => {
  const { mesin, date } = req.body;
  const pool = global.dbPool;

  if (!pool) {
    return res.status(500).json({ error: "Database not connected" });
  }

  if (!mesin || !date) {
    return res.status(400).send("Parameter 'mesin' dan 'tanggal' wajib diisi.");
  }

  try {
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
  }
});

// Submit manual checksheet
router.post("/submit-checksheet", async (req, res) => {
  const { identitas, checks } = req.body;
 

  const pool = global.dbPool;

  if (!pool) {
    return res.status(500).json({ error: "Database not connected" });
  }

  try {
    for (const item of checks) {
      try {
        await pool.request()
          .input("lot", sql.VarChar, identitas.lot)
          .input("tanggal", sql.Date, identitas.date)
          .input("jam", sql.Time, identitas.timex)
          .input("shift", sql.VarChar, identitas.shift)
          .input("nama", sql.VarChar, identitas.nama)
          .input("mesin", sql.VarChar, identitas.mesin)
          .input("section", sql.VarChar, identitas.section)
          .input("area", sql.VarChar, identitas.area)
          .input("no", sql.Int, item.no)
          .input("checkItem", sql.VarChar, item.checkItem)
          .input("status", sql.VarChar, item.status)
          .input("note", sql.VarChar, item.note || "")
          .input("checked", sql.Bit, item.checked ? 1 : 0)
          .input("jenis_report", sql.VarChar, identitas.jenisReport || "CheckList")
          .query(`
            INSERT INTO dbo.ChecksheetData (
              lot, tanggal , jam, shift, nama, mesin, section, area,
              no, checkItem, status, note, checked, jenis_report
            ) VALUES (
              @lot, @tanggal, @jam, @shift, @nama, @mesin, @section, @area,
              @no, @checkItem, @status, @note,  @checked, @jenis_report
            )
          `);
      } catch (err) {
        console.error(`Gagal insert item no ${item.no}:`, err);
      }
    }

    res.status(200).json({ message: "Data berhasil disimpan" });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: "Gagal menyimpan ke database" });
  }
});

// Submit otomatis dari MQTT
router.post("/parameter-checked", async (req, res) => {
  const { nama } = req.body;
  const pool = global.dbPool;

  if (!pool) {
    return res.status(500).json({ error: "Database not connected" });
  }

  const latestData = getLatestData();

  if (!latestData || latestData.length < 5) {
    return res.status(400).json({ error: "Belum ada data valid dari MQTT" });
  }

  const tanggal = latestData[0];
  const jam = latestData[1];
  const mesin = latestData[2];
  const lot = latestData[4];
  const jamSplit = parseInt(jam.split(":")[0], 10);
  const shift = (jamSplit >= 8 && jamSplit < 20) ? "1" : "2";


  let section = "DRW";
  if (/^[1V]/i.test(mesin)) section = "VRT";
  else if (/^H/i.test(mesin)) section = "HRZ";

  const statusValues = latestData.slice(5).map(Number);

  if (statusValues.length !== checkItems.length) {
    return res.status(400).json({ error: "Jumlah data tidak cocok dengan daftar check item" });
  }

  try {
    for (let i = 0; i < checkItems.length; i++) {
        
      try {
        const request = pool.request();

              // await pool
        await request

        //   .request()
          .input("lot", sql.VarChar, lot)
          .input("tanggal", sql.Date, tanggal)
          .input("jam", sql.Time, jam)
          .input("nama", sql.VarChar, nama)
          .input("shift", sql.VarChar, shift)
          .input("mesin", sql.VarChar, mesin)
          .input("section", sql.VarChar, section)
          .input("area", sql.VarChar, "PARAMETER MESIN")
          .input("no", sql.Int, i + 1)
          .input("checkItem", sql.VarChar, checkItems[i])
          .input("status", sql.VarChar, statusValues[i].toString())
          .input("note", sql.VarChar, "")
          .input("checked", sql.Bit, 0)
          .input("jenis_report", sql.VarChar, "Parameter")
          .query(`
            INSERT INTO dbo.ChecksheetData (
              lot, tanggal, jam, nama, shift, mesin, section, area, 
              no, checkItem, status, note, checked, jenis_report
            ) VALUES (
              @lot, @tanggal, @jam, @nama, @shift, @mesin, @section, @area,
              @no, @checkItem, @status, @note, @checked, @jenis_report
            )
          `);
      } catch (err) {
        console.error(`Gagal insert checkItem ke-${i + 1}:`, err);
      }
    }

    res.json({ message: "Data berhasil disimpan", total: checkItems.length });
  } catch (err) {
    console.error("Gagal simpan ke database:", err);
    res.status(500).json({ error: "Gagal menyimpan data ke database" });
  }
});

module.exports = router;
