document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('todo-form');
    const taskInput = document.getElementById('task');
    const dateInput = document.getElementById('date');
    const todoList = document.getElementById('todo-list');

    const fetchTodos = async () => {
        const response = await fetch('/api/todos');
        const todos = await response.json();
        todoList.innerHTML = '';
        todos.forEach(todo => {
            const li = document.createElement('li');
            li.textContent = `${todo.task} - ${todo.date}`;
            todoList.appendChild(li);
        });
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const task = taskInput.value;
        const date = dateInput.value;
        await fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task, date }),
        });
        taskInput.value = '';
        dateInput.value = '';
        fetchTodos();
    });

    fetchTodos();
});
