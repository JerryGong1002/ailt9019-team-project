const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluate, press } = require('../dist/calculator.js');
const { parseAmount } = require('../dist/app.js');

test('money arithmetic is exact and uses normal operator precedence', () => {
  for (const [expression, expected] of [['0.1+0.2', 30], ['12+3*4-8/2', 2000], ['10/3*3', 1000], ['1/8', 13], ['1.005*1', null], ['5−2×3', -100], ['6÷4', 150], ['8/4/2', 100], ['1-0.99', 1], ['2*-3+10', 400]]) {
    if (expected === null) assert.throws(() => evaluate(expression));
    else assert.equal(evaluate(expression).cents, expected, expression);
  }
});
test('only the final result is rounded, half cents round away from zero', () => {
  assert.equal(evaluate('1/8+1/8').amount, '0.25');
  assert.equal(evaluate('-1/8').amount, '-0.13');
  assert.equal(evaluate('0/3').amount, '0.00');
});
test('invalid expressions, division by zero, overflow and code are rejected', () => {
  for (const expression of ['', '.', '12+', '12*', '2//2', '1..2', '1.234', '1e3', '1/0', '0/0', '9999999.99+0.01', 'alert(1)', '2'.repeat(121)]) assert.throws(() => evaluate(expression), expression);
  assert.equal(evaluate('9999999.99').cents, 999999999);
  for (const expression of ['0', '3-4', '1/9999999']) assert.throws(() => parseAmount(evaluate(expression).amount));
});
test('keypad handles decimals, correction, operator replacement and clear', () => {
  let state = { expression: '', settled: false };
  for (const key of ['.', '1', '.', '2', '3', '+', '*', '2']) state = press(state, key);
  assert.equal(state.expression, '0.12*2');
  assert.equal(evaluate(state.expression).amount, '0.24');
  state = press(state, 'backspace');
  assert.throws(() => evaluate(state.expression));
  assert.deepEqual(press(state, 'clear'), { expression: '', settled: false });
});
test('equals can continue an amount or start a fresh entry', () => {
  const settled = press({ expression: '5+3', settled: false }, '=');
  assert.equal(press(settled, '+').expression, '8.00+');
  assert.equal(press(settled, '4').expression, '4');
  assert.equal(press(settled, '.').expression, '0.');
  assert.equal(press({expression: '0', settled: false}, '5').expression, '5');
});
