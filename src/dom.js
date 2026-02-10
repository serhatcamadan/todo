import { format, parseISO, isValid } from 'date-fns';
import {
  getProjects,
  getCurrentProjectId,
  getProject,
  getCurrentProject,
  getTodos,
} from './state.js';
import * as logic from './logic.js';

const PRIORITY_COLORS = {
  low: 'priority-low',
  medium: 'priority-medium',
  high: 'priority-high',
};

function formatDueDate(dateStr) {
  if (!dateStr) return 'No date';
  const d = typeof dateStr === 'string' && dateStr.includes('T') ? parseISO(dateStr) : new Date(dateStr);
  return isValid(d) ? format(d, 'MMM d, yyyy') : dateStr;
}

export function renderProjects() {
  const container = document.querySelector('.projects-list');
  if (!container) return;
  const projects = getProjects();
  const currentId = getCurrentProjectId();
  container.innerHTML = projects
    .map(
      (p) => `
    <button type="button" class="project-item ${p.id === currentId ? 'active' : ''}" data-project-id="${p.id}">
      ${escapeHtml(p.name)}
    </button>
  `
    )
    .join('');

  container.querySelectorAll('.project-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      logic.setCurrentProject(btn.dataset.projectId);
      renderProjects();
      renderTodos();
    });
  });
}

export function renderTodos() {
  const list = document.querySelector('.main .todo-list');
  const headerName = document.querySelector('.current-project-name');
  if (!list) return;

  const project = getCurrentProject();
  if (!project) {
    headerName.textContent = 'No project';
    list.innerHTML = '<li class="empty-state">Select or create a project.</li>';
    return;
  }

  headerName.textContent = project.name;
  const todos = getTodos(project.id);

  if (todos.length === 0) {
    list.innerHTML = '<li class="empty-state">No todos yet. Add one!</li>';
    return;
  }

  list.innerHTML = todos
    .map(
      (t) => `
    <li class="todo-item ${t.completed ? 'completed' : ''} ${PRIORITY_COLORS[t.priority] || ''}" data-todo-id="${t.id}">
      <label class="todo-row">
        <input type="checkbox" class="todo-checkbox" ${t.completed ? 'checked' : ''} aria-label="Toggle complete">
        <span class="todo-title">${escapeHtml(t.title)}</span>
        <span class="todo-due">${formatDueDate(t.dueDate)}</span>
        <button type="button" class="btn btn-expand-todo" aria-label="View details">⋯</button>
      </label>
    </li>
  `
    )
    .join('');

  list.querySelectorAll('.todo-item').forEach((li) => {
    const todoId = li.dataset.todoId;
    const checkbox = li.querySelector('.todo-checkbox');
    const expandBtn = li.querySelector('.btn-expand-todo');

    checkbox.addEventListener('change', () => {
      const todo = project.todos.find((t) => t.id === todoId);
      if (todo) {
        logic.updateTodo(project.id, todoId, { completed: checkbox.checked });
        renderTodos();
      }
    });

    expandBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openTodoDetail(project.id, todoId);
    });

    li.querySelectorAll('.todo-title, .todo-due').forEach((el) => {
      el.addEventListener('click', () => openTodoDetail(project.id, todoId));
    });
  });
}

let editingProjectId = null;
let editingTodoId = null;

function openTodoDetail(projectId, todoId) {
  const project = getProject(projectId);
  const todo = project?.todos.find((t) => t.id === todoId);
  if (!todo) return;

  editingProjectId = projectId;
  editingTodoId = todoId;

  const overlay = document.getElementById('todo-detail-overlay');
  const form = overlay.querySelector('.todo-detail-form');
  form.querySelector('[name="title"]').value = todo.title;
  form.querySelector('[name="description"]').value = todo.description || '';
  form.querySelector('[name="dueDate"]').value = todo.dueDate ? (todo.dueDate.slice ? todo.dueDate.slice(0, 10) : new Date(todo.dueDate).toISOString().slice(0, 10)) : '';
  form.querySelector('[name="priority"]').value = todo.priority || 'medium';
  form.querySelector('[name="notes"]').value = todo.notes || '';

  const checklistList = overlay.querySelector('.checklist-list');
  checklistList.innerHTML = (todo.checklist || [])
    .map(
      (item) => `
    <li class="checklist-item" data-item-id="${item.id}">
      <label>
        <input type="checkbox" ${item.done ? 'checked' : ''}>
        <span>${escapeHtml(item.text)}</span>
      </label>
      <button type="button" class="btn btn-remove-checklist-item" aria-label="Remove">×</button>
    </li>
  `
    )
    .join('');

  overlay.querySelectorAll('.checklist-item').forEach((li) => {
    const itemId = li.dataset.itemId;
    li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
      const list = todo.checklist || [];
      const item = list.find((i) => i.id === itemId);
      if (item) {
        item.done = e.target.checked;
        logic.updateTodo(projectId, todoId, { checklist: [...list] });
      }
    });
    li.querySelector('.btn-remove-checklist-item').addEventListener('click', () => {
      const list = (todo.checklist || []).filter((i) => i.id !== itemId);
      logic.updateTodo(projectId, todoId, { checklist: list });
      openTodoDetail(projectId, todoId);
    });
  });

  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('open');
}

function closeTodoDetail() {
  const overlay = document.getElementById('todo-detail-overlay');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.classList.remove('open');
  editingProjectId = null;
  editingTodoId = null;
}

function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function bindDetailPanel() {
  const overlay = document.getElementById('todo-detail-overlay');
  const form = overlay.querySelector('.todo-detail-form');
  const closeBtn = overlay.querySelector('.btn-close-detail');
  const deleteBtn = overlay.querySelector('.btn-delete-todo');
  const checklistInput = overlay.querySelector('.checklist-input');
  const addChecklistBtn = overlay.querySelector('.btn-add-checklist-item');
  const checklistList = overlay.querySelector('.checklist-list');

  closeBtn.addEventListener('click', () => {
    closeTodoDetail();
    renderTodos();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeTodoDetail();
      renderTodos();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!editingProjectId || !editingTodoId) return;
    const fd = new FormData(form);
    const dueDate = fd.get('dueDate') || '';
    logic.updateTodo(editingProjectId, editingTodoId, {
      title: fd.get('title'),
      description: fd.get('description'),
      dueDate,
      priority: fd.get('priority'),
      notes: fd.get('notes'),
    });
    closeTodoDetail();
    renderTodos();
  });

  deleteBtn.addEventListener('click', () => {
    if (!editingProjectId || !editingTodoId) return;
    if (confirm('Delete this todo?')) {
      logic.deleteTodo(editingProjectId, editingTodoId);
      closeTodoDetail();
      renderTodos();
      renderProjects();
    }
  });

  function addChecklistItem() {
    const text = checklistInput?.value?.trim();
    if (!text || !editingProjectId || !editingTodoId) return;
    const project = getProject(editingProjectId);
    const todo = project?.todos.find((t) => t.id === editingTodoId);
    if (!todo) return;
    const prev = todo.checklist || [];
    const newChecklist = [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, text, done: false }];
    logic.updateTodo(editingProjectId, editingTodoId, { checklist: newChecklist });
    checklistInput.value = '';
    openTodoDetail(editingProjectId, editingTodoId);
  }

  addChecklistBtn?.addEventListener('click', addChecklistItem);
  checklistInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addChecklistItem();
    }
  });
}

export function bindAddTodoModal() {
  const modal = document.getElementById('add-todo-modal');
  const form = modal.querySelector('.add-todo-form');
  const openBtn = document.querySelector('.btn-add-todo');
  const cancelBtn = modal.querySelector('.btn-cancel');

  openBtn.addEventListener('click', () => {
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('open');
    form.reset();
    form.querySelector('[name="priority"]').value = 'medium';
  });

  cancelBtn.addEventListener('click', () => {
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('open');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.setAttribute('aria-hidden', 'true');
      modal.classList.remove('open');
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const projectId = getCurrentProjectId();
    if (!projectId) return;
    const fd = new FormData(form);
    logic.addTodo(projectId, {
      title: fd.get('title'),
      dueDate: fd.get('dueDate') || '',
      priority: fd.get('priority') || 'medium',
    });
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('open');
    renderTodos();
    renderProjects();
  });
}

export function bindNewProjectModal() {
  const modal = document.getElementById('new-project-modal');
  const form = modal.querySelector('.new-project-form');
  const openBtn = document.querySelector('.btn-new-project');
  const cancelBtn = modal.querySelector('.btn-cancel');

  openBtn.addEventListener('click', () => {
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('open');
    form.reset();
  });

  cancelBtn.addEventListener('click', () => {
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('open');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.setAttribute('aria-hidden', 'true');
      modal.classList.remove('open');
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = fd.get('name')?.trim() || 'New Project';
    const project = logic.addProject(name);
    logic.setCurrentProject(project.id);
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('open');
    renderProjects();
    renderTodos();
  });
}
