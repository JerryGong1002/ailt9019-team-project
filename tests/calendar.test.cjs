const test = require('node:test');
const assert = require('node:assert/strict');
const {calendarMonth,heatLevel,replaceLedgerRecord} = require('../dist/calendar.js');
const {statistics,shiftDay} = require('../dist/app.js');
test('calendar spans leap years, Monday-first offsets and empty months', () => {
  assert.equal(calendarMonth([], '2024-02','2026-09-29').days.length,29);
  assert.equal(calendarMonth([], '2026-02','2026-09-29').days.length,28);
  assert.equal(calendarMonth([], '2026-09','2026-09-29').offset,1);
  assert.equal(calendarMonth([], '1900-01','2026-09-29').actual,0);
  assert.equal(calendarMonth([], '0001-01','2026-09-29').days.length,31);
  assert.equal(shiftDay('2026-12-31',1),'2027-01-01');
});
test('daily totals include future entries while actual statistics exclude them until due', () => {
 const entries = [{date:'2026-09-29', cents:100, category:'food', createdAt:1},{date:'2026-09-29',cents:300,category:'food',createdAt:2},{date:'2026-09-30',cents:800,category:'food',createdAt:3}];
 const month = calendarMonth(entries,'2026-09','2026-09-29');
 assert.equal(month.actual,400); assert.equal(month.future,800);
 assert.equal(month.days[28].level,2); assert.equal(month.days[29].level,4);
 assert.equal(statistics(entries,'month','2026-09-29').total,400);
 assert.equal(statistics(entries,'month','2026-09-30').total,1200);
 assert.equal(calendarMonth(entries.slice(0,2),'2026-09','2026-09-29').days[28].level,4);
});
test('heat boundaries and large totals', () => {
 assert.deepEqual([0,1,25,26,50,51,75,76,100].map(n=>heatLevel(n,100)),[0,1,1,2,2,3,3,4,4]);
 assert.equal(heatLevel(999999999*100,999999999*100),4);
});
test('editing preserves identity, replaces fields, moves dates, and never mutates original', () => {
 const original={id:'a',createdAt:42,date:'2026-09-01',cents:100,category:'food',note:'old'};
 const next=replaceLedgerRecord([original],{id:'new',createdAt:99,date:'2026-10-01',cents:200,category:'living'},'a');
 assert.equal(next[0].id,'a'); assert.equal(next[0].createdAt,42); assert.equal(next[0].note,undefined);
 assert.equal(original.note,'old'); assert.equal(calendarMonth(next,'2026-09','2026-09-29').actual,0);
 assert.throws(()=>replaceLedgerRecord([],original,'missing'));
 assert.equal(replaceLedgerRecord([],original,null).length,1);
});
