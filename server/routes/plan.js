/** Plan computation routes: budget, timeline, readiness */
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { BudgetRequestSchema, TimelineRequestSchema, ReadinessRequestSchema } from '../schemas.js';
import { generateBudget } from '../engine/budget.js';
import { generateTimeline, TimelineError } from '../engine/timeline.js';
import { computeReadiness } from '../engine/readiness.js';

const router = Router();

/**
 * POST /api/plan/budget
 * Generate budget allocations from event context.
 */
router.post('/api/plan/budget', validate(BudgetRequestSchema), (req, res) => {
  const result = generateBudget(req.body);
  res.json(result);
});

/**
 * POST /api/plan/timeline
 * Generate a backward-planned timeline.
 */
router.post('/api/plan/timeline', validate(TimelineRequestSchema), (req, res) => {
  try {
    const result = generateTimeline(req.body);
    res.json(result);
  } catch (err) {
    if (err instanceof TimelineError) {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
});

/**
 * POST /api/plan/readiness
 * Compute readiness score and risk alerts.
 */
router.post('/api/plan/readiness', validate(ReadinessRequestSchema), (req, res) => {
  const result = computeReadiness(req.body);
  res.json(result);
});

export default router;
