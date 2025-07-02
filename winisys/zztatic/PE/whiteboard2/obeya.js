const input = document.querySelector(".input")
const add = document.querySelector(".add")
const tasks1Div = document.querySelector(".tasks1")
const deleteAll = document.querySelector(".deleteAll")
const doneAll = document.querySelector(".doneAll")

const baseUrl = "/PE/whiteboard2" // Sesuaikan URL sesuai kebutuhan

add.addEventListener("click", addTask)

// Fetch all tasks
async function getTasks() {
  const response = await fetch(`${baseUrl}/obeyas`)
  return await response.json()
}

async function fetchobeya() {
  const tasks = await getTasks()
  tasks1Div.innerHTML = "" // Bersihkan daftar tugas sebelum menambahkan yang baru
  tasks.forEach((task) => {
    const div = document.createElement("div")
    div.className = "task1" + (task.completed ? " done" : "") // Tambahkan kelas "done" jika tugas sudah selesai
    div.setAttribute("data-id", task.id) // Set atribut data-id untuk identifikasi tugas
    div.appendChild(document.createTextNode(task.item)) // Tambahkan teks tugas

    // Buat elemen ikon (Done, Edit, dan Delete)
    const divIcons = document.createElement("div")

    const doneSpan = document.createElement("span")
    doneSpan.className = "spanDone"
    doneSpan.appendChild(document.createTextNode("Done"))

    const editSpan = document.createElement("span")
    editSpan.className = "spanEdit"
    editSpan.appendChild(document.createTextNode("Edit"))

    const span = document.createElement("span")
    span.className = "del"
    span.appendChild(document.createTextNode("X"))

    // Tambahkan ikon ke divIcons
    divIcons.appendChild(doneSpan)
    divIcons.appendChild(editSpan)
    divIcons.appendChild(span)

    // Tambahkan divIcons ke div utama
    div.appendChild(divIcons)

    // Tambahkan div ke tasks1Div
    tasks1Div.appendChild(div)
  })
}

async function addTask(e) {
  e.preventDefault() // Perbaikan: preventDefault() bukan prevent.default()
  let item = input.value.trim() // Hapus spasi ekstra dari input
  if (item) {
    try {
      const response = await fetch(`${baseUrl}/obeyas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ item }), // Kirim data sebagai JSON
      })

      if (!response.ok) {
        throw new Error("Failed to add task")
      }

      const newTask = await response.json() // Ambil respons JSON dari server
      console.log("Task added:", newTask)
      input.value = "" // Kosongkan input setelah berhasil menambahkan tugas
      fetchobeya() // Refresh daftar tugas
    } catch (error) {
      console.error("Error adding task:", error)
    }
  }
}

// Delete a task
async function deleteTask(id) {
  try {
    await fetch(`${baseUrl}/obeyas/${id}`, {
      method: "DELETE",
    })
  } catch (error) {
    console.error(error)
  }
}

async function deleteAllTasks() {
  try {
    await fetch(`${baseUrl}/obeyas`, {
      method: "DELETE",
    })
  } catch (error) {
    console.error(error)
  }
}

// Update task status
async function updateTaskStatus(id, completed) {
  const response = await fetch(`${baseUrl}/obeyas/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ completed }),
  })
  return await response.json()
}

// Update task item
async function updateTaskItem(id, newItem) {
  const response = await fetch(`${baseUrl}/obeyas/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ item: newItem }),
  })
  return await response.json()
}

// Task actions event listener
tasks1Div.addEventListener("click", async (e) => {
  if (e.target.classList.contains("del")) {
    const taskId = e.target.parentElement.parentElement.getAttribute("data-id")
    await deleteTask(taskId)
    fetchobeya()
  }
  if (e.target.classList.contains("spanDone")) {
    const taskId = e.target.parentElement.parentElement.getAttribute("data-id")
    const task = await getTasks()
    const completed = task.find((t) => t.id == taskId).completed
    await updateTaskStatus(taskId, !completed)
    fetchobeya()
  }

  if (e.target.classList.contains("spanEdit")) {
    const taskId = e.target.parentElement.parentElement.getAttribute("data-id")
    const task = await getTasks()
    const currentItem = task.find((t) => t.id == taskId).item

    // Buat input untuk mengedit
    const editInput = document.createElement("input")
    editInput.type = "text"
    editInput.value = currentItem

    const saveButton = document.createElement("button")
    saveButton.textContent = "Save"
    // Ganti elemen tugas dengan input dan tombol simpan
    const taskDiv = e.target.parentElement.parentElement
    taskDiv.innerHTML = "" // Kosongkan konten div tugas
    taskDiv.appendChild(editInput)
    taskDiv.appendChild(saveButton)

    // Event listener untuk menyimpan perubahan
    saveButton.addEventListener("click", async () => {
      const newItem = editInput.value.trim()
      if (newItem) {
        await updateTaskItem(taskId, newItem)
        fetchobeya() // Refresh daftar tugas setelah mengedit
      }
    })
  }
})

// Delete all tasks event listener
deleteAll.onclick = async function () {
  await deleteAllTasks()
  fetchobeya()
}

// Mark all tasks as completed event listener
// doneAll.onclick = async function () {
//   await completeAllTasks()
//   fetchobeya()
// }

window.addEventListener("load", fetchobeya) // Panggil fetchobeya saat halaman dimuat
