/**
 * Client-side state store with localStorage persistence and helper actions.
 * Versioned schema with safe-parse recovery.
 */
import { SEED_EVENTS } from './seed.js';

const STORAGE_KEY = 'jashn_data';
const SCHEMA_VERSION = 1;

/** @type {Object} */
let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initDefault();
    const parsed = JSON.parse(raw);
    if (parsed._version !== SCHEMA_VERSION || !Array.isArray(parsed.events) || parsed.events.length === 0) {
      return initDefault();
    }
    return parsed;
  } catch (e) {
    console.warn('[Store] Failed to load state, resetting:', e.message);
    return initDefault();
  }
}

function initDefault() {
  const events = JSON.parse(JSON.stringify(SEED_EVENTS));
  const defaultState = {
    _version: SCHEMA_VERSION,
    events,
    activeEventId: events[0]?.id || null,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
  } catch (err) {
    // ignore
  }
  return defaultState;
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[Store] Save failed:', e.message);
  }
}

export function getState() { return state; }
export function getEvents() { return state.events; }

export function getActiveEvent() {
  if (!state.activeEventId && state.events.length > 0) {
    state.activeEventId = state.events[0].id;
    save();
  }
  return state.events.find(e => e.id === state.activeEventId) || null;
}

export function setActiveEvent(id) {
  state.activeEventId = id;
  save();
}

export function saveEvent(event) {
  const idx = state.events.findIndex(e => e.id === event.id);
  if (idx >= 0) {
    state.events[idx] = event;
  } else {
    state.events.unshift(event);
    state.activeEventId = event.id;
  }
  save();
}

export function deleteEvent(id) {
  state.events = state.events.filter(e => e.id !== id);
  if (state.activeEventId === id) {
    state.activeEventId = state.events[0]?.id || null;
  }
  save();
}

export function resetToSeed() {
  state = initDefault();
  return state;
}

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/**
 * Mutate active event safely and persist.
 * @param {(event: Object) => void} updater
 */
export function updateActiveEvent(updater) {
  const ev = getActiveEvent();
  if (!ev) return;
  updater(ev);
  saveEvent(ev);
}

/**
 * Task helpers
 */
export function updateTaskStatus(taskId, status) {
  updateActiveEvent(ev => {
    if (!Array.isArray(ev.tasks)) ev.tasks = [];
    const t = ev.tasks.find(item => item.id === taskId);
    if (t) t.status = status;
  });
}

export function addTask(task) {
  updateActiveEvent(ev => {
    if (!Array.isArray(ev.tasks)) ev.tasks = [];
    ev.tasks.push({
      id: genId(),
      status: 'pending',
      urgency: 'medium',
      ...task
    });
  });
}

export function deleteTask(taskId) {
  updateActiveEvent(ev => {
    if (!Array.isArray(ev.tasks)) return;
    ev.tasks = ev.tasks.filter(t => t.id !== taskId);
  });
}

/**
 * Vendor helpers
 */
export function addVendor(vendor) {
  updateActiveEvent(ev => {
    if (!Array.isArray(ev.vendors)) ev.vendors = [];
    ev.vendors.push({
      id: genId(),
      status: 'contacted',
      quote: 0,
      ...vendor
    });
  });
}

export function updateVendor(vendor) {
  updateActiveEvent(ev => {
    if (!Array.isArray(ev.vendors)) return;
    const idx = ev.vendors.findIndex(v => v.id === vendor.id);
    if (idx >= 0) ev.vendors[idx] = vendor;
  });
}

export function deleteVendor(vendorId) {
  updateActiveEvent(ev => {
    if (!Array.isArray(ev.vendors)) return;
    ev.vendors = ev.vendors.filter(v => v.id !== vendorId);
  });
}

/**
 * Budget helpers
 */
export function updateBudgetExpense(categoryIndex, actualSpent) {
  updateActiveEvent(ev => {
    if (ev.budget && Array.isArray(ev.budget.allocations) && ev.budget.allocations[categoryIndex]) {
      ev.budget.allocations[categoryIndex].actualSpent = Number(actualSpent) || 0;
    }
  });
}
