import { createTodo } from './createTodo.js';
import { createProject } from './createProject.js';
import {
  getProjects,
  getProject,
  getCurrentProjectId,
  setState,
  setCurrentProjectId,
  initDefaultState,
} from './state.js';
import { saveToStorage, loadFromStorage } from './storage.js';

function persist() {
  const projects = getProjects();
  const currentProjectId = getCurrentProjectId();
  saveToStorage(projects, currentProjectId);
}

export function addTodo(projectId, todoData) {
  const project = getProject(projectId);
  if (!project) return null;
  const todo = createTodo(todoData);
  project.todos.push(todo);
  persist();
  return todo;
}

export function deleteTodo(projectId, todoId) {
  const project = getProject(projectId);
  if (!project) return false;
  const idx = project.todos.findIndex((t) => t.id === todoId);
  if (idx === -1) return false;
  project.todos.splice(idx, 1);
  persist();
  return true;
}

export function updateTodo(projectId, todoId, updates) {
  const project = getProject(projectId);
  if (!project) return null;
  const todo = project.todos.find((t) => t.id === todoId);
  if (!todo) return null;
  Object.assign(todo, updates);
  if (updates.checklist !== undefined) {
    todo.checklist = updates.checklist;
  }
  persist();
  return todo;
}

export function addProject(name) {
  const project = createProject(name || 'New Project');
  const projects = getProjects();
  projects.push(project);
  persist();
  return project;
}

export function deleteProject(projectId) {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx === -1) return false;
  projects.splice(idx, 1);
  const currentId = getCurrentProjectId();
  if (currentId === projectId) {
    const next = projects[0];
    setCurrentProjectId(next?.id ?? null);
  }
  persist();
  return true;
}

export function setCurrentProject(id) {
  setCurrentProjectId(id);
  persist();
}

export function loadAppState() {
  const data = loadFromStorage();
  if (data && Array.isArray(data.projects) && data.projects.length > 0) {
    setState(data.projects, data.currentProjectId ?? data.projects[0].id);
  } else {
    initDefaultState();
  }
  persist();
}
