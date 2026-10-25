/**
 * Readiness score engine.
 * Computes a 0-100 score from:
 *   40% task completion (priority-weighted)
 *   30% vendor booking progress
 *   20% budget health
 *   10% guest RSVP progress
 * Minus penalties for overdue critical tasks.
 * Returns score, breakdown, and top 3 next-best-actions.
 *
 * Pure function — no I/O.
 */

/**
 * @typedef {Object} ReadinessInput
 * @property {Array<{status: string, priority: string, critical: boolean, dueDate: string}>} tasks
 * @property {Array<{status: string}>} vendors - status: 'to-contact'|'quoted'|'booked'|'paid'
 * @property {Array<{category: string, allocated: number, spent: number}>} budgetItems
 * @property {number} totalBudget
 * @property {Array<{rsvp: string}>} guests - rsvp: 'invited'|'confirmed'|'declined'|'tentative'
 * @property {string} eventDate - ISO date
 */

/**
 * @typedef {Object} ReadinessResult
 * @property {number} score
 * @property {Object} breakdown
 * @property {number} breakdown.taskScore
 * @property {number} breakdown.vendorScore
 * @property {number} breakdown.budgetScore
 * @property {number} breakdown.guestScore
 * @property {number} breakdown.penalty
 * @property {string[]} nextActions
 * @property {Array<{type: string, message: string, severity: string}>} risks
 */

const PRIORITY_WEIGHTS = { high: 3, medium: 2, low: 1 };

/**
 * Compute readiness score.
 * @param {ReadinessInput} input
 * @returns {ReadinessResult}
 */
export function computeReadiness(input) {
  const { tasks = [], vendors = [], budgetItems = [], totalBudget = 0, guests = [], eventDate } = input;

  // --- Task completion (40%) ---
  let taskWeightedDone = 0;
  let taskWeightedTotal = 0;
  for (const t of tasks) {
    const w = PRIORITY_WEIGHTS[t.priority] || 1;
    taskWeightedTotal += w;
    if (t.status === 'done') taskWeightedDone += w;
    else if (t.status === 'in-progress') taskWeightedDone += w * 0.5;
  }
  const taskScore = taskWeightedTotal > 0
    ? (taskWeightedDone / taskWeightedTotal) * 40
    : 0;

  // --- Vendor booking (30%) ---
  let vendorScore = 0;
  if (vendors.length > 0) {
    const vendorPoints = vendors.reduce((sum, v) => {
      if (v.status === 'paid') return sum + 1;
      if (v.status === 'booked') return sum + 0.75;
      if (v.status === 'quoted') return sum + 0.3;
      return sum;
    }, 0);
    vendorScore = (vendorPoints / vendors.length) * 30;
  }

  // --- Budget health (20%) ---
  let budgetScore = 20; // start perfect
  if (budgetItems.length > 0 && totalBudget > 0) {
    const totalSpent = budgetItems.reduce((s, b) => s + (b.spent || 0), 0);
    const totalAllocated = budgetItems.reduce((s, b) => s + (b.allocated || 0), 0);

    // Penalty for overspending
    if (totalSpent > totalBudget) {
      budgetScore = Math.max(0, 20 - ((totalSpent - totalBudget) / totalBudget) * 40);
    } else if (totalAllocated > 0) {
      // Check per-category health
      let overCategories = 0;
      for (const b of budgetItems) {
        if (b.allocated > 0 && b.spent > b.allocated) {
          overCategories++;
        }
      }
      budgetScore = Math.max(5, 20 - overCategories * 3);
    }
  }

  // --- Guest RSVP (10%) ---
  let guestScore = 0;
  if (guests.length > 0) {
    const responded = guests.filter(g =>
      g.rsvp === 'confirmed' || g.rsvp === 'declined' || g.rsvp === 'tentative'
    ).length;
    guestScore = (responded / guests.length) * 10;
  }

  // --- Penalties for overdue critical tasks ---
  const now = new Date();
  let penalty = 0;
  for (const t of tasks) {
    if (t.critical && t.status !== 'done' && new Date(t.dueDate) < now) {
      penalty += 3;
    }
  }

  const rawScore = taskScore + vendorScore + budgetScore + guestScore - penalty;
  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  // --- Next best actions ---
  const nextActions = generateNextActions(tasks, vendors, budgetItems, totalBudget, guests, eventDate);

  // --- Risk alerts ---
  const risks = generateRisks(tasks, vendors, budgetItems, totalBudget, guests, eventDate);

  return {
    score,
    breakdown: {
      taskScore: Math.round(taskScore * 10) / 10,
      vendorScore: Math.round(vendorScore * 10) / 10,
      budgetScore: Math.round(budgetScore * 10) / 10,
      guestScore: Math.round(guestScore * 10) / 10,
      penalty: Math.round(penalty * 10) / 10,
    },
    nextActions: nextActions.slice(0, 3),
    risks,
  };
}

/**
 * Generate prioritized next-best-actions.
 * @returns {string[]}
 */
function generateNextActions(tasks, vendors, budgetItems, totalBudget, guests, eventDate) {
  const actions = [];
  const now = new Date();

  // Overdue tasks
  const overdue = tasks.filter(t => t.status !== 'done' && new Date(t.dueDate) < now);
  if (overdue.length > 0) {
    const critOverdue = overdue.filter(t => t.critical);
    if (critOverdue.length > 0) {
      actions.push(`⚠️ Complete ${critOverdue.length} overdue critical task(s) immediately`);
    } else {
      actions.push(`📋 Complete ${overdue.length} overdue task(s)`);
    }
  }

  // Unbooked vendors
  const unbooked = vendors.filter(v => v.status === 'to-contact' || v.status === 'quoted');
  if (unbooked.length > 0) {
    actions.push(`📞 Follow up with ${unbooked.length} vendor(s) awaiting booking`);
  }

  // Over-budget categories
  for (const b of budgetItems) {
    if (b.allocated > 0 && b.spent > b.allocated) {
      actions.push(`💰 Review ${b.category} spending (over budget by ${Math.round(b.spent - b.allocated)})`);
      break;
    }
  }

  // Low RSVP response
  if (guests.length > 0) {
    const noResponse = guests.filter(g => g.rsvp === 'invited').length;
    if (noResponse > guests.length * 0.5) {
      actions.push(`📨 Send RSVP reminders (${noResponse} guests haven't responded)`);
    }
  }

  // Upcoming tasks
  const upcoming = tasks
    .filter(t => t.status === 'todo' && new Date(t.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  if (upcoming.length > 0 && actions.length < 3) {
    actions.push(`📅 Next up: "${upcoming[0].task}" due ${upcoming[0].dueDate}`);
  }

  return actions;
}

/**
 * Generate risk alerts based on plan data.
 * @returns {Array<{type: string, message: string, severity: string}>}
 */
function generateRisks(tasks, vendors, budgetItems, totalBudget, guests, eventDate) {
  const risks = [];
  const now = new Date();
  const evtDate = new Date(eventDate);
  const daysToEvent = Math.ceil((evtDate - now) / (1000 * 60 * 60 * 24));

  // No venue booked within 60 days
  const venueVendor = vendors.find(v =>
    v.category === 'venue' && (v.status === 'booked' || v.status === 'paid')
  );
  if (!venueVendor && daysToEvent <= 60) {
    risks.push({
      type: 'venue',
      message: 'No venue booked and event is within 60 days!',
      severity: 'critical',
    });
  }

  // Category overspend
  for (const b of budgetItems) {
    if (b.allocated > 0 && b.spent > b.allocated) {
      risks.push({
        type: 'budget',
        message: `${b.category} spending exceeds allocation by ${Math.round(((b.spent - b.allocated) / b.allocated) * 100)}%`,
        severity: b.spent > b.allocated * 1.2 ? 'critical' : 'warning',
      });
    }
  }

  // Total overspend
  const totalSpent = budgetItems.reduce((s, b) => s + (b.spent || 0), 0);
  if (totalSpent > totalBudget) {
    risks.push({
      type: 'budget',
      message: `Total spending exceeds budget by ${Math.round(totalSpent - totalBudget)}`,
      severity: 'critical',
    });
  }

  // Overdue critical tasks
  const critOverdue = tasks.filter(t => t.critical && t.status !== 'done' && new Date(t.dueDate) < now);
  if (critOverdue.length > 0) {
    risks.push({
      type: 'tasks',
      message: `${critOverdue.length} critical task(s) are overdue`,
      severity: 'critical',
    });
  }

  return risks;
}
