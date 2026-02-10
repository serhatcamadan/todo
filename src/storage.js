const STORAGE_KEY = 'todoApp';

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveToStorage(projects, currentProjectId) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ projects, currentProjectId })
    );
  } catch (e) {
    console.warn('Could not save to localStorage', e);
  }
}
