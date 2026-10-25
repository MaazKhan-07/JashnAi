/**
 * Fetch wrapper for API calls.
 * Uses textContent-safe responses — never innerHTML.
 */

const API_BASE = '';

/**
 * Make a JSON API request.
 * @param {string} path - API path (e.g., '/api/plan/budget')
 * @param {Object} [body] - request body (POST)
 * @param {Object} [options] - fetch options override
 * @returns {Promise<Object>}
 */
export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Make a GET API request.
 * @param {string} path
 * @returns {Promise<Object>}
 */
export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}
