/** AI routes: ideas & chat with Gemini + offline fallback */
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { IdeasRequestSchema, ChatRequestSchema } from '../schemas.js';
import { generateIdeas } from '../engine/ideas.js';
import { handleIntent } from '../engine/intents.js';
import { isGeminiAvailable, generateIdeasWithGemini, chatWithGemini } from '../services/gemini.js';
import { aiLimiter } from '../middleware/rateLimit.js';

const router = Router();

/**
 * POST /api/ai/ideas
 * Generate personalized event ideas.
 * Uses Gemini if available, falls back to offline engine.
 */
router.post('/api/ai/ideas', aiLimiter, validate(IdeasRequestSchema), async (req, res, next) => {
  try {
    if (isGeminiAvailable()) {
      try {
        const result = await generateIdeasWithGemini(req.body);
        return res.json(result);
      } catch (err) {
        console.error('[AI] Gemini failed, falling back to offline engine:', err.message);
        // Fall through to offline
      }
    }

    // Offline fallback
    const result = generateIdeas(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/chat
 * Answer planning questions with context awareness.
 * Uses Gemini if available, falls back to intent matching.
 */
router.post('/api/ai/chat', aiLimiter, validate(ChatRequestSchema), async (req, res, next) => {
  try {
    const { message, context } = req.body;

    if (isGeminiAvailable()) {
      try {
        const result = await chatWithGemini(message, context);
        result.response += '\n\n💡 *Note: AI suggestions are for guidance only. Please verify important details independently.*';
        return res.json(result);
      } catch (err) {
        console.error('[AI] Gemini chat failed, falling back to offline:', err.message);
      }
    }

    // Offline fallback
    const result = handleIntent(message, context);
    result.source = 'offline';
    result.response += '\n\n💡 *Note: These are smart suggestions from the offline engine. For richer responses, configure a Gemini API key.*';
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
