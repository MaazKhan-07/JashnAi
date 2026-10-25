/** Health check route */
import { Router } from 'express';
import { isGeminiAvailable } from '../services/gemini.js';

const router = Router();

router.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiAvailable: isGeminiAvailable(),
    version: '1.0.0',
  });
});

export default router;
