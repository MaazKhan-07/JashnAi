/**
 * Offline chat intent handler.
 * Matches user questions to known intents using keyword patterns,
 * then generates answers from the plan context.
 *
 * Pure function — no I/O.
 */

/**
 * @typedef {Object} ChatContext
 * @property {string} eventName
 * @property {'wedding'|'birthday'|'community'} eventType
 * @property {number} totalBudget
 * @property {number} totalSpent
 * @property {string} currency
 * @property {number} guestCount
 * @property {number} confirmedGuests
 * @property {string} eventDate
 * @property {number} daysToEvent
 * @property {number} readinessScore
 * @property {string[]} nextActions
 * @property {Array<{task: string, dueDate: string, status: string}>} upcomingTasks
 * @property {Array<{category: string, allocated: number, spent: number}>} budgetItems
 * @property {Array<{type: string, message: string}>} risks
 */

/**
 * Intent definitions: keyword patterns and response generators.
 */
const INTENTS = [
  {
    name: 'budget_status',
    patterns: [/budget/i, /over\s*budget/i, /spend/i, /money/i, /cost/i, /expense/i, /afford/i],
    handler: (ctx) => {
      const remaining = ctx.totalBudget - ctx.totalSpent;
      const pct = Math.round((ctx.totalSpent / Math.max(1, ctx.totalBudget)) * 100);
      let msg = `💰 **Budget Status for ${ctx.eventName}**\n\n`;
      msg += `• Total Budget: ${ctx.currency} ${ctx.totalBudget.toLocaleString()}\n`;
      msg += `• Spent So Far: ${ctx.currency} ${ctx.totalSpent.toLocaleString()} (${pct}%)\n`;
      msg += `• Remaining: ${ctx.currency} ${remaining.toLocaleString()}\n\n`;

      if (remaining < 0) {
        msg += `⚠️ You are over budget by ${ctx.currency} ${Math.abs(remaining).toLocaleString()}. Consider reviewing non-essential categories.`;
      } else if (pct > 80) {
        msg += `⚡ You've used most of your budget. Be careful with remaining expenses.`;
      } else {
        msg += `✅ You're in good shape! Plenty of budget remaining.`;
      }

      // Show over-budget categories
      const overCats = (ctx.budgetItems || []).filter(b => b.spent > b.allocated && b.allocated > 0);
      if (overCats.length > 0) {
        msg += `\n\n**Over-budget categories:**\n`;
        for (const c of overCats) {
          msg += `• ${c.category}: spent ${ctx.currency} ${c.spent.toLocaleString()} / allocated ${ctx.currency} ${c.allocated.toLocaleString()}\n`;
        }
      }
      return msg;
    },
  },
  {
    name: 'this_week',
    patterns: [/this\s*week/i, /what.*do.*next/i, /upcoming/i, /to\s*do/i, /task/i, /pending/i, /what.*should/i],
    handler: (ctx) => {
      let msg = `📋 **Upcoming Tasks for ${ctx.eventName}**\n\n`;
      if (ctx.upcomingTasks && ctx.upcomingTasks.length > 0) {
        for (const t of ctx.upcomingTasks.slice(0, 5)) {
          const icon = t.status === 'done' ? '✅' : t.status === 'in-progress' ? '🔄' : '⬜';
          msg += `${icon} ${t.task} — due ${t.dueDate}\n`;
        }
      } else {
        msg += `No upcoming tasks found. You're all caught up! 🎉`;
      }
      if (ctx.nextActions && ctx.nextActions.length > 0) {
        msg += `\n\n**Recommended actions:**\n`;
        for (const a of ctx.nextActions) {
          msg += `• ${a}\n`;
        }
      }
      return msg;
    },
  },
  {
    name: 'readiness',
    patterns: [/ready/i, /readiness/i, /progress/i, /status/i, /how.*going/i, /score/i],
    handler: (ctx) => {
      let msg = `📊 **Readiness Score: ${ctx.readinessScore}/100**\n\n`;
      msg += `Your event "${ctx.eventName}" is ${ctx.daysToEvent} days away.\n\n`;
      if (ctx.readinessScore >= 80) {
        msg += `🌟 Excellent! You're well-prepared. Just a few finishing touches.`;
      } else if (ctx.readinessScore >= 50) {
        msg += `👍 Good progress! Focus on the key areas below.`;
      } else {
        msg += `⚡ There's work to do. Let's prioritize the essentials.`;
      }
      if (ctx.nextActions && ctx.nextActions.length > 0) {
        msg += `\n\n**Top priorities:**\n`;
        for (const a of ctx.nextActions) {
          msg += `• ${a}\n`;
        }
      }
      return msg;
    },
  },
  {
    name: 'rain_plan',
    patterns: [/rain/i, /weather/i, /outdoor/i, /backup\s*plan/i, /contingency/i, /plan\s*b/i],
    handler: (ctx) => {
      let msg = `🌧️ **Rain / Weather Backup Plan**\n\n`;
      msg += `Here are some recommendations:\n\n`;
      msg += `1. **Ask your venue** about covered areas, marquee options, or indoor backup spaces.\n`;
      msg += `2. **Rent a waterproof shamiana/tent** — costs ~5-10% of venue budget but saves the day.\n`;
      msg += `3. **Have umbrellas ready** — cute branded umbrellas double as favors!\n`;
      msg += `4. **Check weather 7 days before** and make the call on outdoor setup.\n`;
      msg += `5. **Inform vendors** about Plan B layouts in advance.\n`;
      msg += `6. **Waterproof the essentials** — protect sound equipment, photo backdrops, and food stations.\n\n`;
      msg += `💡 *Tip: An indoor-outdoor venue gives you the most flexibility.*`;
      return msg;
    },
  },
  {
    name: 'guest_count',
    patterns: [/guest/i, /rsvp/i, /invite/i, /attend/i, /headcount/i, /people/i],
    handler: (ctx) => {
      let msg = `👥 **Guest Summary for ${ctx.eventName}**\n\n`;
      msg += `• Invited: ${ctx.guestCount}\n`;
      msg += `• Confirmed: ${ctx.confirmedGuests}\n`;
      msg += `• Response rate: ${Math.round((ctx.confirmedGuests / Math.max(1, ctx.guestCount)) * 100)}%\n\n`;
      if (ctx.confirmedGuests < ctx.guestCount * 0.5) {
        msg += `📨 Consider sending follow-up reminders to boost RSVPs.`;
      } else {
        msg += `✅ Good response rate so far!`;
      }
      return msg;
    },
  },
  {
    name: 'risk_check',
    patterns: [/risk/i, /alert/i, /warning/i, /problem/i, /issue/i, /danger/i, /worry/i],
    handler: (ctx) => {
      let msg = `⚠️ **Risk Alerts for ${ctx.eventName}**\n\n`;
      if (ctx.risks && ctx.risks.length > 0) {
        for (const r of ctx.risks) {
          const icon = r.severity === 'critical' ? '🔴' : '🟡';
          msg += `${icon} ${r.message}\n`;
        }
      } else {
        msg += `✅ No critical risks detected. Things are looking great!`;
      }
      return msg;
    },
  },
  {
    name: 'countdown',
    patterns: [/countdown/i, /days?\s*(left|remaining|until|to)/i, /how\s*(long|many\s*days)/i, /when/i],
    handler: (ctx) => {
      if (ctx.daysToEvent <= 0) {
        return `🎉 Your event "${ctx.eventName}" is today or has already happened! Hope it was amazing!`;
      }
      let msg = `📅 **${ctx.daysToEvent} days** until ${ctx.eventName}!\n\n`;
      if (ctx.daysToEvent <= 7) msg += `🔥 It's this week! Final push time!`;
      else if (ctx.daysToEvent <= 30) msg += `⚡ Less than a month — focus on confirmations and details.`;
      else if (ctx.daysToEvent <= 90) msg += `👍 Good runway. Keep making steady progress.`;
      else msg += `🧘 Plenty of time. Stay organized and enjoy the planning!`;
      return msg;
    },
  },
];

/**
 * Match user message to an intent and generate a response.
 * @param {string} message - user message
 * @param {ChatContext} context - plan summary
 * @returns {{intent: string, response: string}}
 */
export function handleIntent(message, context) {
  const trimmed = (message || '').trim();

  if (!trimmed) {
    return {
      intent: 'empty',
      response: 'Please type a question about your event plan! I can help with budget, tasks, guests, weather planning, and more.',
    };
  }

  // Try to match intent
  for (const intent of INTENTS) {
    for (const pattern of intent.patterns) {
      if (pattern.test(trimmed)) {
        return {
          intent: intent.name,
          response: intent.handler(context),
        };
      }
    }
  }

  // Fallback — no match
  return {
    intent: 'unknown',
    response: `I'm not sure I understand that question. Here are things I can help with:\n\n• **Budget** — "Am I over budget?"\n• **Tasks** — "What should I do this week?"\n• **Guests** — "How many guests confirmed?"\n• **Readiness** — "How is my progress?"\n• **Weather** — "Suggest a rain plan"\n• **Risks** — "Are there any risks?"\n• **Countdown** — "How many days left?"\n\nTry asking one of these! 😊`,
  };
}

/**
 * Get all supported intent names and their trigger keywords (for testing).
 * @returns {Array<{name: string, keywords: string[]}>}
 */
export function getSupportedIntents() {
  return INTENTS.map(i => ({
    name: i.name,
    keywords: i.patterns.map(p => p.source),
  }));
}
