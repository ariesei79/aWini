let userMap = {};

document.addEventListener('DOMContentLoaded', () => {
  Promise.all([
    fetch('/kanbanku/notes').then(res => res.json()),
    fetch('/kanbanku/users').then(res => res.json()),
    fetch('/kanbanku/avatars').then(res => res.json())
  ])
  .then(([data, users, avatars]) => {
    userMap = {};
    users.forEach(u => userMap[u.initial] = u);

    data.notes.forEach(note => {
      const subtasks = data.subtasks.filter(st => st.note_id === note.id);
      renderNote(note, subtasks);
    });

    // Avatar options
    const avatarSelect = document.getElementById('avatar-select');
    avatars.forEach(file => {
      const opt = document.createElement('option');
      opt.value = `/kanbanku/avatar/${file}`;
      opt.textContent = file;
      avatarSelect.appendChild(opt);
    });

    // Avatar preview
    avatarSelect.addEventListener('change', () => {
      document.getElementById('avatar-preview').innerHTML = `
        <img src="${avatarSelect.value}" width="50" height="50" style="border-radius:50%;" />
      `;
    });
    avatarSelect.dispatchEvent(new Event('change'));

    // Initial user dropdown
    const initialSelect = document.getElementById('user-initial');
    users.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.initial;
      opt.textContent = `${u.initial} - ${u.name}`;
      initialSelect.appendChild(opt);
    });
  });

  // Drag-drop area
  document.querySelectorAll('.note-container').forEach(container => {
    container.addEventListener('dragover', e => e.preventDefault());
    container.addEventListener('drop', onDrop);
  });
// Modal Add Note
document.getElementById('open-add-note').onclick = () => {
  document.getElementById('add-note-modal').style.display = 'block';
};
document.getElementById('close-add-note').onclick = () => {
  document.getElementById('add-note-modal').style.display = 'none';
};
window.onclick = function (event) {
  if (event.target === document.getElementById('add-note-modal')) {
    document.getElementById('add-note-modal').style.display = 'none';
  }
};

  // Modal: open / close
  document.getElementById('open-profile').onclick = () => {
    document.getElementById('user-modal').style.display = 'block';
  };
  document.getElementById('open-settings').onclick = () => {
  document.getElementById('setting-modal').style.display = 'block';
  loadUserList();
};
  document.getElementById('close-profile').onclick = () => {
    document.getElementById('user-modal').style.display = 'none';
  };
  document.getElementById('close-settings').onclick = () => {
  document.getElementById('setting-modal').style.display = 'none';
};
  window.onclick = function (event) {
    const modal = document.getElementById('user-modal');
    if (event.target === modal) modal.style.display = 'none';
  };
});

function addNote() {
  const title = document.getElementById('note-title').value.trim();
  const userInitial = document.getElementById('user-initial').value;

  if (!title || !userInitial) return alert('Please fill both title and user.');

  fetch('/kanbanku/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      user_initial: userInitial,
      column_name: 'To Do'
    })
  })
  .then(res => res.json())
  .then(note => {
    renderNote({
      id: note.id,
      title,
      user_initial: userInitial,
      column_name: 'To Do'
    }, []);
    document.getElementById('note-title').value = '';
    document.getElementById('user-initial').value = '';
  });
}

function saveUserProfile() {
  const name = document.getElementById('user-name').value.trim();
  const initial = document.getElementById('user-initial-profile').value.trim();
  const avatar_url = document.getElementById('avatar-select').value;
  const note_theme = document.getElementById('note-theme').value;

  if (!initial || !name || !note_theme) return alert('Fill all profile fields');

  fetch('/kanbanku/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, initial, avatar_url, note_theme })
  }).then(() => {
    alert('User profile saved!');
    location.reload();
  });
}

function renderNote(note, subtasks = []) {
  const user = userMap[note.user_initial] || {};
  const themeColor = user.note_theme || '#fff9b1';

  const div = document.createElement('div');
  div.className = 'note';
  div.style.background = themeColor;
  div.draggable = true;
  div.dataset.id = note.id;

  const avatar = user.avatar_url
    ? `<img class="avatar" src="${user.avatar_url}" alt="${note.user_initial}">`
    : '';

  const subtaskHTML = subtasks.map(st => `
    <div class="subtask-item" data-id="${st.id}">
      <input type="checkbox" ${st.completed ? 'checked' : ''} onchange="toggleCheckbox(${st.id}, this.checked)">
      <span class="content" contenteditable="true" onblur="editSubtask(${st.id}, this.innerText.trim())">${st.content}</span>
      <button onclick="deleteSubtask(${st.id}, this)">🗑</button>
    </div>
  `).join('');

  div.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>${avatar}<span class="user">${note.user_initial}</span></div>
      <button class="delete-note-btn" onclick="deleteNote(${note.id}, this.closest('.note'))"><img src="icon/delete.png" alt="Delete" class="delete-icon" /></button>
    </div>
    <div><strong>${note.title}</strong></div>
    <div class="subtask-form">
    <input type="text" placeholder="Add subtask..." onkeypress="handleSubtaskEnter(event, ${note.id})" />
    </div>
    <div class="subtask-toggle" onclick="toggleSubtasks(this)">
    <span class="toggle-icon">+</span> Subtasks
    </div>
    <div class="subtasks" style="display: none;">${subtaskHTML}</div>
  `;
  div.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', note.id);
  });

  const container = document.querySelector(`#${note.column_name.toLowerCase().replace(/\s/g, '')}`);
  if (container) container.appendChild(div);
}
function toggleSubtasks(toggleElement) {
  const subtasksDiv = toggleElement.nextElementSibling;
  const icon = toggleElement.querySelector('.toggle-icon');
  const isHidden = subtasksDiv.style.display === 'none';

  subtasksDiv.style.display = isHidden ? 'block' : 'none';
  icon.textContent = isHidden ? '−' : '+';
}

function handleSubtaskEnter(e, noteId) {
  if (e.key === 'Enter') {
    const input = e.target;
    const content = input.value.trim();
    if (!content) return;
    fetch('/kanbanku/subtask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note_id: noteId, content })
    })
    .then(res => res.json())
    .then(data => {
      const taskItem = document.createElement('div');
      taskItem.className = 'subtask-item';
      taskItem.dataset.id = data.id;
      taskItem.innerHTML = `
        <input type="checkbox" onchange="toggleCheckbox(${data.id}, this.checked)">
        <span class="content" contenteditable="true" onblur="editSubtask(${data.id}, this.innerText.trim())">${content}</span>
        <button onclick="deleteSubtask(${data.id}, this)">🗑</button>
      `;
      const container = input.closest('.note').querySelector('.subtasks');
      container.appendChild(taskItem);
      input.value = '';
    });
  }
}

function editSubtask(id, newContent) {
  fetch(`/kanbanku/subtask/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: newContent })
  });
}

function toggleCheckbox(id, completed) {
  fetch(`/kanbanku/subtask/check/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed })
  });
}

function deleteSubtask(id, button) {
  fetch(`/kanbanku/subtask/${id}`, {
    method: 'DELETE'
  })
  .then(() => {
    const item = button.closest('.subtask-item');
    if (item) item.remove();
  });
}

function deleteNote(noteId, noteElement) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  fetch(`/kanbanku/notes/${noteId}`, {
    method: 'DELETE'
  }).then(() => {
    noteElement.remove();
  });
}

function onDrop(e) {
  const id = e.dataTransfer.getData('text/plain');
  const newColumn = e.currentTarget;
  const columnName = newColumn.parentElement.dataset.column;

  fetch(`/kanbanku/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ column_name: columnName })
  })
  .then(() => {
    const note = document.querySelector(`.note[data-id='${id}']`);
    newColumn.appendChild(note);
  });
}
//tambahan
function loadUserList() {
  fetch('/kanbanku/users')
    .then(res => res.json())
    .then(users => {
      const list = document.getElementById('user-list');
      list.innerHTML = '';
      users.forEach(user => {
        const li = document.createElement('li');
        li.innerHTML = `
          <strong>${user.initial}</strong> - ${user.name}
          <button onclick="deleteUser('${user.initial}', this)"><img src="icon/cross.png" alt="Delete" class="delete-icon" /></button>
        `;
        li.style.marginBottom = '8px';
        list.appendChild(li);
      });
    });
}
function deleteUser(initial, button) {
  if (!confirm(`Delete user ${initial}? Semua notepad akan terhapus!`)) return;
  fetch(`/kanbanku/users/${initial}`, { method: 'DELETE' })
    .then(() => {
      location.reload(); // 🔄 halaman refresh otomatis
    });
}
