/**
 * Offline ideas engine tests.
 * Covers: determinism, dietary respect, output structure.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateIdeas } from '../server/engine/ideas.js';

describe('Offline Ideas Engine', () => {
  const baseInput = {
    eventType: 'wedding',
    eventName: 'Test Wedding',
    guestCount: 200,
    style: 'Royal',
    dietary: ['veg'],
    priorities: ['food', 'decor'],
    budget: 1500000,
    currency: 'INR',
    city: 'Mumbai',
  };

  it('returns all idea categories', () => {
    const result = generateIdeas(baseInput);
    assert.ok(result.ideas.themes.length > 0, 'Should have themes');
    assert.ok(result.ideas.decor.length > 0, 'Should have decor');
    assert.ok(result.ideas.menu.length > 0, 'Should have menu');
    assert.ok(result.ideas.entertainment.length > 0, 'Should have entertainment');
    assert.ok(result.ideas.returnGifts.length > 0, 'Should have return gifts');
    assert.ok(result.ideas.invitationWording.length > 0, 'Should have invitation');
    assert.ok(result.ideas.runOfShow.length > 0, 'Should have run of show');
  });

  it('source is offline', () => {
    const result = generateIdeas(baseInput);
    assert.equal(result.source, 'offline');
  });

  it('is deterministic for same input', () => {
    const r1 = generateIdeas(baseInput);
    const r2 = generateIdeas(baseInput);
    assert.deepEqual(r1, r2, 'Same input should produce same output');
  });

  it('produces different results for different events', () => {
    const r1 = generateIdeas(baseInput);
    const r2 = generateIdeas({ ...baseInput, eventName: 'Different Wedding', city: 'Delhi' });
    // At least some outputs should differ
    const same = r1.ideas.themes.join() === r2.ideas.themes.join()
      && r1.ideas.decor.join() === r2.ideas.decor.join();
    assert.ok(!same, 'Different events should produce different suggestions');
  });

  it('vegan menu has no non-veg items', () => {
    const result = generateIdeas({ ...baseInput, dietary: ['vegan'] });
    const menuText = result.ideas.menu.join(' ').toLowerCase();
    assert.ok(!menuText.includes('chicken'), 'Vegan menu should not contain chicken');
    assert.ok(!menuText.includes('mutton'), 'Vegan menu should not contain mutton');
    assert.ok(!menuText.includes('fish'), 'Vegan menu should not contain fish');
    assert.ok(!menuText.includes('prawn'), 'Vegan menu should not contain prawn');
    assert.ok(!menuText.includes('butter chicken'), 'Vegan menu should not contain butter chicken');
  });

  it('veg menu has no non-veg items', () => {
    const result = generateIdeas({ ...baseInput, dietary: ['veg'] });
    const menuText = result.ideas.menu.join(' ').toLowerCase();
    assert.ok(!menuText.includes('chicken'), 'Veg menu should not contain chicken');
    assert.ok(!menuText.includes('mutton'), 'Veg menu should not contain mutton');
  });

  it('works for birthday event type', () => {
    const result = generateIdeas({
      ...baseInput,
      eventType: 'birthday',
      eventName: 'Riya Birthday',
    });
    assert.ok(result.ideas.themes.length >= 2);
  });

  it('works for community event type', () => {
    const result = generateIdeas({
      ...baseInput,
      eventType: 'community',
      eventName: 'Diwali Mela',
    });
    assert.ok(result.ideas.themes.length >= 2);
  });
});
