/**
 * Export & Print View:
 * Full printable dossier, JSON backup, Budget CSV, and Task CSV export.
 */
import { getActiveEvent } from '../store.js';
import { formatCurrency, formatDate, escapeHtml, downloadFile, generateICS, showToast } from '../utils.js';

export function renderExport(container) {
  const event = getActiveEvent();
  if (!event) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🖨️</div>
        <h3>No Event Selected</h3>
        <p>Please select an event to export or print.</p>
        <a href="#/wizard" class="btn btn-primary">Create Event</a>
      </div>
    `;
    return;
  }

  const budget = event.budget || {};
  const allocations = budget.allocations || [];
  const tasks = event.tasks || [];
  const vendors = event.vendors || [];
  const ideas = event.ideas || {};

  container.innerHTML = `
    <div class="section">
      <!-- Action Toolbar (hidden on print) -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--sp-6); flex-wrap: wrap; gap: var(--sp-3);" class="export-toolbar">
        <div>
          <h1>🖨️ Export & Print Dossier</h1>
          <p style="color: var(--clr-text-muted);">
            Generate physical dossiers, spreadsheet CSVs, or backup JSON for <strong>${escapeHtml(event.title)}</strong>.
          </p>
        </div>
        <div style="display: flex; gap: var(--sp-2); flex-wrap: wrap;">
          <button id="print-btn" class="btn btn-primary btn-sm">
            🖨️ Print / Save as PDF
          </button>
          <button id="export-json-btn" class="btn btn-secondary btn-sm">
            💾 Export JSON
          </button>
          <button id="export-budget-csv-btn" class="btn btn-secondary btn-sm">
            📊 Budget CSV
          </button>
          <button id="export-tasks-csv-btn" class="btn btn-secondary btn-sm">
            📋 Tasks CSV
          </button>
          <button id="export-ics-btn" class="btn btn-secondary btn-sm">
            📅 Calendar .ICS
          </button>
        </div>
      </div>

      <!-- Printable Document Container -->
      <div class="card" id="printable-dossier" style="background: var(--clr-surface); padding: var(--sp-8);">
        
        <!-- Header -->
        <div style="border-bottom: 2px solid var(--clr-primary); padding-bottom: var(--sp-4); margin-bottom: var(--sp-6); display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 1px; color: var(--clr-primary); font-weight: var(--fw-bold);">
              Jashn Celebration & Event Dossier
            </div>
            <h2 style="font-size: var(--fs-2xl); margin-top: var(--sp-1);">${escapeHtml(event.title)}</h2>
            <div style="color: var(--clr-text-muted); font-size: var(--fs-sm); margin-top: var(--sp-1);">
              Type: <strong>${escapeHtml(event.type.toUpperCase())}</strong> &bull; City: <strong>${escapeHtml(event.city)}</strong> &bull; Date: <strong>${formatDate(event.date)}</strong>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: var(--fs-sm); color: var(--clr-text-muted);">Guest Count: <strong>${event.guestCount}</strong></div>
            <div style="font-size: var(--fs-lg); font-weight: var(--fw-bold); color: var(--clr-primary);">${formatCurrency(event.totalBudget, event.currency)}</div>
          </div>
        </div>

        <!-- Section 1: Budget Summary -->
        <div style="margin-bottom: var(--sp-6);">
          <h3 style="font-size: var(--fs-md); border-bottom: 1px solid var(--clr-border); padding-bottom: var(--sp-2); margin-bottom: var(--sp-3);">
            1. Budget & Cost Allocation
          </h3>
          <table class="data-table" style="font-size: var(--fs-xs);">
            <thead>
              <tr>
                <th>Category</th>
                <th>Share</th>
                <th style="text-align: right;">Allocated</th>
                <th style="text-align: right;">Spent</th>
                <th>Scope</th>
              </tr>
            </thead>
            <tbody>
              ${allocations.map(a => `
                <tr>
                  <td><strong>${escapeHtml(a.category)}</strong></td>
                  <td>${a.percentage || 0}%</td>
                  <td class="number">${formatCurrency(a.amount, event.currency)}</td>
                  <td class="number">${formatCurrency(a.actualSpent || 0, event.currency)}</td>
                  <td style="color: var(--clr-text-muted);">${escapeHtml(a.description || '')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Section 2: Milestone Schedule -->
        <div style="margin-bottom: var(--sp-6);">
          <h3 style="font-size: var(--fs-md); border-bottom: 1px solid var(--clr-border); padding-bottom: var(--sp-2); margin-bottom: var(--sp-3);">
            2. Milestone Timeline & Critical Checklist
          </h3>
          <table class="data-table" style="font-size: var(--fs-xs);">
            <thead>
              <tr>
                <th>Status</th>
                <th>Milestone</th>
                <th>Category</th>
                <th>Due Date</th>
                <th>Urgency</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.map(t => `
                <tr>
                  <td>${t.status === 'completed' ? '✅ Done' : (t.status === 'in_progress' ? '🔄 Progress' : '⏳ Pending')}</td>
                  <td><strong>${escapeHtml(t.title)}</strong></td>
                  <td>${escapeHtml(t.category)}</td>
                  <td>${t.dueDate ? formatDate(t.dueDate) : '-'}</td>
                  <td>${t.urgency}</td>
                  <td style="color: var(--clr-text-muted);">${escapeHtml(t.notes || '')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Section 3: Vendor Directory -->
        <div style="margin-bottom: var(--sp-6);">
          <h3 style="font-size: var(--fs-md); border-bottom: 1px solid var(--clr-border); padding-bottom: var(--sp-2); margin-bottom: var(--sp-3);">
            3. Vendor Directory & Contacts
          </h3>
          <table class="data-table" style="font-size: var(--fs-xs);">
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Service</th>
                <th>Status</th>
                <th>Quote</th>
                <th>Phone</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              ${vendors.map(v => `
                <tr>
                  <td><strong>${escapeHtml(v.name)}</strong></td>
                  <td>${escapeHtml(v.category)}</td>
                  <td>${v.status.toUpperCase()}</td>
                  <td class="number">${v.quote ? formatCurrency(v.quote, event.currency) : '-'}</td>
                  <td>${escapeHtml(v.phone || '-')}</td>
                  <td>${escapeHtml(v.email || '-')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Section 4: Day-of Run of Show -->
        ${(ideas.runOfShow && ideas.runOfShow.length) ? `
          <div style="margin-bottom: var(--sp-6);">
            <h3 style="font-size: var(--fs-md); border-bottom: 1px solid var(--clr-border); padding-bottom: var(--sp-2); margin-bottom: var(--sp-3);">
              4. Day-of Run-of-Show / Itinerary
            </h3>
            <table class="data-table" style="font-size: var(--fs-xs);">
              <thead>
                <tr>
                  <th style="width: 120px;">Time</th>
                  <th>Activity / Milestone</th>
                </tr>
              </thead>
              <tbody>
                ${ideas.runOfShow.map(item => `
                  <tr>
                    <td><strong>${escapeHtml(item.time)}</strong></td>
                    <td>${escapeHtml(item.event)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <div style="border-top: 1px solid var(--clr-border); padding-top: var(--sp-4); text-align: center; color: var(--clr-text-muted); font-size: var(--fs-xs);">
          Generated by Jashn – AI Celebration & Event Planner &bull; Prepared on ${new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  `;

  // Print button
  container.querySelector('#print-btn').addEventListener('click', () => {
    window.print();
  });

  // Export JSON
  container.querySelector('#export-json-btn').addEventListener('click', () => {
    const jsonStr = JSON.stringify(event, null, 2);
    downloadFile(`${event.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_data.json`, jsonStr, 'application/json');
    showToast('JSON export downloaded', 'success');
  });

  // Export Budget CSV
  container.querySelector('#export-budget-csv-btn').addEventListener('click', () => {
    const rows = [
      ['Category', 'Percentage', 'Allocated Amount', 'Actual Spent', 'Currency', 'Notes'],
      ...allocations.map(a => [
        `"${a.category.replace(/"/g, '""')}"`,
        a.percentage || 0,
        a.amount || 0,
        a.actualSpent || 0,
        event.currency || 'INR',
        `"${(a.description || '').replace(/"/g, '""')}"`
      ])
    ];
    const csvContent = rows.map(r => r.join(',')).join('\n');
    downloadFile(`${event.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_budget.csv`, csvContent, 'text/csv');
    showToast('Budget CSV downloaded', 'success');
  });

  // Export Tasks CSV
  container.querySelector('#export-tasks-csv-btn').addEventListener('click', () => {
    const rows = [
      ['Milestone Task', 'Category', 'Due Date', 'Status', 'Urgency', 'Notes'],
      ...tasks.map(t => [
        `"${t.title.replace(/"/g, '""')}"`,
        `"${(t.category || '').replace(/"/g, '""')}"`,
        t.dueDate || '',
        t.status || 'pending',
        t.urgency || 'medium',
        `"${(t.notes || '').replace(/"/g, '""')}"`
      ])
    ];
    const csvContent = rows.map(r => r.join(',')).join('\n');
    downloadFile(`${event.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_tasks.csv`, csvContent, 'text/csv');
    showToast('Tasks CSV downloaded', 'success');
  });

  // Export ICS
  container.querySelector('#export-ics-btn').addEventListener('click', () => {
    const icsContent = generateICS(event);
    downloadFile(`${event.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_schedule.ics`, icsContent, 'text/calendar');
    showToast('Calendar .ICS downloaded', 'success');
  });
}
