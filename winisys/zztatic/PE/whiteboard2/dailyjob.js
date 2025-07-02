const inputText = document.querySelector(".text-input")
const addButton = document.querySelector(".add-input")
const allContainer = document.querySelector(".all-container")
const removeCompleted = document.querySelector(".remove-completed")

const baseUrl = "/PE/whiteboard2" // Sesuaikan URL sesuai kebutuhan

addButton.addEventListener("click", addTodo)

allContainer.addEventListener("click", (e) => {
  const targetClass = e.target.classList[0]
  const parentElement = e.target.parentElement
  switch (targetClass) {
    case "completed-button":
      completeTodo(parentElement)
      break
    case "delete-button":
      deleteTodo(parentElement)
      break
    case "edit-button":
      editTodo(parentElement)
      break
  }
})

removeCompleted.addEventListener("click", (e) => {
  e.preventDefault()
  ;[...allContainer.children].forEach((element) => {
    if (element.classList.contains("completed")) {
      deleteTodo(element)
    }
  })
})

async function fetchTodos() {
  const response = await fetch(`${baseUrl}/todos`)
  const todos = await response.json()
  allContainer.innerHTML = ""
  todos.forEach((todo) => {
    const todoDiv = generateTodoElement(todo)
    allContainer.appendChild(todoDiv)
  })
}

async function addTodo(e) {
  e.preventDefault()
  let task = inputText.value.trim()
  if (task) {
    const response = await fetch(`${baseUrl}/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task, completed: 0 }),
    })
    const newTodo = await response.json()
    fetchTodos()
    inputText.value = ""
  }
}

function generateTodoElement(todo) {
  const todoDiv = document.createElement("div")
  todoDiv.classList.add("todo-item")
  if (todo.completed) todoDiv.classList.add("completed")
  todoDiv.dataset.id = todo.id

  const text = document.createElement("div")
  text.classList.add("todo-text")
  text.innerText = todo.task
  todoDiv.appendChild(text)

  const completedButton = document.createElement("div")
  completedButton.classList.add("completed-button")
  completedButton.innerHTML = '<i class="fa-solid fa-check completeBtn"><img src="ceklist.png" width="18" height="22"></i>'
  todoDiv.appendChild(completedButton)

  const editButton = document.createElement("div")
  editButton.classList.add("edit-button")
  editButton.innerHTML = '<i class="fa-solid fa-check completeBtn"><img src="edit.png" width="18" height="22"></i>'
  todoDiv.appendChild(editButton)

  const deleteButton = document.createElement("div")
  deleteButton.classList.add("delete-button")
  deleteButton.innerHTML = '<i class="fa-solid fa-check completeBtn"><img src="delete.png" width="18" height="22"></i>'
  todoDiv.appendChild(deleteButton)

  return todoDiv
}

async function completeTodo(todo) {
  const id = todo.dataset.id
  const completed = todo.classList.contains("completed") ? 0 : 1
  await fetch(`${baseUrl}/todos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ task: todo.querySelector(".todo-text").innerText, completed }),
  })
  fetchTodos()
}

async function deleteTodo(todo) {
  const id = todo.dataset.id
  await fetch(`${baseUrl}/todos/${id}`, {
    method: "DELETE",
  })
  fetchTodos()
}

async function editTodo(todo) {
  const id = todo.dataset.id
  const todoText = todo.querySelector(".todo-text")
  const newText = prompt("Edit your task:", todoText.innerText)
  if (newText !== null && newText.trim() !== "") {
    await fetch(`${baseUrl}/todos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task: newText, completed: todo.classList.contains("completed") ? 1 : 0 }),
    })
    fetchTodos()
  }
}

window.addEventListener("load", fetchTodos)
