document.addEventListener("DOMContentLoaded", () => {
  loadBoards()
})

const baseTrelloUrl = "/PE_Trello"

async function loadBoards() {
  const res = await fetch(`${baseTrelloUrl}/boards`)
  const boards = await res.json()
  const container = document.getElementById("boards")
  container.innerHTML = ""

  for (const board of boards) {
    const boardDiv = document.createElement("div")
    boardDiv.className = "board p-0 border border-5 flex-fill"
    boardDiv.dataset.id = board.id
    boardDiv.ondragover = (e) => e.preventDefault()
    boardDiv.ondrop = dropTask

    const titleWrapper = document.createElement("div")
    titleWrapper.className = "d-flex justify-content-between align-items-center text-bg-warning"

    const title = document.createElement("h5")
    title.textContent = board.name
    title.style.cursor = "pointer"
    title.onclick = () => {
      const input = document.createElement("input")
      input.type = "text"
      input.value = board.name
      input.className = "form-control"
      input.onkeydown = (e) => {
        if (e.key === "Enter") {
          fetch(`${baseTrelloUrl}/boards/${board.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: input.value }),
          }).then(() => {
            loadBoards()
            showToast("Board name updated!")
          })
        }
      }
      title.replaceWith(input)
      input.focus()
    }
    titleWrapper.appendChild(title)

    const deleteBoardBtn = document.createElement("button")
    deleteBoardBtn.className = "btn btn-sm btn-danger"
    deleteBoardBtn.textContent = "×"
    deleteBoardBtn.onclick = () => deleteBoard(board.id)

    titleWrapper.appendChild(title)
    titleWrapper.appendChild(deleteBoardBtn)
    boardDiv.appendChild(titleWrapper)

    const addTaskBtn = document.createElement("button")
    addTaskBtn.className = "btn btn-sm ms-1 btn-success mb-2"
    addTaskBtn.textContent = "Add Task"
    addTaskBtn.onclick = () => addTask(board.id)
    boardDiv.appendChild(addTaskBtn)

    const tasksRes = await fetch(`${baseTrelloUrl}/tasks/${board.id}`)
    let tasks = await tasksRes.json()

    // Sort tasks by position
    tasks.sort((a, b) => a.position - b.position)

    for (const task of tasks) {
      const taskDiv = createTaskElement(task, board.id)
      boardDiv.appendChild(taskDiv)
    }

    container.appendChild(boardDiv)
  }
}

function createTaskElement(task, boardId) {
  const taskDiv = document.createElement("div")
  taskDiv.className = "task alert alert-secondary p-2 ms-2 me-2 my-1 text-black"
  taskDiv.id = `task-${task.id}`
  taskDiv.draggable = true
  taskDiv.dataset.id = task.id
  taskDiv.dataset.boardId = boardId
  taskDiv.ondragstart = dragTask
  taskDiv.ondblclick = () => editTask(task)

  const taskContent = document.createElement("span")
  taskContent.textContent = task.content
  taskDiv.appendChild(taskContent)

  const deleteTaskBtn = document.createElement("button")
  deleteTaskBtn.className = "btn btn-sm btn-outline-danger btn-delete-task"
  deleteTaskBtn.textContent = "×"
  deleteTaskBtn.style.float = "right"
  deleteTaskBtn.onclick = () => deleteTask(task.id)
  taskDiv.appendChild(deleteTaskBtn)

  return taskDiv
}

function addBoard() {
  const name = prompt("Board Name:")
  if (name) {
    fetch(`${baseTrelloUrl}/boards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then(loadBoards)
  }
}

function addTask(boardId) {
  const content = prompt("Task Content:")
  if (content) {
    fetch(`${baseTrelloUrl}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ board_id: boardId, content, position: 0 }),
    }).then(loadBoards)
  }
}

let draggedTask = null

function dragTask(ev) {
  ev.dataTransfer.setData("task-id", ev.target.dataset.id)
}

function dropTask(ev) {
  ev.preventDefault()
  const taskId = ev.dataTransfer.getData("task-id")
  const taskDiv = document.getElementById(`task-${taskId}`)
  const boardDiv = ev.currentTarget
  const boardId = boardDiv.dataset.id

  if (!taskDiv) {
    console.error(`Task div task-${taskId} tidak ditemukan`)
    return
  }

  if (ev.target.classList.contains("task")) {
    ev.target.parentNode.insertBefore(taskDiv, ev.target.nextSibling)
  } else {
    boardDiv.appendChild(taskDiv)
  }

  saveNewTaskOrder(boardId)
}

// function dropTask(e) {
//   if (!draggedTask) return
//   const boardId = e.currentTarget.dataset.id
//   const taskId = draggedTask.dataset.id

//   fetch(`${baseTrelloUrl}/tasks/${taskId}`, {
//     method: "PUT",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ content: draggedTask.textContent, board_id: boardId, position: 0 }),
//   }).then(loadBoards)

//   draggedTask = null
// }

// function deleteBoard(id) {
//   if (confirm("Delete this board?")) {
//     fetch(`${baseTrelloUrl}/boards/${id}`, { method: "DELETE" }).then(loadBoards)
//   }
// }
async function deleteBoard(boardId) {
  const boardDiv = document.querySelector(`.board[data-id='${boardId}']`)
  const tasks = boardDiv.querySelectorAll(".task")

  if (tasks.length > 0) {
    const confirmDelete = confirm("Di dalam board ini masih ada task. Apakah Anda yakin mau menghapus board beserta semua task?")
    if (!confirmDelete) return

    // Hapus semua task dalam board ini
    for (const taskDiv of tasks) {
      const taskId = taskDiv.dataset.id
      await fetch(`${baseTrelloUrl}/tasks/${taskId}`, {
        method: "DELETE",
      }).catch((err) => console.error("Gagal hapus task:", err))
    }
  }

  // Setelah task dihapus (atau memang kosong), hapus board-nya
  fetch(`${baseTrelloUrl}/boards/${boardId}`, {
    method: "DELETE",
  })
    .then(() => {
      loadBoards() // reload semua board biar update
    })
    .catch((err) => console.error("Gagal hapus board:", err))
}

function deleteTask(id) {
  if (confirm("Delete this task?")) {
    fetch(`${baseTrelloUrl}/tasks/${id}`, { method: "DELETE" }).then(loadBoards)
  }
}

function editTask(task) {
  const content = prompt("Edit Task Content:", task.content)
  if (content !== null) {
    fetch(`${baseTrelloUrl}/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, board_id: task.board_id, position: task.position }),
    }).then(loadBoards)
  }
}

function saveNewTaskOrder(boardId) {
  const boardDiv = document.querySelector(`.board[data-id='${boardId}']`)
  const tasks = boardDiv.querySelectorAll(".task")

  tasks.forEach((taskDiv, index) => {
    const taskId = taskDiv.dataset.id
    fetch(`${baseTrelloUrl}/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        board_id: boardId,
        position: index,
      }),
    }).catch((err) => console.error("Failed to update task:", err))
  })
}

function dragTask(ev) {
  ev.dataTransfer.setData("task-id", ev.target.dataset.id)
}
