/**
 * Timeline & Checklist View:
 * Milestone tracking, fast-track compression mode, status toggles,
 * task filtering, calendar export (.ics), and task creation.
 */
import { getActiveEvent, updateTaskStatus, addTask, deleteTask, updateActiveEvent } from '../store.js';
import { formatDate, getDaysRemaining, escapeHtml, showToast, showLoading, generateICS, downloadFile } from '../utils.js';
import { apiPost } from '../api.js';

export function renderTimeline(container) {
  const event = getActiveEvent();
  if (!event) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <h3>No Event Selected</h3>
        <p>Please create or select an event to view its milestone timeline.</p>
        <a href="#/wizard" class="btn btn-primary">Create Event</a>
      </div>
    `;
    return;
  }

  const tasks = event.tasks || [];
  const daysLeft = getDaysRemaining(event.date);
  const isFastTrack = daysLeft < 30;

  const categories = Array.from(new Set(tasks.map(t => t.category).filter(Boolean)));

  // Filter state
  let currentStatusFilter = 'all';
  let currentUrgencyFilter = 'all';
  let currentCategoryFilter = 'all';

  function renderTaskList() {
    const listEl = container.querySelector('#timeline-task-list');
    if (!listEl) return;

    const filtered = tasks.filter(t => {
      if (currentStatusFilter !== 'all' && t.status !== currentStatusFilter) return false;
      if (currentUrgencyFilter !== 'all' && t.urgency !== currentUrgencyFilter) return false;
      if (currentCategoryFilter !== 'all' && t.category !== currentCategoryFilter) return false;
      return true;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="padding: var(--sp-8);">
          <p>No milestone tasks match the selected filter criteria.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(t => {
      const isCompleted = t.status === 'completed';
      const isInProgress = t.status === 'in_progress';
      const isOverdue = t.dueDate && getDaysRemaining(t.dueDate) < 0 && !isCompleted;

      return `
        <div class="card card-sm" style="margin-bottom: var(--sp-3); ${isCompleted ? 'opacity: 0.7; background: var(--clr-surface-alt);' : ''} ${isOverdue ? 'border-left: 4px solid var(--clr-danger);' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--sp-3); flex-wrap: wrap;">
            
            <div style="display: flex; align-items: flex-start; gap: var(--sp-3); flex: 1;">
              <input type="checkbox" class="task-checkbox" data-id="${t.id}" ${isCompleted ? 'checked' : ''} style="margin-top: 4px;" aria-label="Mark completed">
              <div>
                <h4 style="font-size: var(--fs-base); font-weight: var(--fw-semibold); ${isCompleted ? 'text-decoration: line-through;' : ''}">
                  ${escapeHtml(t.title)}
                </h4>
                ${t.notes ? `<p style="font-size: var(--fs-xs); color: var(--clr-text-muted); margin-top: var(--sp-1);">${escapeHtml(t.notes)}</p>` : ''}
                
                <div style="display: flex; gap: var(--sp-2); align-items: center; margin-top: var(--sp-2); flex-wrap: wrap;">
                  <span class="badge badge-muted">📁 ${escapeHtml(t.category || 'General')}</span>
                  ${t.dueDate ? `
                    <span class="badge ${isOverdue ? 'badge-danger' : 'badge-info'}">
                      📅 Due: ${formatDate(t.dueDate)} ${isOverdue ? '(Overdue!)' : ''}
                    </span>
                  ` : ''}
                </div>
              </div>
            </div>

            <!-- Status and Actions -->
            <div style="display: flex; align-items: center; gap: var(--sp-2);">
              <span class="badge ${t.urgency === 'critical' ? 'badge-danger' : (t.urgency === 'high' ? 'badge-warning' : 'badge-muted')}">
                ${t.urgency || 'medium'}
              </span>

              <select class="form-select task-status-select" data-id="${t.id}" style="min-height: 36px; padding: var(--sp-1) var(--sp-2); font-size: var(--fs-xs); width: auto;">
                <option value="pending" ${t.status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
                <option value="in_progress" ${t.status === 'in_progress' ? 'selected' : ''}>🔄 In Progress</option>
                <option value="completed" ${t.status === 'completed' ? 'selected' : ''}>✅ Done</option>
              </select>

              <button class="btn btn-icon delete-task-btn" data-id="${t.id}" title="Delete task" aria-label="Delete ${escapeHtml(t.title)}">
                🗑️
              </button>
            </div>

          </div>
        </div>
      `;
    }).join('');

    // Attach listeners
    listEl.querySelectorAll('.task-checkbox').forEach(box => {
      box.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const newStatus = e.target.checked ? 'completed' : 'pending';
        updateTaskStatus(id, newStatus);
        showToast(newStatus === 'completed' ? 'Task completed! 🎉' : 'Task reopened');
        renderTimeline(container);
      });
    });

    listEl.querySelectorAll('.task-status-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        updateTaskStatus(id, e.target.value);
        showToast('Status updated');
        renderTimeline(container);
      });
    });

    listEl.querySelectorAll('.delete-task-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this task?')) {
          deleteTask(id);
          showToast('Task deleted');
          renderTimeline(container);
        }
      });
    });
  }

  container.innerHTML = `
    <div class="section">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--sp-4); flex-wrap: wrap; gap: var(--sp-3);">
        <div>
          <h1>📅 Milestone Timeline & Checklist</h1>
          <p style="color: var(--clr-text-muted);">
            Chronological roadmap for <strong>${escapeHtml(event.title)}</strong> (${tasks.filter(t => t.status === 'completed').length} of ${tasks.length} completed).
          </p>
        </div>
        <div style="display: flex; gap: var(--sp-2); flex-wrap: wrap;">
          <button id="export-ics-btn" class="btn btn-secondary btn-sm" title="Download iCalendar format">
            📥 Export to .ICS Calendar
          </button>
          <button id="recalc-timeline-btn" class="btn btn-accent btn-sm">
            ✨ Regenerate with AI
          </button>
          <button id="add-task-btn" class="btn btn-primary btn-sm">
            ➕ Add Task
          </button>
        </div>
      </div>

      ${isFastTrack ? `
        <div class="alert alert-warning" role="alert">
          <span style="font-size: 1.4rem;">⚡</span>
          <div>
            <strong>Fast-Track Timeline Active:</strong> Event is only <strong>${daysLeft} days away</strong>. 
            Lead times have been compressed and critical milestones have been prioritized for rapid execution.
          </div>
        </div>
      ` : ''}

      <!-- Filter Controls Bar -->
      <div class="filter-bar card card-sm" style="margin-bottom: var(--sp-4); display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; gap: var(--sp-3); flex-wrap: wrap; align-items: center;">
          <label style="font-size: var(--fs-xs); font-weight: var(--fw-medium);">Status:</label>
          <select id="filter-status">
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <label style="font-size: var(--fs-xs); font-weight: var(--fw-medium);">Urgency:</label>
          <select id="filter-urgency">
            <option value="all">All Urgencies</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <label style="font-size: var(--fs-xs); font-weight: var(--fw-medium);">Category:</label>
          <select id="filter-category">
            <option value="all">All Categories</option>
            ${categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Task List Container -->
      <div id="timeline-task-list"></div>
    </div>

    <!-- Add Task Modal -->
    <div id="add-task-modal" class="modal-backdrop" style="display: none;">
      <div class="modal" role="dialog" aria-labelledby="modal-task-title">
        <div class="modal-header">
          <h3 id="modal-task-title">➕ Add Milestone Task</h3>
          <button class="btn btn-icon close-modal-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label" for="task-title-input">Task Title *</label>
            <input type="text" id="task-title-input" class="form-input" placeholder="e.g., Finalize floral centerpieces and entrance arch">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="task-category-input">Category *</label>
              <input type="text" id="task-category-input" class="form-input" placeholder="e.g. Decor, Catering, Attire" value="Decor">
            </div>
            <div class="form-group">
              <label class="form-label" for="task-urgency-input">Urgency *</label>
              <select id="task-urgency-input" class="form-select">
                <option value="critical">🔴 Critical</option>
                <option value="high" selected>🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="task-date-input">Due Date</label>
            <input type="date" id="task-date-input" class="form-input" max="${event.date}">
          </div>
          <div class="form-group">
            <label class="form-label" for="task-notes-input">Notes & Instructions</label>
            <textarea id="task-notes-input" class="form-textarea" placeholder="Specific contacts, checklist items, or guidelines"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary close-modal-btn">Cancel</button>
          <button class="btn btn-primary" id="save-task-btn">Add Task</button>
        </div>
      </div>
    </div>
  `;

  renderTaskList();

  // Filter change handlers
  container.querySelector('#filter-status').addEventListener('change', (e) => {
    currentStatusFilter = e.target.value;
    renderTaskList();
  });
  container.querySelector('#filter-urgency').addEventListener('change', (e) => {
    currentUrgencyFilter = e.target.value;
    renderTaskList();
  });
  container.querySelector('#filter-category').addEventListener('change', (e) => {
    currentCategoryFilter = e.target.value;
    renderTaskList();
  });

  // Export ICS
  container.querySelector('#export-ics-btn').addEventListener('click', () => {
    const icsContent = generateICS(event);
    const filename = `${event.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_schedule.ics`;
    downloadFile(filename, icsContent, 'text/calendar');
    showToast('📅 Calendar (.ics) downloaded!', 'success');
  });

  // Modal handlers
  const modal = container.querySelector('#add-task-modal');
  container.querySelector('#add-task-btn').addEventListener('click', () => {
    modal.style.display = 'flex';
  });
  container.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  });

  container.querySelector('#save-task-btn').addEventListener('click', () => {
    const title = container.querySelector('#task-title-input').value.trim();
    const category = container.querySelector('#task-category-input').value.trim() || 'General';
    const urgency = container.querySelector('#task-urgency-input').value;
    const dueDate = container.querySelector('#task-date-input').value;
    const notes = container.querySelector('#task-notes-input').value.trim();

    if (!title) {
      showToast('Please enter a task title', 'error');
      return;
    }

    addTask({ title, category, urgency, dueDate, notes });
    modal.style.display = 'none';
    showToast('Milestone task added!', 'success');
    renderTimeline(container);
  });

  // AI Regenerate
  container.querySelector('#recalc-timeline-btn').addEventListener('click', async () => {
    showLoading(true, 'AI is regenerating optimal event timeline milestones...');
    try {
      const res = await apiPost('/api/plan/timeline', {
        eventType: event.type,
        eventDate: event.date
      });

      updateActiveEvent(ev => {
        ev.tasks = (res.tasks || []).map(t => ({
          ...t,
          status: 'pending'
        }));
      });

      showLoading(false);
      showToast('✨ Timeline regenerated with AI milestones!', 'success');
      renderTimeline(container);
    } catch (err) {
      showLoading(false);
      showToast(`Regeneration error: ${err.message}`, 'error');
    }
  });
}
