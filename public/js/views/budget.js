/**
 * Budget Planner View:
 * Allocation charts, editable actual expenses, contingency calculation,
 * per-guest spend, and AI budget recalculation.
 */
import { getActiveEvent, updateBudgetExpense, updateActiveEvent } from '../store.js';
import { formatCurrency, escapeHtml, showToast, showLoading } from '../utils.js';
import { apiPost } from '../api.js';

export function renderBudget(container) {
  const event = getActiveEvent();
  if (!event) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💰</div>
        <h3>No Event Selected</h3>
        <p>Please create or select an event to manage its budget.</p>
        <a href="#/wizard" class="btn btn-primary">Create Event</a>
      </div>
    `;
    return;
  }

  const budget = event.budget || {};
  const allocations = budget.allocations || [];
  const currency = event.currency || 'INR';
  const totalBudget = Number(event.totalBudget) || 0;
  const guestCount = Number(event.guestCount) || 1;

  const totalAllocated = allocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const totalSpent = allocations.reduce((sum, a) => sum + (Number(a.actualSpent) || 0), 0);
  const remaining = totalBudget - totalSpent;
  const perGuestSpent = Math.round(totalSpent / guestCount);
  const perGuestBudget = Math.round(totalBudget / guestCount);

  const isOverBudget = totalSpent > totalBudget;

  container.innerHTML = `
    <div class="section">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--sp-4); flex-wrap: wrap; gap: var(--sp-3);">
        <div>
          <h1>💰 Budget Planner</h1>
          <p style="color: var(--clr-text-muted);">
            AI-optimized allocations for <strong>${escapeHtml(event.title)}</strong> (${event.guestCount} guests).
          </p>
        </div>
        <div style="display: flex; gap: var(--sp-2);">
          <button id="recalc-budget-btn" class="btn btn-accent btn-sm">
            ✨ Recalculate with AI
          </button>
          <button id="add-category-btn" class="btn btn-primary btn-sm">
            ➕ Add Category
          </button>
        </div>
      </div>

      <!-- Financial Summary Cards -->
      <div class="grid grid-cols-4" style="margin-bottom: var(--sp-6);">
        <div class="card stat-card">
          <div class="stat-label">Total Planned Budget</div>
          <div class="stat-number" style="font-size: var(--fs-xl); color: var(--clr-text);">${formatCurrency(totalBudget, currency)}</div>
          <div style="font-size: var(--fs-xs); color: var(--clr-text-muted); margin-top: var(--sp-1);">${formatCurrency(perGuestBudget, currency)} / guest</div>
        </div>

        <div class="card stat-card">
          <div class="stat-label">Total Allocated</div>
          <div class="stat-number" style="font-size: var(--fs-xl); color: var(--clr-info);">${formatCurrency(totalAllocated, currency)}</div>
          <div style="font-size: var(--fs-xs); color: var(--clr-text-muted); margin-top: var(--sp-1);">${Math.round((totalAllocated / (totalBudget || 1)) * 100)}% of target</div>
        </div>

        <div class="card stat-card">
          <div class="stat-label">Actual Spent</div>
          <div class="stat-number" style="font-size: var(--fs-xl); color: ${isOverBudget ? 'var(--clr-danger)' : 'var(--clr-primary)'};">
            ${formatCurrency(totalSpent, currency)}
          </div>
          <div style="font-size: var(--fs-xs); color: var(--clr-text-muted); margin-top: var(--sp-1);">${formatCurrency(perGuestSpent, currency)} spent / guest</div>
        </div>

        <div class="card stat-card">
          <div class="stat-label">Remaining Balance</div>
          <div class="stat-number" style="font-size: var(--fs-xl); color: ${remaining >= 0 ? 'var(--clr-success)' : 'var(--clr-danger)'};">
            ${formatCurrency(remaining, currency)}
          </div>
          <div style="font-size: var(--fs-xs); color: var(--clr-text-muted); margin-top: var(--sp-1);">
            ${remaining >= 0 ? 'Under control' : '⚠️ Exceeded budget!'}
          </div>
        </div>
      </div>

      <!-- Alert if over budget or tight budget -->
      ${isOverBudget ? `
        <div class="alert alert-danger" role="alert">
          <span>⚠️</span>
          <div>
            <strong>Budget Alert:</strong> You have exceeded the total target budget by 
            <strong>${formatCurrency(Math.abs(remaining), currency)}</strong>. Consider shifting funds from lower priority categories or contingency buffer.
          </div>
        </div>
      ` : ''}

      ${budget.tightBudget ? `
        <div class="alert alert-warning" role="alert">
          <span>💡</span>
          <div>
            <strong>AI Optimization Note:</strong> Per-head budget is lean. We boosted catering and venue essentials while consolidating non-critical decor and favors to maximize celebration value.
          </div>
        </div>
      ` : ''}

      <!-- Visual Allocation Progress Bars -->
      <div class="card" style="margin-bottom: var(--sp-6);">
        <h3 class="card-title" style="margin-bottom: var(--sp-4);">📊 Visual Distribution & Progress</h3>
        <div>
          ${allocations.map((item, idx) => {
            const spent = Number(item.actualSpent) || 0;
            const allocated = Number(item.amount) || 1;
            const pct = Math.round((spent / allocated) * 100);
            return `
              <div class="budget-bar">
                <span class="budget-bar-label">${escapeHtml(item.category)}</span>
                <div class="budget-bar-track">
                  <div class="budget-bar-fill ${pct > 100 ? 'progress-danger' : 'progress-primary'}" 
                       style="width: ${Math.min(100, Math.max(8, pct))}%;">
                    ${pct}%
                  </div>
                </div>
                <span class="budget-bar-amount">${formatCurrency(spent, currency)} / ${formatCurrency(allocated, currency)}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Allocation & Expense Table -->
      <div class="card">
        <h3 class="card-title" style="margin-bottom: var(--sp-4);">📝 Category Breakdown & Expense Tracking</h3>
        <p style="font-size: var(--fs-xs); color: var(--clr-text-muted); margin-bottom: var(--sp-4);">
          Update actual spent amounts in real-time below. Values save automatically to your planner.
        </p>
        
        <div class="table-responsive">
          <table class="data-table" aria-label="Budget Breakdown Table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Share (%)</th>
                <th style="text-align: right;">Allocated</th>
                <th style="text-align: right; width: 170px;">Actual Spent</th>
                <th style="text-align: right;">Variance</th>
                <th>Notes / Scope</th>
                <th style="text-align: center; width: 60px;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${allocations.map((item, idx) => {
                const spent = Number(item.actualSpent) || 0;
                const allocated = Number(item.amount) || 0;
                const variance = allocated - spent;
                const isOver = variance < 0;
                return `
                  <tr>
                    <td><strong>${escapeHtml(item.category)}</strong></td>
                    <td><span class="badge badge-muted">${item.percentage || Math.round((allocated / (totalAllocated || 1)) * 100)}%</span></td>
                    <td class="number">${formatCurrency(allocated, currency)}</td>
                    <td class="number">
                      <input type="number" class="form-input spent-input" 
                        data-index="${idx}" 
                        value="${spent}" 
                        min="0" step="500" 
                        style="padding: var(--sp-1) var(--sp-2); text-align: right; min-height: 36px;"
                        aria-label="Actual spent for ${escapeHtml(item.category)}">
                    </td>
                    <td class="number" style="color: ${isOver ? 'var(--clr-danger)' : 'var(--clr-success)'}; font-weight: var(--fw-semibold);">
                      ${isOver ? '-' : '+'}${formatCurrency(Math.abs(variance), currency)}
                    </td>
                    <td style="color: var(--clr-text-muted); font-size: var(--fs-xs);">
                      ${escapeHtml(item.description || 'Standard allocation')}
                    </td>
                    <td style="text-align: center;">
                      <button class="btn btn-icon delete-cat-btn" data-index="${idx}" title="Remove category" aria-label="Delete ${escapeHtml(item.category)}">
                        🗑️
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr style="font-weight: var(--fw-bold); background: var(--clr-surface-alt);">
                <td>Total</td>
                <td>100%</td>
                <td class="number">${formatCurrency(totalAllocated, currency)}</td>
                <td class="number">${formatCurrency(totalSpent, currency)}</td>
                <td class="number" style="color: ${remaining >= 0 ? 'var(--clr-success)' : 'var(--clr-danger)'};">
                  ${remaining >= 0 ? '+' : '-'}${formatCurrency(Math.abs(remaining), currency)}
                </td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- Add Category Modal (Hidden by default) -->
    <div id="add-category-modal" class="modal-backdrop" style="display: none;">
      <div class="modal" role="dialog" aria-labelledby="modal-cat-title">
        <div class="modal-header">
          <h3 id="modal-cat-title">➕ Add Custom Budget Category</h3>
          <button class="btn btn-icon close-modal-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label" for="new-cat-name">Category Name *</label>
            <input type="text" id="new-cat-name" class="form-input" placeholder="e.g. Wedding Favors or Fireworks">
          </div>
          <div class="form-group">
            <label class="form-label" for="new-cat-amount">Allocated Amount (${currency}) *</label>
            <input type="number" id="new-cat-amount" class="form-input" min="100" step="500" value="10000">
          </div>
          <div class="form-group">
            <label class="form-label" for="new-cat-desc">Description / Scope</label>
            <input type="text" id="new-cat-desc" class="form-input" placeholder="Details about this line item">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary close-modal-btn">Cancel</button>
          <button class="btn btn-primary" id="save-new-cat-btn">Save Category</button>
        </div>
      </div>
    </div>
  `;

  // Attach event listeners for spent input changes
  container.querySelectorAll('.spent-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'), 10);
      const val = parseFloat(e.target.value) || 0;
      updateBudgetExpense(idx, val);
      showToast('Expense updated', 'success', 1500);
      renderBudget(container);
    });
  });

  // Attach delete category
  container.querySelectorAll('.delete-cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      if (confirm('Are you sure you want to remove this budget category?')) {
        updateActiveEvent(ev => {
          if (ev.budget && ev.budget.allocations) {
            ev.budget.allocations.splice(idx, 1);
          }
        });
        showToast('Category removed', 'info');
        renderBudget(container);
      }
    });
  });

  // Add category modal controls
  const modal = container.querySelector('#add-category-modal');
  container.querySelector('#add-category-btn').addEventListener('click', () => {
    modal.style.display = 'flex';
  });
  container.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  });

  container.querySelector('#save-new-cat-btn').addEventListener('click', () => {
    const name = container.querySelector('#new-cat-name').value.trim();
    const amt = parseFloat(container.querySelector('#new-cat-amount').value) || 0;
    const desc = container.querySelector('#new-cat-desc').value.trim();

    if (!name || amt <= 0) {
      showToast('Please provide a valid category name and amount', 'error');
      return;
    }

    updateActiveEvent(ev => {
      if (!ev.budget) ev.budget = { allocations: [] };
      if (!Array.isArray(ev.budget.allocations)) ev.budget.allocations = [];
      ev.budget.allocations.push({
        category: name,
        amount: amt,
        percentage: Math.round((amt / (ev.totalBudget || 1)) * 100),
        actualSpent: 0,
        description: desc
      });
    });

    modal.style.display = 'none';
    showToast('New category added', 'success');
    renderBudget(container);
  });

  // Recalculate with AI
  container.querySelector('#recalc-budget-btn').addEventListener('click', async () => {
    showLoading(true, 'AI is recalculating optimal budget allocations...');
    try {
      const res = await apiPost('/api/plan/budget', {
        eventType: event.type,
        totalBudget: event.totalBudget,
        guestCount: event.guestCount,
        city: event.city,
        priorities: event.priorities || ['catering', 'photography'],
        currency: event.currency || 'INR'
      });

      // Retain existing spent amounts where categories match
      const existingSpentMap = new Map();
      (event.budget?.allocations || []).forEach(a => {
        existingSpentMap.set(a.category.toLowerCase(), a.actualSpent || 0);
      });

      const updatedAllocations = (res.allocations || []).map(a => ({
        ...a,
        actualSpent: existingSpentMap.get(a.category.toLowerCase()) || 0
      }));

      updateActiveEvent(ev => {
        if (!ev.budget) ev.budget = {};
        ev.budget.allocations = updatedAllocations;
        ev.budget.tightBudget = res.tightBudget || false;
        ev.budget.contingencyPercent = res.contingencyPercent || 8;
        ev.budget.perGuest = res.perGuestCost || Math.round(ev.totalBudget / ev.guestCount);
      });

      showLoading(false);
      showToast('✨ Budget recalculated with AI allocations!', 'success');
      renderBudget(container);
    } catch (err) {
      showLoading(false);
      showToast(`Recalculation error: ${err.message}`, 'error');
    }
  });
}
