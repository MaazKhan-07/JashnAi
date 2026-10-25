/**
 * Intent handler tests.
 * Covers: common questions, unknown intent fallback, empty input.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { handleIntent, getSupportedIntents } from '../server/engine/intents.js';

const mockContext = {
  eventName: 'Test Event',
  eventType: 'wedding',
  totalBudget: 1800000,
  totalSpent: 900000,
  currency: '₹',
  guestCount: 250,
  confirmedGuests: 150,
  eventDate: '2027-03-15',
  daysToEvent: 141,
  readinessScore: 65,
  nextActions: ['Complete overdue tasks', 'Book caterer'],
  upcomingTasks: [
    { task: 'Book venue', dueDate: '2026-11-01', status: 'todo' },
  ],
  budgetItems: [
    { category: 'venue', allocated: 360000, spent: 350000 },
    { category: 'catering', allocated: 450000, spent: 500000 },
  ],
  risks: [
    { type: 'budget', message: 'Catering over budget', severity: 'warning' },
  ],
};

describe('Intent Handler', () => {
  it('matches budget intent', () => {
    const result = handleIntent('Am I over budget?', mockContext);
    assert.equal(result.intent, 'budget_status');
    assert.ok(result.response.includes('Budget Status'));
  });

  it('matches task intent', () => {
    const result = handleIntent('What should I do this week?', mockContext);
    assert.equal(result.intent, 'this_week');
    assert.ok(result.response.includes('Upcoming Tasks'));
  });

  it('matches readiness intent', () => {
    const result = handleIntent('How is my progress?', mockContext);
    assert.equal(result.intent, 'readiness');
    assert.ok(result.response.includes('Readiness Score'));
  });

  it('matches rain plan intent', () => {
    const result = handleIntent('Suggest a rain plan', mockContext);
    assert.equal(result.intent, 'rain_plan');
    assert.ok(result.response.includes('Rain'));
  });

  it('matches guest count intent', () => {
    const result = handleIntent('How many guests confirmed?', mockContext);
    assert.equal(result.intent, 'guest_count');
    assert.ok(result.response.includes('Guest Summary'));
  });

  it('matches risk intent', () => {
    const result = handleIntent('Are there any risks?', mockContext);
    assert.equal(result.intent, 'risk_check');
    assert.ok(result.response.includes('Risk'));
  });

  it('matches countdown intent', () => {
    const result = handleIntent('How many days left?', mockContext);
    assert.equal(result.intent, 'countdown');
    assert.ok(result.response.includes('days'));
  });

  it('returns unknown for gibberish', () => {
    const result = handleIntent('xyzzy foobar baz', mockContext);
    assert.equal(result.intent, 'unknown');
  });

  it('returns empty intent for empty string', () => {
    const result = handleIntent('', mockContext);
    assert.equal(result.intent, 'empty');
  });

  it('getSupportedIntents returns all intents', () => {
    const intents = getSupportedIntents();
    assert.ok(intents.length >= 7, 'Should have at least 7 intents');
    for (const i of intents) {
      assert.ok(i.name, 'Intent should have name');
      assert.ok(i.keywords.length > 0, 'Intent should have keywords');
    }
  });
});
