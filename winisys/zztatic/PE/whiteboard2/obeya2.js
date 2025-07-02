const input = document.querySelector(".input")
const addObeyaBtn = document.querySelector(".add")
const items1Div = document.querySelector(".items1")

const containerObeya = document.querySelector(".tasks1")
const removeComplete = document.querySelector(".remove-complete")

const baseUrl2 = "/PE/whiteboard2" // Sesuaikan URL sesuai kebutuhan

addObeyaBtn.addEventListener("click", addobeya)

containerObeya.addEventListener("click", (e) => {
  const targetClass = e.target.classList[0]
  const parentElement = e.target.parentElement
  switch (targetClass) {
    case "completed-button":
      completeObeya(parentElement)
      break
    case "delete-button":
      deleteObeya(parentElement)
      break
    case "edit-button":
      editObeya(parentElement)
      break
  }
})

removeComplete.addEventListener("click", (e) => {
  e.preventDefault()
  ;[...containerObeya.children].forEach((element) => {
    if (element.classList.contains("completed")) {
      deleteObeya(element)
    }
  })
})

//Get All Data from DataBase
async function fetchobeya() {
  const response = await fetch(`${baseUrl2}/obeyas`)
  const obeya = await response.json()
  containerObeya.innerHTML = ""
  obeya.forEach((obeya) => {
    const obeyaDiv = generateobeyaElement(obeya)
    containerObeya.appendChild(obeyaDiv)
  })
}

function generateobeyaElement(obeya) {
  const obeyaDiv = document.createElement("div")
  obeyaDiv.classList.add("obeya-item")
  if (obeya.completed) obeyaDiv.classList.add("completed")
  obeyaDiv.dataset.id = obeya.id

  const text = document.createElement("div")
  text.classList.add("obeya-text")
  text.innerText = obeya.item
  obeyaDiv.appendChild(text)

  const completedButton = document.createElement("div")
  completedButton.classList.add("completed-button")
  completedButton.innerHTML = '<i class="fa-solid fa-check completeBtn"><img src="ceklist.png" width="18" height="22"></i>'
  obeyaDiv.appendChild(completedButton)

  const editButton = document.createElement("div")
  editButton.classList.add("edit-button")
  editButton.innerHTML = '<i class="fa-solid fa-check completeBtn"><img src="edit.png" width="18" height="22"></i>'
  obeyaDiv.appendChild(editButton)

  const deleteButton = document.createElement("div")
  deleteButton.classList.add("delete-button")
  deleteButton.innerHTML = '<i class="fa-solid fa-check completeBtn"><img src="delete.png" width="18" height="22"></i>'
  obeyaDiv.appendChild(deleteButton)

  return obeyaDiv
}

async function addobeya(e) {
  e.preventDefault()
  let item = input.value.trim()
  if (item) {
    const response = await fetch(`${baseUrl2}/obeyas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ item, completed: 0 }),
    })
    const newobeya = await response.json()
    fetchobeya()
    input.value = ""
  }
}
async function deleteObeya(obeya) {
  const id = obeya.dataset.id
  await fetch(`${baseUrl2}/obeyas/${id}`, {
    method: "DELETE",
  })
  fetchobeya()
}

async function editObeya(obeya) {
  const id = obeya.dataset.id
  const obeyaText = obeya.querySelector(".obeya-text")
  const newText = prompt("Edit your task:", obeyaText.innerText)
  if (newText !== null && newText.trim() !== "") {
    await fetch(`${baseUrl2}/obeyas/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ item: newText, completed: obeya.classList.contains("completed") ? 1 : 0 }),
    })
    fetchobeya()
  }
}

async function completeObeya(obeya) {
  const id = obeya.dataset.id
  const completed = obeya.classList.contains("completed") ? 0 : 1
  await fetch(`${baseUrl2}/obeyas/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ item: obeya.querySelector(".obeya-text").innerText, completed }),
  })
  fetchobeya()
}
window.addEventListener("load", fetchobeya)
