document.addEventListener('DOMContentLoaded', () => {
  const todoTasks = document.getElementById('todo-tasks');
  const inProgressTasks = document.getElementById('inprogress-tasks');
  const doneTasks = document.getElementById('done-tasks');
  const taskTitleInput = document.getElementById('task-title');
  const taskDescriptionInput = document.getElementById('task-description');
  const taskForm = document.getElementById('task-form');
 
   // Get tasks from the server
  function loadTasks() {
    fetch('/api/tasks')
      .then(response => response.json())
      .then(data => {
        todoTasks.innerHTML = '';
        inProgressTasks.innerHTML = '';
        doneTasks.innerHTML = '';
        
        data.tasks.forEach(task => {
          const taskElement = document.createElement('div');
          taskElement.classList.add('task');
          taskElement.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description}</p>
            <button class="delete-task" data-id="${task.id}">Delete</button>
          `;
          
          taskElement.draggable = true;
          taskElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
          });

          // Append task to correct column based on its status
          switch (task.status) {
            case 'todo':
              todoTasks.appendChild(taskElement);
              break;
            case 'inprogress':
              inProgressTasks.appendChild(taskElement);
              break;
            case 'done':
              doneTasks.appendChild(taskElement);
              break;
          }
        });

        // Add event listeners for Delete buttons
        const deleteButtons = document.querySelectorAll('.delete-task');
        deleteButtons.forEach(button => {
          button.addEventListener('click', (e) => {
            const taskId = e.target.getAttribute('data-id');
            deleteTask(taskId);
          });
        });
      });
  }

  loadTasks();

  // Add new task functionality
  document.getElementById('add-task-btn').addEventListener('click', () => {
    taskForm.style.display = 'block';
  });

  document.getElementById('submit-task').addEventListener('click', () => {
    const title = taskTitleInput.value;
    const description = taskDescriptionInput.value;
    
    fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, description, status: 'todo' })
    })
      .then(response => response.json())
      .then(() => {
        loadTasks();
        taskForm.style.display = 'none';
        taskTitleInput.value = '';
        taskDescriptionInput.value = '';
      });
  });

  // Handle deleting task
  function deleteTask(taskId) {
    fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE'
    })
      .then(() => {
        loadTasks();
      });
  }

  // Handle dragging and dropping tasks to change status
  const columns = document.querySelectorAll('.column');
  columns.forEach(column => {
    column.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    column.addEventListener('drop', (e) => {
      const taskId = e.dataTransfer.getData('text/plain');
      const status = column.id;
      
      fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      }).then(() => loadTasks());
    });
  });
});
