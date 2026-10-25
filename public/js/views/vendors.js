/**
 * Vendor Checklist & Directory View:
 * Pipeline status management (searching, contacted, quoted, booked),
 * quotes comparison, contacts, notes, and vendor creation.
 */
import { getActiveEvent, addVendor, updateVendor, deleteVendor, updateActiveEvent } from '../store.js';
import { formatCurrency, escapeHtml, showToast } from '../utils.js';

export function renderVendors(container) {
  const event = getActiveEvent();
  if (!event) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🤝</div>
        <h3>No Event Selected</h3>
        <p>Please select or create an event to manage vendor relationships.</p>
        <a href="#/wizard" class="btn btn-primary">Create Event</a>
      </div>
    `;
    return;
  }

  const vendors = event.vendors || [];
  const currency = event.currency || 'INR';

  const bookedCount = vendors.filter(v => v.status === 'booked').length;
  const quotedCount = vendors.filter(v => v.status === 'quoted').length;
  const contactedCount = vendors.filter(v => v.status === 'contacted').length;
  const totalCommitted = vendors
    .filter(v => v.status === 'booked')
    .reduce((sum, v) => sum + (Number(v.quote) || 0), 0);

  container.innerHTML = `
    <div class="section">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--sp-4); flex-wrap: wrap; gap: var(--sp-3);">
        <div>
          <h1>🤝 Vendor Checklist & Directory</h1>
          <p style="color: var(--clr-text-muted);">
            Manage supplier quotes and booking contracts for <strong>${escapeHtml(event.title)}</strong>.
          </p>
        </div>
        <div>
          <button id="add-vendor-btn" class="btn btn-primary btn-sm">
            ➕ Add Vendor
          </button>
        </div>
      </div>

      <!-- Pipeline Stats Cards -->
      <div class="grid grid-cols-4" style="margin-bottom: var(--sp-6);">
        <div class="card stat-card">
          <div class="stat-label">Total Vendors</div>
          <div class="stat-number" style="font-size: var(--fs-xl); color: var(--clr-text);">${vendors.length}</div>
          <div style="font-size: var(--fs-xs); color: var(--clr-text-muted); margin-top: var(--sp-1);">In directory</div>
        </div>

        <div class="card stat-card">
          <div class="stat-label">Booked & Confirmed</div>
          <div class="stat-number" style="font-size: var(--fs-xl); color: var(--clr-success);">${bookedCount}</div>
          <div style="font-size: var(--fs-xs); color: var(--clr-text-muted); margin-top: var(--sp-1);">Contracts signed</div>
        </div>

        <div class="card stat-card">
          <div class="stat-label">Quotes Under Review</div>
          <div class="stat-number" style="font-size: var(--fs-xl); color: var(--clr-warning);">${quotedCount}</div>
          <div style="font-size: var(--fs-xs); color: var(--clr-text-muted); margin-top: var(--sp-1);">${contactedCount} contacted</div>
        </div>

        <div class="card stat-card">
          <div class="stat-label">Committed Quotes</div>
          <div class="stat-number" style="font-size: var(--fs-xl); color: var(--clr-primary);">${formatCurrency(totalCommitted, currency)}</div>
          <div style="font-size: var(--fs-xs); color: var(--clr-text-muted); margin-top: var(--sp-1);">For booked vendors</div>
        </div>
      </div>

      <!-- Vendor Cards Grid -->
      <div class="grid grid-cols-2" id="vendor-grid">
        ${vendors.length === 0 ? `
          <div class="empty-state" style="grid-column: span 2;">
            <p>No vendors added yet. Click "Add Vendor" to start your checklist.</p>
          </div>
        ` : ''}

        ${vendors.map(v => {
          const isBooked = v.status === 'booked';
          const statusBadgeClass = {
            booked: 'badge-success',
            quoted: 'badge-warning',
            contacted: 'badge-info',
            searching: 'badge-muted'
          }[v.status] || 'badge-muted';

          return `
            <div class="card vendor-card" style="${isBooked ? 'border-left: 4px solid var(--clr-success);' : ''}">
              <div class="card-header" style="margin-bottom: var(--sp-2);">
                <div>
                  <h3 style="font-size: var(--fs-base); font-weight: var(--fw-semibold); display: flex; align-items: center; gap: var(--sp-2);">
                    ${escapeHtml(v.name)}
                  </h3>
                  <span class="badge badge-muted" style="margin-top: var(--sp-1);">🏷️ ${escapeHtml(v.category)}</span>
                </div>
                <div style="text-align: right;">
                  <div class="vendor-price" style="font-size: var(--fs-md); font-weight: var(--fw-bold); color: var(--clr-primary);">
                    ${v.quote ? formatCurrency(v.quote, currency) : 'Quote Pending'}
                  </div>
                </div>
              </div>

              ${v.notes ? `
                <p style="font-size: var(--fs-xs); color: var(--clr-text-muted); margin: var(--sp-2) 0; background: var(--clr-surface-alt); padding: var(--sp-2); border-radius: var(--radius-sm);">
                  📝 ${escapeHtml(v.notes)}
                </p>
              ` : ''}

              <!-- Contact Info -->
              <div style="font-size: var(--fs-xs); color: var(--clr-text); margin: var(--sp-3) 0; display: flex; flex-direction: column; gap: var(--sp-1);">
                ${v.phone ? `<div>📞 <a href="tel:${escapeHtml(v.phone)}" style="color: var(--clr-text); text-decoration: underline;">${escapeHtml(v.phone)}</a></div>` : ''}
                ${v.email ? `<div>✉️ <a href="mailto:${escapeHtml(v.email)}" style="color: var(--clr-text); text-decoration: underline;">${escapeHtml(v.email)}</a></div>` : ''}
              </div>

              <!-- Pipeline Status Changer -->
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--clr-border); padding-top: var(--sp-3); margin-top: var(--sp-2);">
                <div style="display: flex; align-items: center; gap: var(--sp-2);">
                  <span class="badge ${statusBadgeClass}">${v.status.toUpperCase()}</span>
                  <select class="form-select vendor-status-select" data-id="${v.id}" style="min-height: 32px; padding: var(--sp-1) var(--sp-2); font-size: var(--fs-xs); width: auto;">
                    <option value="searching" ${v.status === 'searching' ? 'selected' : ''}>🔍 Searching</option>
                    <option value="contacted" ${v.status === 'contacted' ? 'selected' : ''}>📞 Contacted</option>
                    <option value="quoted" ${v.status === 'quoted' ? 'selected' : ''}>📋 Quoted</option>
                    <option value="booked" ${v.status === 'booked' ? 'selected' : ''}>✅ Booked</option>
                  </select>
                </div>
                
                <button class="btn btn-icon delete-vendor-btn" data-id="${v.id}" title="Remove vendor" aria-label="Delete ${escapeHtml(v.name)}">
                  🗑️
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Add Vendor Modal -->
    <div id="add-vendor-modal" class="modal-backdrop" style="display: none;">
      <div class="modal" role="dialog" aria-labelledby="modal-vendor-title">
        <div class="modal-header">
          <h3 id="modal-vendor-title">➕ Add Vendor to Checklist</h3>
          <button class="btn btn-icon close-modal-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label" for="vendor-name-input">Vendor / Company Name *</label>
            <input type="text" id="vendor-name-input" class="form-input" placeholder="e.g. Royal Haveli Banquet or Lumina Photography">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="vendor-cat-input">Category *</label>
              <select id="vendor-cat-input" class="form-select">
                <option value="Venue">Venue</option>
                <option value="Catering">Catering & Food</option>
                <option value="Photography">Photography & Videography</option>
                <option value="Decor">Decor & Floral</option>
                <option value="Music & Entertainment">Music & Entertainment</option>
                <option value="Cake & Bakery">Cake & Bakery</option>
                <option value="Attire & Makeup">Attire & Makeup</option>
                <option value="Transport & Logistics">Transport & Logistics</option>
                <option value="Invitations & Favors">Invitations & Favors</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="vendor-status-input">Status *</label>
              <select id="vendor-status-input" class="form-select">
                <option value="searching">🔍 Searching</option>
                <option value="contacted" selected>📞 Contacted</option>
                <option value="quoted">📋 Quoted</option>
                <option value="booked">✅ Booked</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="vendor-quote-input">Quote Amount (${currency})</label>
              <input type="number" id="vendor-quote-input" class="form-input" min="0" step="500" value="0">
            </div>
            <div class="form-group">
              <label class="form-label" for="vendor-phone-input">Phone Number</label>
              <input type="text" id="vendor-phone-input" class="form-input" placeholder="+91 98000 00000">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="vendor-email-input">Email Address</label>
            <input type="email" id="vendor-email-input" class="form-input" placeholder="vendor@example.com">
          </div>
          <div class="form-group">
            <label class="form-label" for="vendor-notes-input">Deliverables & Agreement Notes</label>
            <textarea id="vendor-notes-input" class="form-textarea" placeholder="Advance paid, delivery timing, cancellation policy..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary close-modal-btn">Cancel</button>
          <button class="btn btn-primary" id="save-vendor-btn">Add Vendor</button>
        </div>
      </div>
    </div>
  `;

  // Status select changes
  container.querySelectorAll('.vendor-status-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const id = e.target.getAttribute('data-id');
      const v = vendors.find(item => item.id === id);
      if (v) {
        v.status = e.target.value;
        updateVendor(v);
        showToast('Vendor status updated');
        renderVendors(container);
      }
    });
  });

  // Delete vendor
  container.querySelectorAll('.delete-vendor-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Remove this vendor from your list?')) {
        deleteVendor(id);
        showToast('Vendor removed');
        renderVendors(container);
      }
    });
  });

  // Modal handlers
  const modal = container.querySelector('#add-vendor-modal');
  container.querySelector('#add-vendor-btn').addEventListener('click', () => {
    modal.style.display = 'flex';
  });
  container.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  });

  container.querySelector('#save-vendor-btn').addEventListener('click', () => {
    const name = container.querySelector('#vendor-name-input').value.trim();
    const category = container.querySelector('#vendor-cat-input').value;
    const status = container.querySelector('#vendor-status-input').value;
    const quote = parseFloat(container.querySelector('#vendor-quote-input').value) || 0;
    const phone = container.querySelector('#vendor-phone-input').value.trim();
    const email = container.querySelector('#vendor-email-input').value.trim();
    const notes = container.querySelector('#vendor-notes-input').value.trim();

    if (!name) {
      showToast('Please enter a vendor name', 'error');
      return;
    }

    addVendor({ name, category, status, quote, phone, email, notes });
    modal.style.display = 'none';
    showToast('Vendor added to checklist', 'success');
    renderVendors(container);
  });
}
