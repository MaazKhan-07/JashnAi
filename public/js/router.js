/**
 * Client-side hash router for Jashn SPA.
 */
import { renderDashboard } from './views/dashboard.js';
import { renderWizard } from './views/wizard.js';
import { renderBudget } from './views/budget.js';
import { renderTimeline } from './views/timeline.js';
import { renderVendors } from './views/vendors.js';
import { renderIdeas } from './views/ideas.js';
import { renderChat } from './views/chat.js';
import { renderExport } from './views/export.js';

export const ROUTES = [
  { path: '#/dashboard', label: 'Dashboard', icon: '📊', render: renderDashboard },
  { path: '#/budget', label: 'Budget', icon: '💰', render: renderBudget },
  { path: '#/timeline', label: 'Timeline', icon: '📅', render: renderTimeline },
  { path: '#/vendors', label: 'Vendors', icon: '🤝', render: renderVendors },
  { path: '#/ideas', label: 'AI Ideas', icon: '💡', render: renderIdeas },
  { path: '#/chat', label: 'AI Assistant', icon: '💬', render: renderChat },
  { path: '#/wizard', label: 'New Plan', icon: '✨', render: renderWizard },
  { path: '#/export', label: 'Export', icon: '🖨️', render: renderExport }
];

export function initNav() {
  const navList = document.getElementById('nav-list');
  if (!navList) return;

  navList.innerHTML = ROUTES.map(r => `
    <li>
      <a href="${r.path}" class="nav-link" data-path="${r.path}">
        <span aria-hidden="true">${r.icon}</span>
        <span>${r.label}</span>
      </a>
    </li>
  `).join('');
}

export async function navigate() {
  let hash = window.location.hash || '#/dashboard';
  if (hash === '#/' || hash === '#') hash = '#/dashboard';

  const route = ROUTES.find(r => r.path === hash) || ROUTES[0];
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  // Update navigation active states
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('data-path') === route.path) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Render view
  try {
    await route.render(appContainer);
  } catch (err) {
    console.error('[Router] Error rendering view:', err);
    appContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Rendering Error</h3>
        <p>${err.message}</p>
        <a href="#/dashboard" class="btn btn-primary">Return to Dashboard</a>
      </div>
    `;
  }
}
