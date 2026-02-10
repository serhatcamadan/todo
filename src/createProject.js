function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createProject(name = 'New Project') {
  return {
    id: generateId(),
    name,
    todos: [],
  };
}
