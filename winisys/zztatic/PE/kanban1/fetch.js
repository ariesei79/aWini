const baseUrl3 = "/PE/kanban1" // Sesuaikan URL sesuai kebutuhan

// Fungsi untuk memuat semua board dan task
const boardContainer = document.getElementById("boards")
const addBoardButton = document.getElementById("add-board")

addBoardButton.addEventListener("click", addBoard)
boardContainer.addEventListener("click", async (e) => {
  const target = e.target
  const parentElement = target.closest(".board") || target.closest(".task")

  if (!parentElement) return

  switch (target.className) {
    case "task-complete-button":
      // completeTask(parentElement)
      break
    case "delete-button":
      // deleteBoard(parentElement)
      break
    case "add-task-button":
      // addTask(parentElement)
      break
    case "edit-task-button":
      // editTask(parentElement)
      break
  }
})

async function fetchBoard() {
  try {
    const response = await fetch(`${baseUrl3}/trellos`)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const boards = await response.json()
    boardContainer.innerHTML = "" // Bersihkan container sebelum menambahkan elemen baru

    // Render setiap board dan task-nya
    boards.forEach((board) => {
      const boardElement = generateBoardElement(board)
      boardContainer.appendChild(boardElement)

      // Tambahkan task-task ke board
      const tasksContainer = boardElement.querySelector(".tasks")
      board.tasks.forEach((task) => {
        const taskElement = generateTaskElement(task)
        tasksContainer.appendChild(taskElement)
      })
    })
  } catch (error) {
    console.error("Error fetching Board:", error)
  }
}

function generateBoardElement(board) {
  const boardDiv = document.createElement("div")
  boardDiv.className = "board"
  boardDiv.dataset.id = board.id

  // Judul board
  const titleDiv = document.createElement("div")
  titleDiv.classList.add("board-title")

  const titleText = document.createElement("span")
  titleText.innerText = board.name
  titleText.onclick = () => editBoard(titleText) // Tambahkan event listener untuk edit
  titleDiv.appendChild(titleText)

  const deleteButton = document.createElement("delete-button")
  deleteButton.innerHTML = '<img src="../whiteboard2/delete.png" width="18" height="22">'
  titleDiv.appendChild(deleteButton)

  boardDiv.appendChild(titleDiv)

  // Tombol tambah task
  const addTaskButton = document.createElement("add-task-button")
  addTaskButton.innerHTML = '<img src="../whiteboard2/faplus.png" width="35" height="30"> Task'

  boardDiv.appendChild(addTaskButton)

  // Container untuk task
  const tasksContainer = document.createElement("div")
  tasksContainer.className = "tasks"
  tasksContainer.setAttribute("ondrop", "drop(event)")
  tasksContainer.setAttribute("ondragover", "allowDrop(event)")
  boardDiv.appendChild(tasksContainer)

  return boardDiv
}

function generateTaskElement(task) {
  const taskDiv = document.createElement("div")
  taskDiv.className = "task"
  taskDiv.draggable = true
  taskDiv.dataset.id = task.id

  // Nama task
  const taskText = document.createElement("span")
  taskText.innerText = task.job
  taskDiv.appendChild(taskText)

  // Tombol selesai
  const completedButton = document.createElement("task-complete-button")
  completedButton.innerHTML = '<img src="../whiteboard2/ceklist.png" width="18" height="22">'
  taskDiv.appendChild(completedButton)

  // Tombol edit
  const editButton = document.createElement("task-edit-button")
  editButton.innerHTML = '<img src="../whiteboard2/edit.png" width="18" height="22">'
  taskDiv.appendChild(editButton)

  // Tombol hapus
  const deleteButton = document.createElement("task-delete-button")
  deleteButton.innerHTML = '<img src="../whiteboard2/delete.png" width="18" height="22">'
  taskDiv.appendChild(deleteButton)

  return taskDiv
}
// function addBoard() {}
async function editBoard() {}
async function addBoard() {
  try {
    // Simulasikan input nama board dari pengguna (misalnya, prompt atau modal)
    const boardName = prompt("Masukkan nama board baru:")
    if (!boardName || boardName.trim() === "") {
      alert("Nama board tidak boleh kosong!")
      return
    }

    // Kirim permintaan POST untuk menambahkan board baru ke server
    const response = await fetch(`${baseUrl3}/trellos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: boardName, tasks: [] }), // Data board baru
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    // Tambahkan board baru ke DOM tanpa perlu memuat ulang semua board
    const newBoard = await response.json()
    const boardElement = generateBoardElement(newBoard)
    boardContainer.appendChild(boardElement)

    console.log("Board berhasil ditambahkan:", newBoard)
  } catch (error) {
    console.error("Error adding board:", error)
    alert("Gagal menambahkan board. Silakan coba lagi.")
  }
}

window.addEventListener("load", fetchBoard)
