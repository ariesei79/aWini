const baseUrlQDB = "/QDB_Last"

document.getElementById("btnQuality").addEventListener("click", () => {
  const input = document.getElementById("searchInput").value.trim()

  if (input.length !== 7 || !/^[1VH]/i.test(input)) {
    document.getElementById("result2").innerHTML = "Format input tidak valid. Harus 7 karakter dan dimulai dengan 1, V, atau H."
    return
  }

  const currentYear = new Date().getFullYear().toString() // Contoh: "2025"
  const yearPrefix = currentYear.slice(0, 3) // Ambil "202"
  const year = yearPrefix + input[3] // "202" + "5" → "2025"

  const rawMonth = input[4] // Misal "1"
  const month = rawMonth.padStart(2, "0") // Jadi "01"

  const mesin = input.slice(0, 3).toLowerCase() // "12B" → "12b"
  const tanggalInput = input.slice(-2) // 2 huruf terakhir (contoh: "06")

  fetch(`${baseUrlQDB}/search?year=${year}&month=${month}&mesin=${mesin}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Gagal mengambil data")
      }
      return response.json()
    })
    .then((data) => {
      const resultDiv = document.getElementById("result")
      resultDiv.innerHTML = ""

      let anyMatch = false

      data.forEach((folder) => {
        const filteredFiles = folder.files.filter((item) => {
          const match = item.name.match(/(\d{2})\.tif$/i) // Ambil 2 digit sebelum .tif
          if (!match) return false
          const fileTanggal = match[1]
          return fileTanggal <= tanggalInput
        })

        if (filteredFiles.length === 0) return

        anyMatch = true

        const header = document.createElement("h5")
        header.textContent = "📁 " + folder.path
        resultDiv.appendChild(header)

        const list = document.createElement("ul")
        list.classList.add("list-group", "mb-3")

        filteredFiles.forEach((item) => {
          const listItem = document.createElement("li")
          listItem.className = "list-group-item d-flex justify-content-between align-items-center"

          const nameSpan = document.createElement("span")
          nameSpan.textContent = item.name

          const actionDiv = document.createElement("div")
          const openLink = document.createElement("a")
          openLink.href = item.openUrl
          openLink.target = "_blank"
          openLink.textContent = "Lihat"
          openLink.className = "btn btn-sm btn-outline-primary me-2"

          const downloadLink = document.createElement("a")
          downloadLink.href = item.downloadUrl
          downloadLink.setAttribute("download", item.name)
          downloadLink.textContent = "Unduh"
          downloadLink.className = "btn btn-sm btn-outline-success"

          actionDiv.appendChild(openLink)
          actionDiv.appendChild(downloadLink)

          listItem.appendChild(nameSpan)
          listItem.appendChild(actionDiv)

          list.appendChild(listItem)
        })

        resultDiv.appendChild(list)
      })

      if (!anyMatch) {
        resultDiv.innerHTML = "Tidak ada file yang cocok berdasarkan filter tanggal."
      }
    })
    .catch((err) => {
      document.getElementById("result").innerHTML = "Terjadi kesalahan: " + err.message
    })
})
