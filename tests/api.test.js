/**
 * API integration tests.
 * Tests health, valid/invalid payloads, rate-limit headers, and AI fallback.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../server/index.js';

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('API Integration', () => {
  it('GET /api/health returns ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.ok('geminiAvailable' in body);
  });

  it('POST /api/plan/budget with valid input returns allocations', async () => {
    const res = await fetch(`${baseUrl}/api/plan/budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'wedding',
        totalBudget: 1800000,
        currency: 'INR',
        guestCount: 250,
        eventDate: futureDate(150),
        priorities: ['food'],
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.allocations.length > 0);
    const sum = body.allocations.reduce((s, a) => s + a.amount, 0);
    assert.equal(sum, 1800000);
  });

  it('POST /api/plan/budget with invalid input returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/plan/budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'invalid' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error);
  });

  it('POST /api/plan/timeline with valid input returns tasks', async () => {
    const res = await fetch(`${baseUrl}/api/plan/timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'birthday',
        eventDate: futureDate(60),
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.tasks.length > 0);
  });

  it('POST /api/plan/timeline with past date returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/plan/timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'wedding',
        eventDate: pastDate(10),
      }),
    });
    assert.equal(res.status, 400);
  });

  it('POST /api/ai/ideas returns offline fallback without API key', async () => {
    const res = await fetch(`${baseUrl}/api/ai/ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'wedding',
        eventName: 'Test Wedding',
        guestCount: 200,
        style: 'Royal',
        dietary: ['veg'],
        priorities: ['food'],
        budget: 1500000,
        currency: 'INR',
        city: 'Mumbai',
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.source, 'offline');
    assert.ok(body.ideas.themes.length > 0);
  });

  it('POST /api/ai/chat returns offline fallback without API key', async () => {
    const res = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Am I over budget?',
        context: {
          eventName: 'Test',
          totalBudget: 100000,
          totalSpent: 120000,
          currency: 'INR',
        },
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.source, 'offline');
    assert.ok(body.response.includes('Budget'));
  });

  it('API returns rate-limit headers', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    // express-rate-limit adds these standard headers
    assert.ok(
      res.headers.has('ratelimit-limit') || res.headers.has('x-ratelimit-limit'),
      'Should have rate-limit headers'
    );
  });

  it('GET /api/unknown returns 404', async () => {
    const res = await fetch(`${baseUrl}/api/nonexistent`);
    assert.equal(res.status, 404);
  });

  it('POST /api/plan/readiness returns score', async () => {
    const res = await fetch(`${baseUrl}/api/plan/readiness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks: [
          { status: 'done', priority: 'high', critical: false, dueDate: futureDate(10) },
          { status: 'todo', priority: 'medium', critical: false, dueDate: futureDate(20) },
        ],
        vendors: [{ status: 'booked' }],
        budgetItems: [{ category: 'venue', allocated: 50000, spent: 40000 }],
        totalBudget: 100000,
        guests: [{ rsvp: 'confirmed' }],
        eventDate: futureDate(60),
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.score >= 0 && body.score <= 100);
    assert.ok(body.breakdown);
  });
});

function futureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function pastDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}
