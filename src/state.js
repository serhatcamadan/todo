import { createProject } from './createProject.js';

const DEFAULT_PROJECT_NAME = 'Inbox';

let projects = [];
let currentProjectId = null;

export function getProjects() {
  return projects;
}

export function getCurrentProjectId() {
  return currentProjectId;
}

export function getProject(id) {
  return projects.find((p) => p.id === id) ?? null;
}

export function getCurrentProject() {
  if (!currentProjectId) return null;
  return getProject(currentProjectId);
}

export function getTodos(projectId) {
  const project = getProject(projectId);
  return project ? project.todos : [];
}

export function setState(newProjects, newCurrentProjectId) {
  projects = Array.isArray(newProjects) ? newProjects : [];
  currentProjectId = newCurrentProjectId ?? (projects[0]?.id ?? null);
}

export function setCurrentProjectId(id) {
  if (getProject(id)) {
    currentProjectId = id;
  }
}

export function initDefaultState() {
  if (projects.length === 0) {
    const inbox = createProject(DEFAULT_PROJECT_NAME);
    projects = [inbox];
    currentProjectId = inbox.id;
  }
  return { projects, currentProjectId };
}
