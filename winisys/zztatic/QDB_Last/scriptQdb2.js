const baseUrldTemp = "/QDB_Last"

async function performSearch() {
  const searchInput = document.getElementById("searchInput")
  const resultDiv = document.getElementById("result2")

  if (!searchInput || !resultDiv) {
    console.warn("Elemen DOM tidak ditemukan.")
    return
  }

  const inputValue = searchInput.value.trim()
  if (!inputValue) {
    resultDiv.textContent = "Silakan masukkan kode pencarian."
    return
  }

  resultDiv.innerHTML = "<p>Sedang mencari file...</p>"

  try {
    const response = await fetch(`${baseUrldTemp}/search-file`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputValue }),
    })

    if (!response.ok) {
      throw new Error("Gagal mendapatkan respons dari server.")
    }

    const data = await response.json()

    resultDiv.innerHTML = ""

    const header = document.createElement("h5")
    header.classList.add("mb-3")
    header.textContent = "📁 Temperature Recorder"
    resultDiv.appendChild(header)

    if (data.success) {
      const listGroup = document.createElement("ul")
      listGroup.classList.add("list-group")

      // Jika hanya satu file
      if (data.path && data.fileName) {
        const fileName = data.fileName // Sudah termasuk .krd
        const item = createFileItem(fileName, data.path)
        listGroup.appendChild(item)
      }
      // Jika banyak file
      else if (Array.isArray(data.files) && data.files.length > 0) {
        data.files.forEach((fileEntry) => {
          if (fileEntry.path && fileEntry.fileName) {
            const fileName = fileEntry.fileName
            const item = createFileItem(fileName, fileEntry.path)
            listGroup.appendChild(item)
          }
        })
      } else {
        const noItem = document.createElement("li")
        noItem.classList.add("list-group-item")
        noItem.textContent = "Tidak ada file ditemukan."
        listGroup.appendChild(noItem)
      }

      resultDiv.appendChild(listGroup)
    } else {
      const errorText = document.createElement("div")
      errorText.style.color = "red"
      errorText.textContent = "❌ " + (data.error || "Terjadi kesalahan.")
      resultDiv.appendChild(errorText)
    }
  } catch (err) {
    console.error(err)
    resultDiv.innerHTML = ""
    const errorText = document.createElement("div")
    errorText.style.color = "red"
    errorText.textContent = "🚨 Terjadi kesalahan saat mencari file."
    resultDiv.appendChild(errorText)
  }
}

function createFileItem(fileName, fileLocalPath) {
  const li = document.createElement("li")
  li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center")

  let filePathOnServer = encodeURI(fileLocalPath) // fallback

  if (fileLocalPath.startsWith("L:\\")) {
    filePathOnServer = "/files/" + fileLocalPath.replace(/^L:\\/i, "").replace(/\\/g, "/")
  }

  // Tombol Lihat
  const openLink = document.createElement("a")
  openLink.href = filePathOnServer
  openLink.target = "_blank"
  openLink.textContent = fileName
  openLink.classList.add("me-2")

  // Tombol Unduh
  const downloadLink = document.createElement("a")
  downloadLink.href = filePathOnServer
  downloadLink.download = ""
  downloadLink.textContent = "Unduh"
  downloadLink.classList.add("btn", "btn-sm", "btn-outline-primary")

  // Gabung ke DOM
  li.appendChild(openLink)
  li.appendChild(downloadLink)

  return li
}

document.addEventListener("DOMContentLoaded", () => {
  const btnQuality = document.getElementById("btnQuality")

  if (btnQuality) {
    btnQuality.addEventListener("click", (e) => {
      e.preventDefault()
      performSearch()
    })
  } else {
    console.warn("Tombol 'btnQuality' tidak ditemukan di DOM.")
  }
})
