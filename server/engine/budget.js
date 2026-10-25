/**
 * Budget allocation engine.
 * Pure function: takes event context, returns category allocations that sum exactly to the total budget.
 *
 * Algorithm:
 * 1. Start with base template for event type
 * 2. Apply priority boosts (+3 to +5 points each, normalized)
 * 3. Scale catering share by guest count thresholds
 * 4. Check per-head budget — if below floor, activate "tight budget" mode (trim non-essentials)
 * 5. Adjust contingency by lead time (8-12% if short, 5% otherwise)
 * 6. Normalize to 100%
 * 7. Apply largest-remainder rounding so amounts sum exactly to total
 */

import {
  BUDGET_TEMPLATES,
  PRIORITY_CATEGORY_MAP,
  TIGHT_BUDGET_FLOOR_INR,
  TRIM_ORDER,
  CATERING_SCALE_THRESHOLDS,
  IDEAL_LEAD_DAYS,
  CURRENCY_RATES,
} from './templates.js';

/**
 * @typedef {Object} BudgetInput
 * @property {'wedding'|'birthday'|'community'} eventType
 * @property {number} totalBudget - in chosen currency
 * @property {string} currency - INR, USD, EUR, GBP
 * @property {number} guestCount
 * @property {string} eventDate - ISO date string
 * @property {string[]} priorities - top 3 priorities
 */

/**
 * @typedef {Object} BudgetAllocation
 * @property {string} category
 * @property {number} percentage
 * @property {number} amount
 */

/**
 * @typedef {Object} BudgetResult
 * @property {BudgetAllocation[]} allocations
 * @property {boolean} tightBudget
 * @property {boolean} fastTrack
 * @property {number} contingencyPercent
 * @property {number} perGuestCost
 * @property {string} mode - 'standard' | 'tight-budget' | 'fast-track' | 'tight-fast-track'
 */

/**
 * Generate budget allocations from event context.
 * @param {BudgetInput} input
 * @returns {BudgetResult}
 */
export function generateBudget(input) {
  const { eventType, totalBudget, currency, guestCount, eventDate, priorities } = input;

  const template = BUDGET_TEMPLATES[eventType];
  if (!template) {
    throw new Error(`Unknown event type: ${eventType}`);
  }

  // 1. Copy base percentages
  const pcts = { ...template };

  // 2. Apply priority boosts
  const boostPoints = { 0: 5, 1: 4, 2: 3 };
  for (let i = 0; i < (priorities || []).length && i < 3; i++) {
    const prio = priorities[i];
    const cats = PRIORITY_CATEGORY_MAP[prio] || [];
    for (const cat of cats) {
      if (pcts[cat] !== undefined) {
        pcts[cat] += boostPoints[i];
      }
    }
  }

  // 3. Scale catering by guest count
  for (const { above, boost } of CATERING_SCALE_THRESHOLDS) {
    if (guestCount > above) {
      if (pcts.catering !== undefined) pcts.catering += boost;
      break; // apply highest matching threshold only
    }
  }

  // 4. Lead time analysis
  const now = new Date();
  const evtDate = new Date(eventDate);
  const leadDays = Math.max(0, Math.ceil((evtDate - now) / (1000 * 60 * 60 * 24)));
  const idealDays = IDEAL_LEAD_DAYS[eventType] || 180;
  const isFastTrack = leadDays < idealDays * 0.7;

  // 5. Contingency by lead time
  let contingencyPct;
  if (leadDays < idealDays * 0.3) {
    contingencyPct = 12;
  } else if (leadDays < idealDays * 0.5) {
    contingencyPct = 10;
  } else if (isFastTrack) {
    contingencyPct = 8;
  } else {
    contingencyPct = 5;
  }

  // Set contingency
  if (pcts.contingency !== undefined) {
    pcts.contingency = contingencyPct;
  }

  // 6. Per-head budget check (convert to INR for comparison)
  const rate = CURRENCY_RATES[currency] || 1;
  const budgetInINR = totalBudget / rate;
  const perHeadINR = budgetInINR / Math.max(1, guestCount);
  const isTightBudget = perHeadINR < TIGHT_BUDGET_FLOOR_INR;

  if (isTightBudget) {
    // Trim non-essentials
    let trimTotal = 0;
    const trimmedCats = [];
    for (const cat of TRIM_ORDER) {
      if (pcts[cat] !== undefined && pcts[cat] > 2) {
        const trim = Math.min(pcts[cat] - 1, 3);
        pcts[cat] -= trim;
        trimTotal += trim;
        trimmedCats.push(cat);
      }
    }
    // Redistribute trimmed points to catering and venue
    if (pcts.catering !== undefined) pcts.catering += Math.ceil(trimTotal * 0.6);
    if (pcts.venue !== undefined) pcts.venue += Math.floor(trimTotal * 0.4);
  }

  // 7. Normalize to 100%
  const categories = Object.keys(pcts);
  const totalPct = categories.reduce((s, c) => s + pcts[c], 0);

  const normalized = {};
  for (const cat of categories) {
    normalized[cat] = (pcts[cat] / totalPct) * 100;
  }

  // 8. Largest-remainder rounding
  const allocations = largestRemainderRound(normalized, categories, totalBudget);

  const perGuestCost = totalBudget / Math.max(1, guestCount);
  const mode = isTightBudget && isFastTrack ? 'tight-fast-track'
    : isTightBudget ? 'tight-budget'
    : isFastTrack ? 'fast-track'
    : 'standard';

  return {
    allocations,
    tightBudget: isTightBudget,
    fastTrack: isFastTrack,
    contingencyPercent: contingencyPct,
    perGuestCost: Math.round(perGuestCost * 100) / 100,
    mode,
  };
}

/**
 * Largest-remainder rounding: distributes totalBudget across categories
 * so the amounts sum exactly to totalBudget (no rounding errors).
 * @param {Object<string,number>} normalizedPcts - percentages summing to ~100
 * @param {string[]} categories
 * @param {number} totalBudget
 * @returns {BudgetAllocation[]}
 */
export function largestRemainderRound(normalizedPcts, categories, totalBudget) {
  // Compute exact amounts
  const exact = categories.map(cat => ({
    category: cat,
    exactAmount: (normalizedPcts[cat] / 100) * totalBudget,
    percentage: Math.round(normalizedPcts[cat] * 100) / 100,
  }));

  // Floor each amount
  const floored = exact.map(e => ({
    ...e,
    amount: Math.floor(e.exactAmount),
    remainder: e.exactAmount - Math.floor(e.exactAmount),
  }));

  // Distribute leftover
  const totalFloored = floored.reduce((s, e) => s + e.amount, 0);
  let leftover = Math.round(totalBudget) - totalFloored;

  // Sort by remainder descending
  const sorted = [...floored].sort((a, b) => b.remainder - a.remainder);

  for (const entry of sorted) {
    if (leftover <= 0) break;
    entry.amount += 1;
    leftover -= 1;
  }

  return floored.map(e => ({
    category: e.category,
    percentage: e.percentage,
    amount: e.amount,
  }));
}
