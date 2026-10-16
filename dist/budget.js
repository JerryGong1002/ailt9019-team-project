'use strict';

// Null is an explicit stop; absent months inherit the latest effective change.
const Budget = (() => {
  const empty = () => ({ version: 1, changes: {}, overrides: {} });
  const monthOK = value => /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
  const amountOK = value => value === null || (Number.isSafeInteger(value) && value > 0 && value <= 999999999);
  function validate(data) {
    if (!data || data.version !== 1) throw new Error('invalid budget');
    for (const map of [data.changes, data.overrides]) {
      if (!map || typeof map !== 'object' || Array.isArray(map) || Object.entries(map).some(([m, v]) => !monthOK(m) || !amountOK(v))) throw new Error('invalid budget');
    }
    return data;
  }
  function resolve(data, month) {
    if (Object.hasOwn(data.overrides, month)) return data.overrides[month];
    const latest = Object.keys(data.changes).filter(m => m <= month).sort().at(-1);
    return latest ? data.changes[latest] : null;
  }
  function update(data, month, cents, scope = 'future') {
    validate(data);
    if (!monthOK(month) || !amountOK(cents) || !['month', 'future'].includes(scope)) throw new Error('invalid budget change');
    const next = { version: 1, changes: { ...data.changes }, overrides: { ...data.overrides } };
    if (scope === 'month') next.overrides[month] = cents;
    else { next.changes[month] = cents; delete next.overrides[month]; }
    return next;
  }
  function summarize(data, entries, today) {
    const month = today.slice(0, 7), limit = resolve(data, month);
    const spent = entries.filter(e => e.date >= `${month}-01` && e.date <= today).reduce((sum, e) => sum + e.cents, 0);
    const [year, mon, day] = today.split('-').map(Number);
    const days = new Date(year, mon, 0).getDate() - day + 1;
    const remaining = limit === null ? null : limit - spent;
    const status = limit === null ? 'unset' : spent > limit ? 'over' : spent === limit ? 'full' : spent * 5 >= limit * 4 ? 'near' : 'normal';
    return { month, limit, spent, remaining, days, status, percent: limit === null ? 0 : spent / limit * 100 };
  }
  return { empty, validate, resolve, update, summarize };
})();
if (typeof module !== 'undefined') module.exports = Budget;

function createBudget({ entries, mode, today, parseAmount, money, notify }) {
  const key = 'spending-analyzer.budget.v1';
  let personal = Budget.empty(), readable = true;
  let demo = Budget.update(Budget.empty(), today().slice(0, 7), 300000);
  try { const raw = localStorage.getItem(key); if (raw !== null) personal = Budget.validate(JSON.parse(raw)); }
  catch { readable = false; }
  const $ = id => document.getElementById(id);
  const card = document.createElement('button');
  card.type = 'button'; card.id = 'budget-card'; card.className = 'panel budget-card';
  card.setAttribute('aria-haspopup', 'dialog'); card.setAttribute('aria-controls', 'budget-dialog');
  card.innerHTML = '<span class="budget-heading"><span>月预算</span><span aria-hidden="true">↗</span></span><strong id="budget-balance"></strong><span id="budget-usage"></span><span class="budget-track" aria-hidden="true"><span id="budget-fill"></span></span><span id="budget-status"></span>';
  document.querySelector('.overview > .stats').after(card);
  document.body.insertAdjacentHTML('beforeend', `<dialog id="budget-dialog" aria-labelledby="budget-title">
    <div class="settings-heading"><h2 id="budget-title">月预算</h2><button type="button" id="budget-close" class="round-close" aria-label="关闭预算"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
    <p id="budget-month" data-no-translate></p><div id="budget-details" class="budget-details"></div>
    <form id="budget-form" novalidate><label for="budget-amount">预算金额（HKD）</label><input id="budget-amount" inputmode="decimal" autocomplete="off" placeholder="3000.00" aria-describedby="budget-error">
    <label for="budget-scope">生效范围</label><select id="budget-scope"><option value="future">本月及以后</option><option value="month">仅本月</option></select>
    <p id="budget-error" class="error" role="alert"></p>
    <div class="budget-buttons"><button type="submit" id="budget-save">保存预算</button><button type="button" id="budget-cancel">取消</button><button type="button" id="budget-disable">停用预算</button></div></form>
  </dialog>`);
  const dialog = $('budget-dialog');
  const data = () => mode() === 'personal' ? personal : demo;
  const blocked = () => mode() === 'personal' && !readable;
  let editMonth, editMode;
  const apply = () => window.AppI18n?.apply();
  function refresh() {
    const s = Budget.summarize(data(), entries(), today());
    card.dataset.status = s.status;
    $('budget-balance').textContent = blocked() ? '无法读取预算' : s.limit === null ? '设置月预算' : `${s.remaining < 0 ? '已超支' : '本月剩余'} HK$ ${money(Math.abs(s.remaining))}`;
    $('budget-usage').textContent = s.limit === null ? '设置额度，查看本月剩余金额' : `已用 HK$ ${money(s.spent)} / HK$ ${money(s.limit)}`;
    $('budget-fill').style.width = `${Math.min(s.percent, 100)}%`;
    card.querySelector('.budget-track').hidden = s.limit === null || blocked();
    $('budget-status').textContent = blocked() ? '无法读取本地预算，原数据未覆盖。' : s.limit === null ? '' : `${s.status === 'over' ? '已超出预算' : s.status === 'full' ? '预算已用完' : s.status === 'near' ? '接近预算' : '预算使用进度'} · ${s.percent.toFixed(1)}%`;
    if (dialog.open) {
      $('budget-month').textContent = s.month;
      $('budget-details').replaceChildren();
      for (const [label, value] of [['月预算', s.limit === null ? '未设置' : `HK$ ${money(s.limit)}`], ['已用', `HK$ ${money(s.spent)}`], [s.remaining < 0 ? '已超支' : '本月剩余', s.remaining === null ? '—' : `HK$ ${money(Math.abs(s.remaining))}`], ['本月剩余天数（含今天）', String(s.days)]]) {
        const item = document.createElement('div'), name = document.createElement('span'), amount = document.createElement('strong');
        name.textContent = label; amount.textContent = value; item.append(name, amount); $('budget-details').append(item);
      }
      if (editMonth !== s.month || editMode !== mode()) $('budget-error').textContent = '月份或账本已变化，请关闭后重新设置预算。';
    }
    apply();
  }
  function close() { dialog.close(); card.focus({ preventScroll: true }); }
  card.addEventListener('click', () => {
    const s = Budget.summarize(data(), entries(), today());
    editMonth = s.month; editMode = mode();
    $('budget-amount').value = s.limit === null ? '' : (s.limit / 100).toFixed(2);
    $('budget-scope').value = 'future';
    $('budget-error').textContent = blocked() ? '无法读取本地预算，原数据未覆盖。' : '';
    for (const id of ['budget-amount', 'budget-scope', 'budget-save', 'budget-disable']) $(id).disabled = blocked();
    $('budget-disable').hidden = s.limit === null;
    dialog.showModal(); refresh();
  });
  $('budget-close').onclick = close; $('budget-cancel').onclick = close;
  function save(cents, scope) {
    if (blocked()) throw new Error('无法读取本地预算，原数据未覆盖。');
    if (editMonth !== today().slice(0, 7) || editMode !== mode()) throw new Error('月份或账本已变化，请关闭后重新设置预算。');
    const next = Budget.update(data(), editMonth, cents, scope);
    if (mode() === 'personal') {
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { throw new Error('预算保存失败，请允许浏览器本地存储后重试。'); }
      personal = next;
    } else demo = next;
    close(); refresh(); notify(cents === null ? '已停用预算' : '预算已保存');
  }
  function attempt(action) { try { action(); } catch (error) { $('budget-error').textContent = error.message; apply(); } }
  $('budget-form').onsubmit = event => { event.preventDefault(); attempt(() => save(parseAmount($('budget-amount').value), $('budget-scope').value)); };
  $('budget-disable').onclick = () => attempt(() => save(null, 'future'));
  return { refresh };
}
