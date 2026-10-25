/**
 * Timeline engine tests.
 * Covers: ordering, compression, critical-path, past-date rejection, boundary.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateTimeline, TimelineError } from '../server/engine/timeline.js';

describe('Timeline Engine', () => {
  it('generates tasks in chronological order', () => {
    const result = generateTimeline({
      eventType: 'wedding',
      eventDate: futureDate(200),
    });
    for (let i = 1; i < result.tasks.length; i++) {
      assert.ok(
        new Date(result.tasks[i].dueDate) >= new Date(result.tasks[i - 1].dueDate),
        `Task ${i} should be on or after task ${i - 1}`
      );
    }
  });

  it('returns standard mode for long lead time', () => {
    const result = generateTimeline({
      eventType: 'wedding',
      eventDate: futureDate(400),
    });
    assert.equal(result.mode, 'standard');
  });

  it('returns fast-track mode for short lead time', () => {
    const result = generateTimeline({
      eventType: 'wedding',
      eventDate: futureDate(60),
    });
    assert.equal(result.mode, 'fast-track');
  });

  it('compression ratio is less than 1 in fast-track', () => {
    const result = generateTimeline({
      eventType: 'wedding',
      eventDate: futureDate(60),
    });
    assert.ok(result.compressionRatio < 1, 'Compression ratio should be < 1');
  });

  it('critical tasks come first in fast-track mode', () => {
    const result = generateTimeline({
      eventType: 'wedding',
      eventDate: futureDate(30),
    });
    const firstFew = result.tasks.slice(0, 5);
    const critCount = firstFew.filter(t => t.critical).length;
    assert.ok(critCount >= 3, 'First 5 tasks should contain multiple critical tasks in fast-track');
  });

  it('throws TimelineError for past dates', () => {
    assert.throws(
      () => generateTimeline({
        eventType: 'wedding',
        eventDate: pastDate(10),
      }),
      (err) => err instanceof TimelineError && err.message.includes('past')
    );
  });

  it('throws TimelineError for dates under 3 days away', () => {
    assert.throws(
      () => generateTimeline({
        eventType: 'birthday',
        eventDate: futureDate(1),
      }),
      (err) => err instanceof TimelineError && err.message.includes('3 days')
    );
  });

  it('accepts dates exactly 3 days away', () => {
    const result = generateTimeline({
      eventType: 'birthday',
      eventDate: futureDate(3),
    });
    assert.ok(result.tasks.length > 0);
  });

  it('works for community events', () => {
    const result = generateTimeline({
      eventType: 'community',
      eventDate: futureDate(21),
    });
    assert.ok(result.tasks.length > 0);
    assert.equal(result.mode, 'fast-track');
  });

  it('tasks have required fields', () => {
    const result = generateTimeline({
      eventType: 'birthday',
      eventDate: futureDate(60),
    });
    for (const task of result.tasks) {
      assert.ok(task.id, 'Task should have id');
      assert.ok(task.phase, 'Task should have phase');
      assert.ok(task.task, 'Task should have task name');
      assert.ok(task.dueDate, 'Task should have dueDate');
      assert.ok(task.owner, 'Task should have owner');
      assert.ok(task.priority, 'Task should have priority');
      assert.equal(task.status, 'todo', 'Initial status should be todo');
    }
  });

  it('no task is due after event date', () => {
    const evtDate = futureDate(100);
    const result = generateTimeline({
      eventType: 'wedding',
      eventDate: evtDate,
    });
    for (const task of result.tasks) {
      assert.ok(new Date(task.dueDate) <= new Date(evtDate),
        `Task "${task.task}" should not be due after event date`);
    }
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
