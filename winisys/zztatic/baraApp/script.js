let currentData = [];

document.addEventListener("DOMContentLoaded", () => {
  loadTasks();

  const form = document.querySelector("form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.querySelector("#input");
    const value = input.value.trim();
    if (value) {
      await fetch("/baraApp/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: value, container: "container-todos" }),
      });
      input.value = "";
      loadTasks();
    }
  });
});

async function loadTasks() {
  const res = await fetch("/baraApp/tasks");
  currentData = await res.json();

  const containers = document.querySelectorAll(".container");
  containers.forEach((c) => {
    const label = c.querySelector("h1").textContent;
    c.innerHTML = `<h1>${label}</h1>`;
  });

  currentData.forEach((task) => {
    const div = document.createElement("div");
    div.classList.add("draggable");
    div.draggable = true;
    div.id = task.id;

    // Isi teks
    const content = document.createElement("div");
    content.classList.add("task-content");
    content.textContent = task.title;
    div.appendChild(content);

    // Tombol edit & delete di kanan bawah
    const btns = document.createElement("div");
    btns.classList.add("task-buttons");
    btns.appendChild(createEditBt(task.id));
    btns.appendChild(createDeleteBt(task.id));
    div.appendChild(btns);

    dragListeners(div);
    document.getElementById(task.container).appendChild(div);
  });

  containerDragEvents();
}

function createEditBt(id) {
  const btn = document.createElement("button");
  btn.innerHTML = '<img src="edit.png" width="15" height="20">';
  btn.classList.add("btn-icon");
  btn.onclick = async () => {
    const taskDiv = document.getElementById(id);
    const currentText = taskDiv.querySelector(".task-content").textContent;
    const val = prompt("Edit item:", currentText);
    if (val && val.trim()) {
      await fetch(`/baraApp/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: val.trim() }),
      });
      loadTasks();
    }
  };
  return btn;
}

function createDeleteBt(id) {
  const btn = document.createElement("button");
  btn.innerHTML = '<img src="delete.png" width="15" height="20">';
  btn.classList.add("btn-icon");
  btn.onclick = async () => {
    await fetch(`/baraApp/tasks/${id}`, { method: "DELETE" });
    loadTasks();
  };
  return btn;
}

function dragListeners(div) {
  div.addEventListener("dragstart", () => div.classList.add("dragging"));
  div.addEventListener("dragend", () => div.classList.remove("dragging"));
}

function containerDragEvents() {
  const containers = document.querySelectorAll(".container");
  containers.forEach((container) => {
    container.addEventListener("dragover", async (e) => {
      e.preventDefault();
      const dragging = document.querySelector(".dragging");
      const afterElement = dragAfter(container, e.clientY);
      if (afterElement == null) {
        container.appendChild(dragging);
      } else {
        container.insertBefore(dragging, afterElement);
      }

      const id = dragging.id;
      await fetch(`/baraApp/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ container: container.id }),
      });
    });
  });
}

function dragAfter(container, y) {
  const draggableEls = [...container.querySelectorAll(".draggable:not(.dragging)")];
  return draggableEls.reduce(
    (closest, el) => {
      const box = el.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      return offset < 0 && offset > closest.offset ? { offset, element: el } : closest;
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}
