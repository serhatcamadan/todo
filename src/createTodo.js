function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createTodo({
  title = '',
  description = '',
  dueDate = '',
  priority = 'medium',
  completed = false,
  notes = '',
  checklist = [],
} = {}) {
  return {
    id: generateId(),
    title,
    description,
    dueDate,
    priority,
    completed,
    notes,
    checklist: checklist.map((item) =>
      typeof item === 'string'
        ? { id: generateId(), text: item, done: false }
        : { id: item.id || generateId(), text: item.text || '', done: item.done || false }
    ),
  };
}
