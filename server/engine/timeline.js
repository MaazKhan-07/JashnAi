/**
 * Timeline generator engine.
 * Backward-plans milestones from the event date.
 * Pure function — no I/O.
 *
 * Algorithm:
 * 1. Compute lead days from today to event date
 * 2. Validate: past dates or < 3 days → error
 * 3. If lead < ideal, compress offsets by actual/ideal ratio (fast-track mode)
 * 4. Enforce minimum 1-day gap between tasks
 * 5. In fast-track mode, push critical-path tasks (venue, caterer, permits) to front
 * 6. Assign due dates
 */

import { TIMELINE_TEMPLATES, IDEAL_LEAD_DAYS } from './templates.js';

/**
 * @typedef {Object} TimelineInput
 * @property {'wedding'|'birthday'|'community'} eventType
 * @property {string} eventDate - ISO date string
 * @property {string} [eventName]
 */

/**
 * @typedef {Object} TimelineTask
 * @property {string} id
 * @property {string} phase
 * @property {string} task
 * @property {string} dueDate - ISO date string
 * @property {string} owner
 * @property {'high'|'medium'|'low'} priority
 * @property {boolean} critical
 * @property {'todo'|'in-progress'|'done'} status
 */

/**
 * @typedef {Object} TimelineResult
 * @property {TimelineTask[]} tasks
 * @property {string} mode - 'standard' | 'fast-track'
 * @property {number} leadDays
 * @property {number} idealDays
 * @property {number} compressionRatio
 */

/**
 * Generate a timeline of tasks backward-planned from the event date.
 * @param {TimelineInput} input
 * @returns {TimelineResult}
 */
export function generateTimeline(input) {
  const { eventType, eventDate } = input;

  const template = TIMELINE_TEMPLATES[eventType];
  if (!template) {
    throw new Error(`Unknown event type: ${eventType}`);
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const evtDate = new Date(eventDate);
  evtDate.setHours(0, 0, 0, 0);

  const leadDays = Math.ceil((evtDate - now) / (1000 * 60 * 60 * 24));

  // Validation
  if (leadDays < 0) {
    throw new TimelineError('The event date is in the past. Please choose a future date to plan your celebration.');
  }
  if (leadDays < 3) {
    throw new TimelineError('The event is less than 3 days away. There is not enough time for meaningful planning. Consider postponing or focusing on essentials only.');
  }

  const idealDays = IDEAL_LEAD_DAYS[eventType] || 180;
  const isFastTrack = leadDays < idealDays * 0.7;
  const compressionRatio = Math.min(1, leadDays / idealDays);

  // Build tasks with due dates
  let tasks = template.map((t, idx) => {
    const daysFromNow = Math.max(1, Math.round(t.offsetRatio * leadDays));
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + daysFromNow);

    return {
      id: `task-${eventType}-${idx}`,
      phase: t.phase,
      task: t.task,
      dueDate: dueDate.toISOString().split('T')[0],
      owner: t.owner,
      priority: t.priority,
      critical: t.critical,
      status: 'todo',
    };
  });

  // In fast-track mode, push critical tasks to front
  if (isFastTrack) {
    const critical = tasks.filter(t => t.critical);
    const nonCritical = tasks.filter(t => !t.critical);

    // Reassign due dates for critical tasks to earliest possible
    critical.forEach((t, idx) => {
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + Math.max(1, idx + 1));
      t.dueDate = dueDate.toISOString().split('T')[0];
    });

    tasks = [...critical, ...nonCritical];
  }

  // Enforce minimum 1-day gap
  tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  for (let i = 1; i < tasks.length; i++) {
    const prev = new Date(tasks[i - 1].dueDate);
    const curr = new Date(tasks[i].dueDate);
    if (curr <= prev) {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      // Don't push past event date
      if (newDate <= evtDate) {
        tasks[i].dueDate = newDate.toISOString().split('T')[0];
      }
    }
  }

  return {
    tasks,
    mode: isFastTrack ? 'fast-track' : 'standard',
    leadDays,
    idealDays,
    compressionRatio: Math.round(compressionRatio * 100) / 100,
  };
}

/**
 * Custom error for timeline validation failures.
 */
export class TimelineError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'TimelineError';
    this.statusCode = 400;
  }
}
