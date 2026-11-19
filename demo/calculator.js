'use strict';

// Small decimal calculator. Rational arithmetic avoids rounding intermediate
// results (10 / 3 * 3 stays 10); only the final amount is rounded to cents.
const ExpenseCalculator = (() => {
  const INVALID = '请输入完整的计算式。';
  function normalize(raw) {
    const value = String(raw).replace(/\s/g, '').replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-');
    if (value.length > 120 || /[^\d.+*/-]/.test(value)) throw new Error(INVALID);
    return value;
  }
  function evaluate(raw) {
    const value = normalize(raw);
    const tokens = value.match(/\d+(?:\.\d{0,2})?|[+*/-]/g) || [];
    if (!value || tokens.join('') !== value) throw new Error(INVALID);
    let index = 0;
    function fraction(n, d = 1n) {
      if (d === 0n) throw new Error('不能除以零。');
      if (d < 0n) { n = -n; d = -d; }
      let a = n < 0n ? -n : n, b = d;
      while (b) [a, b] = [b, a % b];
      return { n: n / a, d: d / a };
    }
    function number() {
      let sign = 1n;
      if (tokens[index] === '-' || tokens[index] === '+') sign = tokens[index++] === '-' ? -1n : 1n;
      const token = tokens[index++];
      if (!token || !/^\d+(?:\.\d{0,2})?$/.test(token)) throw new Error(INVALID);
      const [whole, decimal = ''] = token.split('.');
      return fraction(sign * BigInt(whole + decimal), 10n ** BigInt(decimal.length));
    }
    function product() {
      let left = number();
      while (tokens[index] === '*' || tokens[index] === '/') {
        const operator = tokens[index++], right = number();
        left = operator === '*' ? fraction(left.n * right.n, left.d * right.d) : fraction(left.n * right.d, left.d * right.n);
      }
      return left;
    }
    let result = product();
    while (tokens[index] === '+' || tokens[index] === '-') {
      const operator = tokens[index++], right = product();
      result = fraction(result.n * right.d + (operator === '+' ? 1n : -1n) * right.n * result.d, result.d * right.d);
    }
    if (index !== tokens.length) throw new Error(INVALID);
    const absolute = (result.n < 0n ? -result.n : result.n) * 100n;
    const rounded = (absolute * 2n + result.d) / (2n * result.d);
    if (rounded > 999999999n) throw new Error('计算结果超出金额范围。');
    const cents = Number(result.n < 0n ? -rounded : rounded);
    const digits = rounded.toString().padStart(3, '0');
    return { cents, amount: (cents < 0 ? '-' : '') + digits.slice(0, -2) + '.' + digits.slice(-2) };
  }
  function press(state, key) {
    let expression = state.expression;
    if (key === 'clear') return { expression: '', settled: false };
    if (key === 'backspace') return { expression: expression.slice(0, -1), settled: false };
    if (key === '=') { evaluate(expression); return { expression, settled: true }; }
    if (/^[+*/-]$/.test(key)) {
      if (state.settled) expression = evaluate(expression).amount;
      if (!expression || expression === '-') return { expression: key === '-' ? '-' : '', settled: false };
      return { expression: expression.replace(/[+*/-]+$/, '') + key, settled: false };
    }
    if (!/^[\d.]$/.test(key)) return state;
    if (state.settled) expression = '';
    const operand = expression.split(/[+*/-]/).at(-1);
    if (key === '.') {
      if (operand.includes('.')) return state;
      expression += operand ? '.' : '0.';
    } else {
      if (operand.includes('.') && operand.split('.')[1].length >= 2) return state;
      if (!operand.includes('.') && operand.length >= 7) return state;
      expression = operand === '0' ? expression.slice(0, -1) + key : expression + key;
    }
    return expression.length <= 120 ? { expression, settled: false } : state;
  }
  return { normalize, evaluate, press };
})();
if (typeof module !== 'undefined') module.exports = ExpenseCalculator;
