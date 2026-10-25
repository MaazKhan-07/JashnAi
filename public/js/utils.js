/**
 * Utility functions for Jashn frontend:
 * Formatting, DOM helpers, toast, and loading state.
 */

/**
 * Format currency with locale and symbol.
 * @param {number} amount
 * @param {string} [currency='INR']
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'INR') {
  const num = Number(amount) || 0;
  if (currency === 'INR') {
    return '₹' + num.toLocaleString('en-IN');
  } else if (currency === 'USD') {
    return '$' + num.toLocaleString('en-US');
  } else if (currency === 'EUR') {
    return '€' + num.toLocaleString('de-DE');
  } else if (currency === 'GBP') {
    return '£' + num.toLocaleString('en-GB');
  }
  return `${currency} ${num.toLocaleString()}`;
}

/**
 * Format ISO date string to human-readable format.
 * @param {string} isoDate
 * @returns {string}
 */
export function formatDate(isoDate) {
  if (!isoDate) return 'N/A';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Calculate days remaining until date.
 * @param {string} isoDate
 * @returns {number}
 */
export function getDaysRemaining(isoDate) {
  if (!isoDate) return 0;
  const target = new Date(isoDate);
  const now = new Date();
  // Strip time for clean day diff
  const utcTarget = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((utcTarget - utcNow) / (1000 * 60 * 60 * 24));
}

/**
 * Escape HTML special chars to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} [type='info']
 * @param {number} [duration=3500]
 */
export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  const icons = {
    success: '✅',
    error: '⚠️',
    info: 'ℹ️',
    warning: '🔔',
  };

  toast.innerHTML = `
    <span aria-hidden="true">${icons[type] || '✨'}</span>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 300ms ease, transform 300ms ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

let loadingTimer = null;

/**
 * Show or hide loading overlay.
 * Automatically dismisses after 3 seconds as a safety guard.
 * @param {boolean} show
 * @param {string} [text='Loading...']
 */
export function showLoading(show, text = 'Loading...') {
  const overlay = document.getElementById('loading-overlay');
  if (!overlay) return;

  if (loadingTimer) {
    clearTimeout(loadingTimer);
    loadingTimer = null;
  }

  if (show) {
    const span = overlay.querySelector('span');
    if (span) span.textContent = text;
    overlay.removeAttribute('hidden');
    overlay.style.display = 'flex';

    // Auto-dismiss safety timeout: guarantee removal after 3 seconds
    loadingTimer = setTimeout(() => {
      overlay.setAttribute('hidden', '');
      overlay.style.display = 'none';
      loadingTimer = null;
    }, 3000);
  } else {
    overlay.setAttribute('hidden', '');
    overlay.style.display = 'none';
  }
}

/**
 * Generate iCalendar (.ics) content for events/tasks.
 * @param {Object} event
 * @returns {string}
 */
export function generateICS(event) {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const eventDate = new Date(event.date);
  const startStr = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jashn//Celebration Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:jashn-${event.id}@planner.local`,
    `DTSTAMP:${now}`,
    `DTSTART:${startStr}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.type} in ${event.city}. Budget: ${event.currency} ${event.totalBudget}. Guests: ${event.guestCount}.`,
    `LOCATION:${event.city}`,
    'STATUS:CONFIRMED',
    'END:VEVENT'
  ];

  // Add milestone tasks as VEVENTs if due dates exist
  if (Array.isArray(event.tasks)) {
    event.tasks.forEach((t, i) => {
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        const taskDate = d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        ics.push(
          'BEGIN:VEVENT',
          `UID:jashn-${event.id}-task-${i}@planner.local`,
          `DTSTAMP:${now}`,
          `DTSTART:${taskDate}`,
          `SUMMARY:Task: ${t.title} (${event.title})`,
          `DESCRIPTION:${t.description || ''} - Category: ${t.category}`,
          `STATUS:${t.status === 'completed' ? 'COMPLETED' : 'CONFIRMED'}`,
          'END:VEVENT'
        );
      }
    });
  }

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

/**
 * Trigger file download in browser.
 * @param {string} filename
 * @param {string} content
 * @param {string} mimeType
 */
export function downloadFile(filename, content, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
