import dotenv from 'dotenv';
dotenv.config();

/** @type {import('./types').AppConfig} */
const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: 'gemini-2.0-flash',
  geminiTimeout: 15000,
  rateLimitWindow: 15 * 60 * 1000,
  rateLimitMax: 100,
  aiRateLimitMax: 20,
  jsonLimit: '50kb',
};

export default config;
