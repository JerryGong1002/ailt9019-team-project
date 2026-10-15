const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseAmount, statistics, shiftDay, validDate, demoEntries } = require('../dist/app.js');

test('amounts use integer cents and reject invalid input', () => {
  assert.equal(parseAmount('0.10') + parseAmount('0.20'), 30);
  assert.equal(parseAmount('9999999.99'), 999999999);
  for (const v of ['0', '-1', '1.234', 'NaN', '1e3', '10000000', '', '.']) assert.throws(() => parseAmount(v));
});
test('seven-day window includes both endpoints and excludes future records', () => {
  const rows = [
    { date: '2026-09-29', cents: 10, category: 'food', createdAt: 3 },
    { date: '2026-09-23', cents: 20, category: 'transport', createdAt: 2 },
    { date: '2026-09-22', cents: 999, category: 'food', createdAt: 1 },
    { date: '2026-09-30', cents: 888, category: 'food', createdAt: 4 },
  ];
  const s = statistics(rows, '7', '2026-09-29');
  assert.equal(s.total, 30); assert.equal(s.rows.length, 2); assert.equal(s.days, 7);
  assert.equal(s.buckets.reduce((sum, b) => sum + b.cents, 0), 30);
  assert.equal(s.categories.reduce((sum, c) => sum + c.cents, 0), 30);
});
test('empty periods and calendar boundaries', () => {
  assert.equal(statistics([], '7', '2026-09-29').average, 0);
  assert.equal(statistics([], 'all', '2026-09-29').days, 1);
  assert.equal(shiftDay('2026-03-01', -1), '2026-02-28');
  assert.equal(shiftDay('2024-03-01', -1), '2024-02-29');
  assert.equal(shiftDay('2026-01-01', -1), '2025-12-31');
  assert.equal(validDate('2026-02-30'), false);
});
test('synthetic data totals match independently summed amounts', () => {
  const data = demoEntries('2026-09-29');
  const week = statistics(data, '7', '2026-09-29');
  // 58 + 12.50 + 249 + 76 + 42 + 98 + 128 + 24 + 65 + 48 + 18.50 + 35
  assert.equal(week.total, 85400); assert.equal(week.rows.length, 12); assert.equal(week.average, 12200);
  assert.equal(statistics(data, '30', '2026-09-29').total, 120900);
  assert.equal(statistics(data, 'all', '2026-09-29').days, 14);
});
test('long history aggregates remain bounded and conserve totals', () => {
  const s = statistics([{ date: '2020-01-01', cents: 12345, category: 'food', createdAt: 1 }, { date: '2026-09-29', cents: 67, category: 'other', createdAt: 2 }], 'all', '2026-09-29');
  assert.ok(s.buckets.length <= 30); assert.equal(s.buckets.reduce((n, b) => n + b.cents, 0), 12412);
});


test('new subcategories preserve legacy records and parent totals', () => {
  const { validCategory, SUBCATEGORIES } = require('../dist/app.js');
  assert.equal(validCategory('food', undefined), true);
  assert.equal(validCategory('food', 'food-1'), true);
  assert.equal(validCategory('food', 'pets-1'), false);
  assert.equal(validCategory('missing', undefined), false);
  const rows = Object.entries(SUBCATEGORIES).flatMap(([category, children]) => children.map(c => ({ category, subcategory: c.id, cents: 100, date: '2026-09-29', createdAt: 1 })));
  rows.push({ category: 'food', cents: 50, date: '2026-09-29', createdAt: 0 });
  const stats = statistics(rows, '7', '2026-09-29');
  assert.equal(stats.categories.reduce((sum, c) => sum + c.cents, 0), stats.total);
  assert.equal(stats.categories.find(c => c.id === 'food').cents, 650);
});

test('monthly and yearly totals exclude previous periods and future entries', () => {
  const entries = [
    ['2025-12-31', 900], ['2026-01-01', 100], ['2026-08-31', 200],
    ['2026-09-01', 300], ['2026-09-29', 400], ['2026-09-30', 800],
  ].map(([date, cents]) => ({ date, cents, category: 'food', createdAt: 1 }));
  const month = statistics(entries, 'month', '2026-09-29');
  assert.equal(month.total, 700); assert.equal(month.days, 29);
  assert.equal(month.start, '2026-09-01'); assert.equal(month.average, 24);
  assert.equal(statistics(entries, 'year', '2026-09-29').total, 1000);
  assert.equal(statistics(entries, 'month', '2026-01-01').total, 100);
});
test('custom range includes endpoints, empty days and leap day', () => {
  const entries = [
    ['2024-02-28', 100], ['2024-02-29', 200], ['2024-03-01', 300], ['2024-03-02', 900],
  ].map(([date, cents]) => ({ date, cents, category: 'food', createdAt: 1 }));
  const range = statistics(entries, { start: '2024-02-28', end: '2024-03-01' }, '2024-03-10');
  assert.equal(range.total, 600); assert.equal(range.days, 3); assert.equal(range.average, 200);
  assert.equal(range.buckets.reduce((sum, bucket) => sum + bucket.cents, 0), 600);
  assert.equal(statistics([], { start: '2024-02-29', end: '2024-02-29' }, '2024-03-10').average, 0);
  for (const period of [{ start: '2024-03-02', end: '2024-03-01' }, { start: '2024-02-30', end: '2024-03-01' }, { start: '2024-03-01', end: '2024-03-11' }]) {
    assert.throws(() => statistics(entries, period, '2024-03-10'));
  }
});
