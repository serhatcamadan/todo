import './style.css';
import { loadAppState } from './logic.js';
import {
  renderProjects,
  renderTodos,
  bindDetailPanel,
  bindAddTodoModal,
  bindNewProjectModal,
} from './dom.js';

function init() {
  loadAppState();
  renderProjects();
  renderTodos();
  bindDetailPanel();
  bindAddTodoModal();
  bindNewProjectModal();
}

init();
