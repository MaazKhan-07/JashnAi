/**
 * Main application entry point for Jashn.
 */
import { initNav, navigate } from './router.js';
import { getEvents, getActiveEvent, setActiveEvent, resetToSeed } from './store.js';
import { showToast, escapeHtml, showLoading } from './utils.js';

function getEventIcon(type) {
  switch (type) {
    case 'wedding': return '💍';
    case 'birthday': return '🎂';
    case 'community': return '🏘️';
    case 'anniversary': return '🥂';
    case 'corporate': return '🏢';
    default: return '🎉';
  }
}

function renderEventSwitcher() {
  const container = document.getElementById('event-switcher');
  if (!container) return;

  const events = getEvents();
  const active = getActiveEvent();

  if (events.length === 0) {
    container.innerHTML = '';
    return;
  }

  const icon = getEventIcon(active?.type);

  container.innerHTML = `
    <div class="event-switcher-btn" title="Current: ${escapeHtml(active?.title || 'Celebration')} (Click to switch)">
      <span class="event-switcher-icon" aria-hidden="true">${icon}</span>
      <span class="event-switcher-caret" aria-hidden="true">▼</span>
      <select id="event-select" class="event-select-native" aria-label="Select active celebration">
        ${events.map(e => `
          <option value="${e.id}" ${e.id === active?.id ? 'selected' : ''}>
            ${getEventIcon(e.type)} ${escapeHtml(e.title)}
          </option>
        `).join('')}
      </select>
    </div>
  `;

  const select = container.querySelector('#event-select');
  select.addEventListener('change', (e) => {
    setActiveEvent(e.target.value);
    const updated = getActiveEvent();
    showToast(`Switched to: ${updated.title}`, 'info', 2000);
    renderEventSwitcher();
    navigate();
  });
}

function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  const currentTheme = localStorage.getItem('jashn_theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  toggleBtn.addEventListener('click', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('jashn_theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  const iconSpan = document.querySelector('#theme-toggle .theme-icon');
  if (iconSpan) {
    iconSpan.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

function initResetButton() {
  const resetBtn = document.getElementById('reset-demo-btn');
  if (!resetBtn) return;

  resetBtn.addEventListener('click', () => {
    if (confirm('Reset celebration demo data to factory defaults? Any custom edits will be replaced.')) {
      resetToSeed();
      renderEventSwitcher();
      showToast('Demo data reset to defaults!', 'success');
      navigate();
    }
  });
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  // Ensure loading overlay is dismissed immediately
  showLoading(false);

  initThemeToggle();
  initNav();
  renderEventSwitcher();
  initResetButton();

  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    showLoading(false);
    renderEventSwitcher();
    navigate();
  });

  // Initial render
  navigate();
});
