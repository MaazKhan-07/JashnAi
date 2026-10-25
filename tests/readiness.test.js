/**
 * Readiness score engine tests.
 * Covers: bounds, monotonic behavior, component breakdown.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeReadiness } from '../server/engine/readiness.js';

describe('Readiness Score', () => {
  const baseInput = {
    tasks: [],
    vendors: [],
    budgetItems: [],
    totalBudget: 100000,
    guests: [],
    eventDate: futureDate(60),
  };

  it('returns 0-100 score', () => {
    const result = computeReadiness(baseInput);
    assert.ok(result.score >= 0 && result.score <= 100, `Score ${result.score} should be 0-100`);
  });

  it('returns higher score with more completed tasks', () => {
    const few = computeReadiness({
      ...baseInput,
      tasks: [
        { status: 'done', priority: 'high', critical: false, dueDate: futureDate(10) },
        { status: 'todo', priority: 'high', critical: false, dueDate: futureDate(20) },
      ],
    });
    const more = computeReadiness({
      ...baseInput,
      tasks: [
        { status: 'done', priority: 'high', critical: false, dueDate: futureDate(10) },
        { status: 'done', priority: 'high', critical: false, dueDate: futureDate(20) },
      ],
    });
    assert.ok(more.score >= few.score, 'More done tasks should not lower the score');
  });

  it('penalizes overdue critical tasks', () => {
    const noOverdue = computeReadiness({
      ...baseInput,
      tasks: [{ status: 'todo', priority: 'high', critical: true, dueDate: futureDate(10) }],
    });
    const overdue = computeReadiness({
      ...baseInput,
      tasks: [{ status: 'todo', priority: 'high', critical: true, dueDate: pastDate(5) }],
    });
    assert.ok(noOverdue.score >= overdue.score, 'Overdue critical task should lower score');
  });

  it('vendor booking increases vendor score', () => {
    const unbooked = computeReadiness({
      ...baseInput,
      vendors: [{ status: 'to-contact' }],
    });
    const booked = computeReadiness({
      ...baseInput,
      vendors: [{ status: 'booked' }],
    });
    assert.ok(booked.breakdown.vendorScore > unbooked.breakdown.vendorScore);
  });

  it('over-budget reduces budget score', () => {
    const healthy = computeReadiness({
      ...baseInput,
      budgetItems: [{ category: 'venue', allocated: 50000, spent: 30000 }],
    });
    const over = computeReadiness({
      ...baseInput,
      budgetItems: [{ category: 'venue', allocated: 50000, spent: 70000 }],
    });
    assert.ok(healthy.breakdown.budgetScore >= over.breakdown.budgetScore);
  });

  it('returns nextActions array', () => {
    const result = computeReadiness(baseInput);
    assert.ok(Array.isArray(result.nextActions));
  });

  it('returns risks array', () => {
    const result = computeReadiness(baseInput);
    assert.ok(Array.isArray(result.risks));
  });

  it('score is monotonically non-decreasing as tasks complete (no penalty case)', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => ({
      status: 'todo',
      priority: 'medium',
      critical: false,
      dueDate: futureDate(30 + i),
    }));

    let prevScore = 0;
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks.map((task, j) => ({
        ...task,
        status: j <= i ? 'done' : 'todo',
      }));
      const result = computeReadiness({ ...baseInput, tasks: t });
      assert.ok(result.score >= prevScore,
        `Score should be monotonically non-decreasing: ${result.score} >= ${prevScore}`);
      prevScore = result.score;
    }
  });

  it('guest RSVP progress increases score', () => {
    const noRsvp = computeReadiness({
      ...baseInput,
      guests: [{ rsvp: 'invited' }, { rsvp: 'invited' }],
    });
    const withRsvp = computeReadiness({
      ...baseInput,
      guests: [{ rsvp: 'confirmed' }, { rsvp: 'confirmed' }],
    });
    assert.ok(withRsvp.score >= noRsvp.score);
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
