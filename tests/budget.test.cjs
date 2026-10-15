const { test } = require('node:test');
const assert = require('node:assert/strict');
const B = require('../dist/budget.js');

test('monthly settings inherit without carrying balances; overrides do not change other months', () => {
  const base = B.update(B.empty(), '2026-12', 300000);
  const override = B.update(base, '2027-01', 100000, 'month');
  assert.equal(B.resolve(base, '2026-11'), null);
  assert.equal(B.resolve(override, '2027-01'), 100000);
  assert.equal(B.resolve(override, '2027-02'), 300000);
  const changed = B.update(override, '2027-01', 200000);
  assert.equal(B.resolve(changed, '2026-12'), 300000);
  assert.equal(B.resolve(changed, '2027-01'), 200000);
  assert.equal(B.resolve(changed, '2027-02'), 200000);
  assert.equal(B.resolve(override, '2027-01'), 100000);
  const stopped = B.update(changed, '2027-02', null);
  assert.equal(B.resolve(stopped, '2027-01'), 200000);
  assert.equal(B.resolve(stopped, '2027-03'), null);
  assert.equal(B.resolve(B.update(stopped, '2027-04', 500000), '2027-05'), 500000);
});

test('spending includes the whole current month through today, including hidden categories', () => {
  const data = B.update(B.empty(), '2024-02', 10000);
  const entries = [{date:'2024-01-31',cents:5000}, {date:'2024-02-01',cents:10}, {date:'2024-02-28',cents:20}, {date:'2024-02-29',cents:9000}];
  const s = B.summarize(data, entries, '2024-02-28');
  assert.equal(s.spent, 30); assert.equal(s.remaining, 9970); assert.equal(s.days, 2);
  assert.equal(B.summarize(data, entries, '2024-02-29').spent, 9030);
  assert.equal(B.summarize(data, entries, '2024-03-01').remaining, 10000);
  assert.equal(B.summarize(data, entries, '2024-03-01').days, 31);
});

test('thresholds are exact and remain independent of displayed percentage rounding', () => {
  const data = B.update(B.empty(), '2026-10', 10000);
  for (const [cents, status] of [[0,'normal'], [7999,'normal'],[8000,'near'],[9999,'near'],[10000,'full'],[10001,'over']]) {
    const s = B.summarize(data, [{date:'2026-10-01',cents}], '2026-10-12');
    assert.equal(s.status, status); assert.equal(s.remaining, 10000-cents);
  }
  assert.equal(B.summarize(B.empty(), [], '2026-10-12').status, 'unset');
  assert.equal(B.summarize(B.empty(), [], '2026-10-12').remaining, null);
});

test('corrupted storage and invalid configuration are rejected', () => {
  for (const bad of [null, {}, {version:2,changes:{},overrides:{}}, {version:1,changes:[],overrides:{}}, {version:1,changes:{'2026-13':300},overrides:{}}, {version:1,changes:{'2026-10':0},overrides:{}}, {version:1,changes:{},overrides:{'2026-10':1.5}}]) assert.throws(() => B.validate(bad));
  for (const cents of [0,-1,1.5,1000000000,NaN]) assert.throws(() => B.update(B.empty(),'2026-10',cents));
  assert.deepEqual(B.validate(JSON.parse(JSON.stringify(B.empty()))), B.empty());
});
