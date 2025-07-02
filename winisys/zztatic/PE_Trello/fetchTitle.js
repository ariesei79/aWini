// let pageTitle = document.getElementById("page-title")
const baseTrelloUrl2 = "/PE_Trello"
function loadTitle() {
  fetch(`${baseTrelloUrl2}/title`)
    .then((res) => res.json())
    .then((data) => {
      const pageTitle = document.getElementById("page-title")
      if (pageTitle) {
        pageTitle.textContent = data.title
      }
    })
    .catch((error) => {
      console.error("Error loading title:", error)
    })
}

function enableTitleEditing() {
  const pageTitle = document.getElementById("page-title")

  pageTitle.addEventListener("dblclick", () => {
    const currentTitle = pageTitle.textContent
    const input = document.createElement("input")
    input.type = "text"
    input.value = currentTitle
    input.className = "form-control mb-2"
    pageTitle.replaceWith(input)
    input.focus()

    input.addEventListener("blur", () => {
      saveTitle(input.value)
    })

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        saveTitle(input.value)
      }
    })
  })
}

function saveTitle(newTitle) {
  fetch(`${baseTrelloUrl2}/title`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: newTitle }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Title updated:", data.title)
      window.location.reload() // Reload supaya judul terupdate
    })
    .catch((error) => {
      console.error("Error updating title:", error)
    })
}

document.addEventListener("DOMContentLoaded", () => {
  loadTitle()
  enableTitleEditing()
})
