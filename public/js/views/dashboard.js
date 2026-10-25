/**
 * Dashboard View:
 * Event hero, countdown, readiness score gauge, quick stats,
 * upcoming critical milestones, and budget snapshot.
 */
import { getActiveEvent, getEvents, setActiveEvent, updateTaskStatus } from '../store.js';
import { formatCurrency, formatDate, getDaysRemaining, escapeHtml, showToast } from '../utils.js';
import { apiPost } from '../api.js';

export async function renderDashboard(container) {
  const event = getActiveEvent();
  if (!event) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎉</div>
        <h3>No Events Planned Yet</h3>
        <p>Get started by creating your first celebration plan with our AI assistant!</p>
        <a href="#/wizard" class="btn btn-primary btn-lg" style="margin-top: var(--sp-4);">Create Celebration Plan</a>
      </div>
    `;
    return;
  }

  const daysLeft = getDaysRemaining(event.date);
  const tasks = event.tasks || [];
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const criticalTasks = tasks.filter(t => t.urgency === 'critical');
  const pendingCritical = criticalTasks.filter(t => t.status !== 'completed').length;

  const budget = event.budget || {};
  const allocations = budget.allocations || [];
  const totalAllocated = allocations.reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalSpent = allocations.reduce((sum, a) => sum + (a.actualSpent || 0), 0);

  const vendors = event.vendors || [];
  const bookedVendors = vendors.filter(v => v.status === 'booked').length;

  // Compute readiness score from API or fallback client-side
  let readiness = { score: 0, timelineScore: 0, budgetScore: 0, vendorScore: 0, risks: [], nextActions: [] };
  try {
    const res = await apiPost('/api/plan/readiness', {
      tasks: tasks.map(t => ({ id: t.id, status: t.status, urgency: t.urgency, dueDate: t.dueDate })),
      budget: { total: event.totalBudget, spent: totalSpent },
      vendors: vendors.map(v => ({ status: v.status })),
      eventDate: event.date
    });
    readiness = res.readiness || readiness;
  } catch (err) {
    // Client fallback
    const tScore = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 50;
    const bScore = totalSpent <= event.totalBudget ? 90 : Math.max(20, Math.round(100 - ((totalSpent - event.totalBudget) / event.totalBudget) * 100));
    const vScore = vendors.length ? Math.round((bookedVendors / vendors.length) * 100) : 50;
    const overall = Math.round(tScore * 0.4 + bScore * 0.3 + vScore * 0.3);
    readiness = {
      score: overall,
      timelineScore: tScore,
      budgetScore: bScore,
      vendorScore: vScore,
      risks: pendingCritical > 0 ? [`${pendingCritical} critical task(s) still pending.`] : [],
      nextActions: tasks.filter(t => t.status !== 'completed').slice(0, 3).map(t => t.title)
    };
  }

  // Ring gauge calculation: circumference = 2 * PI * r = 2 * 3.14159 * 54 = 339.29
  const circumference = 339.29;
  const strokeOffset = circumference - (readiness.score / 100) * circumference;
  const scoreColor = readiness.score >= 75 ? 'var(--clr-success)' : (readiness.score >= 50 ? 'var(--clr-warning)' : 'var(--clr-danger)');

  container.innerHTML = `
    <!-- Hero Section -->
    <section class="hero" aria-labelledby="dashboard-title">
      <div style="display: flex; justify-content: center; gap: var(--sp-2); margin-bottom: var(--sp-2);">
        <span class="badge badge-primary">${escapeHtml(event.type.toUpperCase())}</span>
        <span class="badge badge-info">${escapeHtml(event.city)}</span>
        <span class="badge badge-warning">${daysLeft >= 0 ? `${daysLeft} Days to go!` : 'Event passed'}</span>
      </div>
      <h1 id="dashboard-title">${escapeHtml(event.title)}</h1>
      <p>📅 ${formatDate(event.date)} &bull; 👥 ${event.guestCount} Guests &bull; 💰 ${formatCurrency(event.totalBudget, event.currency)}</p>
      
      <div class="hero-actions">
        <a href="#/wizard" class="btn btn-secondary">✏️ Edit Event Details</a>
        <a href="#/chat" class="btn btn-primary">💬 Ask AI Assistant</a>
        <a href="#/ideas" class="btn btn-accent">💡 View AI Ideas</a>
        <a href="#/export" class="btn btn-secondary">🖨️ Export & Print</a>
      </div>
    </section>

    <!-- Top Grid: Readiness Gauge & Stat Cards -->
    <div class="grid grid-cols-3 section" style="align-items: stretch;">
      <!-- Readiness Score Card -->
      <div class="card card-highlight" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
        <h3 class="card-title" style="margin-bottom: var(--sp-3);">🎯 Event Readiness Score</h3>
        <div class="score-ring">
          <svg viewBox="0 0 120 120">
            <circle class="score-ring-bg" cx="60" cy="60" r="54"></circle>
            <circle class="score-ring-fill" cx="60" cy="60" r="54" 
              stroke="${scoreColor}" 
              stroke-dasharray="${circumference}" 
              stroke-dashoffset="${strokeOffset}">
            </circle>
          </svg>
          <div class="score-ring-text">
            <span class="score-number">${readiness.score}%</span>
            <span class="score-label">${readiness.score >= 80 ? 'Well Prepared' : (readiness.score >= 50 ? 'In Progress' : 'Needs Action')}</span>
          </div>
        </div>
        <div style="display: flex; gap: var(--sp-3); font-size: var(--fs-xs); color: var(--clr-text-muted); margin-top: var(--sp-2);">
          <span>Milestones: <strong>${readiness.timelineScore}%</strong></span>
          <span>Budget: <strong>${readiness.budgetScore}%</strong></span>
          <span>Vendors: <strong>${readiness.vendorScore}%</strong></span>
        </div>
      </div>

      <!-- Quick Metrics Grid (2 cols wide) -->
      <div style="grid-column: span 2; display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: var(--sp-4);">
        <div class="card stat-card">
          <div style="font-size: 1.8rem; margin-bottom: var(--sp-2);">💰</div>
          <div class="stat-number" title="${formatCurrency(totalSpent, event.currency)}">${formatCurrency(totalSpent, event.currency)}</div>
          <div class="stat-label">Spent of ${formatCurrency(event.totalBudget, event.currency)}</div>
          <div class="progress-bar" style="margin-top: var(--sp-3); width: 100%;">
            <div class="progress-fill ${totalSpent > event.totalBudget ? 'progress-danger' : 'progress-primary'}" 
                 style="width: ${Math.min(100, Math.round((totalSpent / (event.totalBudget || 1)) * 100))}%"></div>
          </div>
        </div>

        <div class="card stat-card">
          <div style="font-size: 1.8rem; margin-bottom: var(--sp-2);">✅</div>
          <div class="stat-number" title="${completedTasks} of ${tasks.length}">${completedTasks} / ${tasks.length}</div>
          <div class="stat-label">Milestone Tasks Done</div>
          <div class="progress-bar" style="margin-top: var(--sp-3); width: 100%;">
            <div class="progress-fill progress-success" 
                 style="width: ${tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0}%"></div>
          </div>
        </div>

        <div class="card stat-card">
          <div style="font-size: 1.8rem; margin-bottom: var(--sp-2);">🤝</div>
          <div class="stat-number" title="${bookedVendors} of ${vendors.length}">${bookedVendors} / ${vendors.length}</div>
          <div class="stat-label">Vendors Booked</div>
          <div class="progress-bar" style="margin-top: var(--sp-3); width: 100%;">
            <div class="progress-fill progress-primary" 
                 style="width: ${vendors.length ? Math.round((bookedVendors / vendors.length) * 100) : 0}%"></div>
          </div>
        </div>

        <div class="card stat-card">
          <div style="font-size: 1.8rem; margin-bottom: var(--sp-2);">⏳</div>
          <div class="stat-number">${Math.max(0, daysLeft)}</div>
          <div class="stat-label">Days to Celebration</div>
          <div style="font-size: var(--fs-xs); color: var(--clr-text-muted); margin-top: var(--sp-3);">
            Target: ${formatDate(event.date)}
          </div>
        </div>
      </div>
    </div>

    <!-- Alert Banners if any critical issues -->
    ${pendingCritical > 0 ? `
      <div class="alert alert-warning" role="alert">
        <span style="font-size: 1.4rem;">⚠️</span>
        <div>
          <strong>Attention Needed:</strong> You have <strong>${pendingCritical} critical task(s)</strong> that require immediate focus to keep planning on schedule.
        </div>
      </div>
    ` : ''}

    <!-- Middle Split: Next Priority Tasks & Top Spend Categories -->
    <div class="grid grid-cols-2 section">
      <!-- Upcoming Milestones -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📌 Priority Checklist</h3>
          <a href="#/timeline" class="btn btn-sm btn-secondary">View All (${tasks.length})</a>
        </div>
        <div class="task-list">
          ${tasks.length === 0 ? '<p class="text-muted">No tasks generated yet.</p>' : ''}
          ${tasks.slice(0, 5).map(task => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--sp-3) 0; border-bottom: 1px solid var(--clr-border);">
              <label style="display: flex; align-items: center; gap: var(--sp-3); cursor: pointer; flex: 1;">
                <input type="checkbox" class="task-toggle" data-id="${task.id}" ${task.status === 'completed' ? 'checked' : ''}>
                <div>
                  <div style="font-weight: var(--fw-medium); ${task.status === 'completed' ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
                    ${escapeHtml(task.title)}
                  </div>
                  <div style="font-size: var(--fs-xs); color: var(--clr-text-muted);">
                    ${task.dueDate ? `Due: ${formatDate(task.dueDate)} &bull; ` : ''}Category: ${escapeHtml(task.category)}
                  </div>
                </div>
              </label>
              <span class="badge ${task.urgency === 'critical' ? 'badge-danger' : (task.urgency === 'high' ? 'badge-warning' : 'badge-muted')}">
                ${task.urgency}
              </span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Budget Snapshot -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📊 Budget Breakdown</h3>
          <a href="#/budget" class="btn btn-sm btn-secondary">Manage Budget</a>
        </div>
        <div>
          ${allocations.length === 0 ? '<p class="text-muted">No budget allocations yet.</p>' : ''}
          ${allocations.slice(0, 5).map(item => {
            const pct = Math.round(((item.actualSpent || 0) / (item.amount || 1)) * 100);
            return `
              <div class="budget-bar">
                <span class="budget-bar-label">${escapeHtml(item.category)}</span>
                <div class="budget-bar-track" title="${formatCurrency(item.actualSpent || 0, event.currency)} spent of ${formatCurrency(item.amount, event.currency)}">
                  <div class="budget-bar-fill ${pct > 100 ? 'progress-danger' : 'progress-primary'}" style="width: ${Math.min(100, Math.max(12, pct))}%">
                    ${pct}%
                  </div>
                </div>
                <span class="budget-bar-amount">${formatCurrency(item.amount, event.currency)}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- Bottom Action Cards -->
    <div class="grid grid-cols-3 section">
      <div class="card" style="text-align: center;">
        <h3>💡 AI Event Ideas</h3>
        <p style="font-size: var(--fs-sm); color: var(--clr-text-muted); margin: var(--sp-2) 0 var(--sp-4);">
          Themes, curated menu matching ${event.dietary?.join(', ') || 'all diets'}, entertainment & run of show.
        </p>
        <a href="#/ideas" class="btn btn-accent btn-sm">Explore Ideas &rarr;</a>
      </div>

      <div class="card" style="text-align: center;">
        <h3>🤝 Vendor Directory</h3>
        <p style="font-size: var(--fs-sm); color: var(--clr-text-muted); margin: var(--sp-2) 0 var(--sp-4);">
          Track quotes, contracts, and statuses across ${vendors.length} vendors for smooth coordination.
        </p>
        <a href="#/vendors" class="btn btn-secondary btn-sm">Manage Vendors &rarr;</a>
      </div>

      <div class="card" style="text-align: center;">
        <h3>💬 AI Planning Chat</h3>
        <p style="font-size: var(--fs-sm); color: var(--clr-text-muted); margin: var(--sp-2) 0 var(--sp-4);">
          Ask anything: budget optimization, rain backup plans, RSVP headcount tips, or custom timelines.
        </p>
        <a href="#/chat" class="btn btn-primary btn-sm">Chat Now &rarr;</a>
      </div>
    </div>
  `;

  // Attach task checkbox toggles
  container.querySelectorAll('.task-toggle').forEach(input => {
    input.addEventListener('change', (e) => {
      const taskId = e.target.getAttribute('data-id');
      const newStatus = e.target.checked ? 'completed' : 'pending';
      updateTaskStatus(taskId, newStatus);
      showToast(newStatus === 'completed' ? 'Task marked complete!' : 'Task reopened', 'success', 2000);
      renderDashboard(container);
    });
  });
}
