// const monthMap = {
//   A: "01",
//   B: "02",
//   C: "03",
//   D: "04",
//   E: "05",
//   F: "06",
//   G: "07",
//   H: "08",
//   I: "09",
//   J: "10",
//   K: "11",
//   L: "12",
//   X: "11",
//   Y: "12",
// }

// function getBulanFromChar(char) {
//   const c = char?.toUpperCase()

//   // Angka 1–9 langsung jadi bulan
//   if (/^[1-9]$/.test(c)) {
//     return c.padStart(2, "0") // format "01", ..., "09"
//   }

//   // Mapping huruf A-L, X, Y
//   if (monthMap[c]) {
//     return monthMap[c]
//   }

//   return null
// }

// function buildFilePath2(inputValue) {
//   inputValue = (inputValue || "").trim().toUpperCase()

//   if (inputValue.length < 7) {
//     return { success: false, error: "Input harus minimal 7 karakter." }
//   }
//   let mesin = inputValue.substring(0, 3) // 3 huruf pertama = "12B"
//   const mesinHead = inputValue.charAt(0) // 3 huruf pertama = "12B"
//   if (mesinHead === "1") {
//     mesin = "V" + mesin
//   }
//   const fourthChar = inputValue.charAt(3)
//   const fifthChar = inputValue.charAt(4) // huruf ke-5 = "5"
//   const bulan = getBulanFromChar(fifthChar)

//   if (!bulan) {
//     return { success: false, error: "Bulan tidak valid dari huruf ke-5 input." }
//   }

//   const tahun3Digit = new Date().getFullYear().toString().substring(0, 3) // contoh: "202"
//   const tahun = tahun3Digit + fourthChar // contoh: "2025"
//   const tanggal = inputValue.slice(-2) // 2 karakter terakhir = "12"

//   // Buat fileNamePattern untuk pencarian
//   const fileNamePattern = `${mesin}$${tahun}${bulan}${tanggal}`

//   return {
//     success: true,
//     path: {
//       mesin,
//       tahun,
//       bulan,
//       tanggal,
//       fileNamePattern, // bukan ekstensi .krd dulu, hanya pattern
//     },
//   }
// }

// module.exports = { buildFilePath2 }
