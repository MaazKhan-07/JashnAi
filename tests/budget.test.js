/**
 * Budget engine tests.
 * Covers: allocation sums, priority boosts, tight-budget mode,
 * catering scaling, contingency, randomized inputs.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateBudget, largestRemainderRound } from '../server/engine/budget.js';

describe('Budget Engine', () => {
  const baseInput = {
    eventType: 'wedding',
    totalBudget: 1800000,
    currency: 'INR',
    guestCount: 250,
    eventDate: futureDate(150),
    priorities: ['food', 'photography', 'decor'],
  };

  it('allocations sum exactly to total budget', () => {
    const result = generateBudget(baseInput);
    const sum = result.allocations.reduce((s, a) => s + a.amount, 0);
    assert.equal(sum, 1800000, `Sum ${sum} should equal 1800000`);
  });

  it('all allocations are positive', () => {
    const result = generateBudget(baseInput);
    for (const a of result.allocations) {
      assert.ok(a.amount > 0, `${a.category} should have positive amount`);
      assert.ok(a.percentage > 0, `${a.category} should have positive percentage`);
    }
  });

  it('priority boost increases food (catering) category', () => {
    const withFood = generateBudget({ ...baseInput, priorities: ['food'] });
    const withoutFood = generateBudget({ ...baseInput, priorities: ['venue'] });
    const cateringWith = withFood.allocations.find(a => a.category === 'catering');
    const cateringWithout = withoutFood.allocations.find(a => a.category === 'catering');
    assert.ok(cateringWith.percentage > cateringWithout.percentage,
      'Catering should be higher when food is a priority');
  });

  it('priority boost increases photography category', () => {
    const withPhoto = generateBudget({ ...baseInput, priorities: ['photography'] });
    const withoutPhoto = generateBudget({ ...baseInput, priorities: ['venue'] });
    const photoWith = withPhoto.allocations.find(a => a.category === 'photography');
    const photoWithout = withoutPhoto.allocations.find(a => a.category === 'photography');
    assert.ok(photoWith.percentage > photoWithout.percentage,
      'Photography should be higher when it is a priority');
  });

  it('tight budget mode triggers for low per-head budget', () => {
    const tightInput = {
      ...baseInput,
      totalBudget: 200000,
      guestCount: 250,
    };
    const result = generateBudget(tightInput);
    assert.equal(result.tightBudget, true);
    assert.ok(result.mode.includes('tight'), 'Mode should indicate tight budget');
  });

  it('tight budget mode does NOT trigger for generous budget', () => {
    const result = generateBudget(baseInput);
    assert.equal(result.tightBudget, false);
  });

  it('contingency is higher for short lead time', () => {
    const shortLead = generateBudget({ ...baseInput, eventDate: futureDate(30) });
    const longLead = generateBudget({ ...baseInput, eventDate: futureDate(300) });
    assert.ok(shortLead.contingencyPercent > longLead.contingencyPercent,
      'Short lead should have higher contingency');
  });

  it('fast-track mode activates for short lead time', () => {
    const result = generateBudget({ ...baseInput, eventDate: futureDate(60) });
    assert.equal(result.fastTrack, true);
  });

  it('catering share scales with high guest count', () => {
    const high = generateBudget({ ...baseInput, guestCount: 400 });
    const low = generateBudget({ ...baseInput, guestCount: 30 });
    const cateringHigh = high.allocations.find(a => a.category === 'catering');
    const cateringLow = low.allocations.find(a => a.category === 'catering');
    assert.ok(cateringHigh.percentage > cateringLow.percentage,
      'Catering should scale up for large guest counts');
  });

  it('works for birthday event type', () => {
    const result = generateBudget({
      eventType: 'birthday',
      totalBudget: 90000,
      currency: 'INR',
      guestCount: 40,
      eventDate: futureDate(35),
      priorities: ['food', 'decor'],
    });
    const sum = result.allocations.reduce((s, a) => s + a.amount, 0);
    assert.equal(sum, 90000);
    assert.ok(result.allocations.some(a => a.category === 'cake'));
  });

  it('works for community event type', () => {
    const result = generateBudget({
      eventType: 'community',
      totalBudget: 250000,
      currency: 'INR',
      guestCount: 400,
      eventDate: futureDate(21),
      priorities: ['entertainment', 'food'],
    });
    const sum = result.allocations.reduce((s, a) => s + a.amount, 0);
    assert.equal(sum, 250000);
    assert.ok(result.allocations.some(a => a.category === 'entertainment'));
  });

  it('handles USD currency', () => {
    const result = generateBudget({
      ...baseInput,
      totalBudget: 25000,
      currency: 'USD',
    });
    const sum = result.allocations.reduce((s, a) => s + a.amount, 0);
    assert.equal(sum, 25000);
  });

  it('allocations sum exactly for randomized inputs', () => {
    const types = ['wedding', 'birthday', 'community'];
    for (let i = 0; i < 10; i++) {
      const budget = Math.floor(Math.random() * 5000000) + 10000;
      const guests = Math.floor(Math.random() * 500) + 10;
      const days = Math.floor(Math.random() * 300) + 10;
      const type = types[i % 3];
      const result = generateBudget({
        eventType: type,
        totalBudget: budget,
        currency: 'INR',
        guestCount: guests,
        eventDate: futureDate(days),
        priorities: ['food'],
      });
      const sum = result.allocations.reduce((s, a) => s + a.amount, 0);
      assert.equal(sum, budget, `Sum should equal budget ${budget} (type=${type}, guests=${guests})`);
    }
  });

  it('perGuestCost is computed correctly', () => {
    const result = generateBudget(baseInput);
    const expected = 1800000 / 250;
    assert.equal(result.perGuestCost, expected);
  });

  it('throws for unknown event type', () => {
    assert.throws(() => {
      generateBudget({ ...baseInput, eventType: 'conference' });
    }, /Unknown event type/);
  });
});

describe('Largest Remainder Rounding', () => {
  it('rounds amounts to sum exactly to total', () => {
    const pcts = { a: 33.33, b: 33.33, c: 33.34 };
    const cats = ['a', 'b', 'c'];
    const result = largestRemainderRound(pcts, cats, 100);
    const sum = result.reduce((s, r) => s + r.amount, 0);
    assert.equal(sum, 100);
  });

  it('handles uneven distributions', () => {
    const pcts = { a: 10, b: 20, c: 70 };
    const result = largestRemainderRound(pcts, ['a', 'b', 'c'], 1000);
    const sum = result.reduce((s, r) => s + r.amount, 0);
    assert.equal(sum, 1000);
  });
});

/** Helper: create an ISO date string N days in the future */
function futureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
