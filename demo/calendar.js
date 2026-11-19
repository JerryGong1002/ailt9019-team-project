'use strict';
function calendarMonth(entries, month, today) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || +month.slice(0,4) < 1) throw new Error('Invalid month');
  const first = new Date(`${month}-01T12:00:00`);
  const last = new Date(first); last.setMonth(last.getMonth() + 1, 0);
  const totals = new Map(); let actual = 0, future = 0;
  for (const row of entries) if (row.date.slice(0, 7) === month) {
    totals.set(row.date, (totals.get(row.date) || 0) + row.cents);
    if (row.date <= today) actual += row.cents; else future += row.cents;
  }
  const maximum = Math.max(0, ...totals.values());
  return { offset: (first.getDay() + 6) % 7, actual, future, maximum,
    days: Array.from({length: last.getDate()}, (_, i) => {
      const date = `${month}-${String(i + 1).padStart(2, '0')}`, cents = totals.get(date) || 0;
      return { date, cents, level: heatLevel(cents, maximum) };
    }) };
}
function heatLevel(cents, maximum) { return cents > 0 && maximum > 0 ? Math.min(4, Math.ceil(cents * 4 / maximum)) : 0; }
function replaceLedgerRecord(entries, row, id) {
  if (!id) return [...entries, row];
  const original = entries.find(e => e.id === id);
  if (!original) throw new Error('Record no longer exists');
  return entries.map(e => e.id === id ? {...row, id: original.id, createdAt: original.createdAt} : e);
}
if (typeof module !== 'undefined') module.exports = { calendarMonth, heatLevel, replaceLedgerRecord };
function createLedgerCalendar(api) {
  const {entries, commit, render, validateRecord, parseAmount, dateKey, shiftDay, validDate, money, categories, subcategories, enabledIds} = api;
  let selected = dateKey(), month = selected.slice(0,7), editing = null, baseline = '', returnFocus, inlineHome = false;
  const dialog = document.createElement('dialog'); dialog.id = 'ledger-calendar'; dialog.setAttribute('aria-labelledby', 'calendar-title');
  dialog.innerHTML = `<header class="calendar-heading"><h2 id="calendar-title">历史账单</h2><button type="button" id="calendar-close" aria-label="关闭历史账单">×</button></header>
    <div id="calendar-browse"><nav class="calendar-navigation" aria-label="月份选择"><button type="button" id="calendar-prev" aria-label="上月">‹</button><input type="month" id="calendar-month" min="0001-01" max="9999-12" aria-label="年月跳转"><button type="button" id="calendar-next" aria-label="下月">›</button><button type="button" id="calendar-today">回今天</button></nav>
    <div class="calendar-summary"><div><span>已发生支出</span><strong id="calendar-actual"></strong></div><div><span>提前记账</span><strong id="calendar-future"></strong></div></div>
    <div class="calendar-columns"><section><div class="calendar-week" aria-hidden="true"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div><div id="calendar-grid" class="calendar-grid" role="group" aria-label="日期选择"></div><div class="calendar-legend"><span>少</span><i data-heat="1"></i><i data-heat="2"></i><i data-heat="3"></i><i data-heat="4"></i><span>多</span></div><p class="calendar-hint">按本月每日记录金额比较，含提前记账</p><p class="calendar-hint">不同月份的深浅不代表相同金额</p></section>
    <section class="calendar-details"><h3 id="calendar-selected"></h3><p id="calendar-day-total"></p><button type="button" id="calendar-add">在这天记一笔</button><div id="calendar-rows"></div></section></div></div>
    <form id="calendar-form" class="inline-ledger-editor" hidden novalidate><div class="inline-editor-top"><div class="inline-category"><label id="calendar-category-label">类别</label><button type="button" id="calendar-category-trigger" aria-labelledby="calendar-category-label" aria-expanded="false" aria-controls="calendar-category-menu"></button><div id="calendar-category-menu" hidden></div><select id="calendar-category" hidden aria-hidden="true" tabindex="-1"></select><select id="calendar-subcategory" hidden aria-hidden="true" tabindex="-1"></select></div><label class="inline-amount">金额<div><span>HK$</span><input id="calendar-amount" aria-label="金额" inputmode="decimal" autocomplete="off" maxlength="12" required></div></label></div><label class="calendar-note">备注<textarea id="calendar-note" maxlength="50" rows="3"></textarea><small id="calendar-note-count" data-no-translate></small></label><details class="inline-date"><summary>日期</summary><input id="calendar-date" aria-label="日期" type="date" min="0001-01-01" max="9999-12-31" required></details><p id="calendar-error" class="error" role="alert"></p><div class="calendar-actions"><button type="submit">保存记录</button><button type="button" id="calendar-cancel">取消</button></div></form>
    <div id="calendar-status" role="status"><span id="calendar-message"></span> <button type="button" id="calendar-undo" hidden>撤销</button></div>`;
  document.body.append(dialog);
  const $ = id => document.getElementById(`calendar-${id}`);
  const form = $('form');
  function park() { if (form.parentElement !== dialog) dialog.append(form); }
  function attach() {
    if (form.hidden) return;
    const row = inlineHome ? [...document.querySelectorAll('#records-body [data-edit]')].find(e => e.dataset.edit === editing)?.closest('.journal-row') : [...$('rows').children].find(e => e.dataset.record === editing);
    if (row) row.after(form); else if (!inlineHome) $('add').after(form);
  }
  const tr = () => window.AppI18n?.apply();
  const snapshot = () => JSON.stringify(['amount','date','category','subcategory','note'].map(id => $(id).value));
  const dirty = () => !$('form').hidden && snapshot() !== baseline;
  function discard() {
    if (!dirty()) return true;
    return window.confirm(window.AppI18n?.translate('放弃未保存的修改？选择取消可继续编辑。') || '放弃未保存的修改？选择取消可继续编辑。');
  }
  function browse() { park(); $('category-menu').hidden = true; $('category-trigger').setAttribute('aria-expanded', 'false'); $('form').hidden = true; $('browse').hidden = false; editing = null; refresh(); }
  function open() { if (!discard()) return; returnFocus = document.activeElement; browse(); inlineHome = false; if (!dialog.open) dialog.showModal(); refresh(); }
  function close() { if (!discard()) return; browse(); dialog.close(); returnFocus?.focus(); }
  function refreshUndo() { $('undo').hidden = !api.canUndo(); }
  function refresh() {
    // A closed calendar only needs to reattach the inline editor. Build its
    // month grid and daily rows on demand instead of on every homepage update.
    if (!dialog.open) { attach(); refreshUndo(); return; }
    const data = calendarMonth(entries(), month, dateKey());
    $('month').value = month;
    $('actual').textContent = `HK$ ${money(data.actual)}`; $('future').textContent = `HK$ ${money(data.future)}`;
    $('prev').disabled = month === '0001-01'; $('next').disabled = month === '9999-12';
    const focusDate = document.activeElement?.dataset.date;
    $('grid').replaceChildren();
    for (let i = 0; i < data.offset; i++) $('grid').append(document.createElement('span'));
    for (const day of data.days) {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.date = day.date; button.dataset.heat = day.level;
      button.setAttribute('aria-pressed', String(day.date === selected)); button.tabIndex = day.date === selected ? 0 : -1;
      const future = day.date > dateKey(), today = day.date === dateKey();
      button.innerHTML = `<span>${Number(day.date.slice(8))}</span><small data-no-translate>${day.cents ? money(day.cents) : '—'}</small>${today ? '<b class="calendar-today-dot" aria-hidden="true"></b>' : ''}${future ? '<em>预</em>' : ''}`;
      button.setAttribute('aria-label', `${day.date}，HK$ ${money(day.cents)}${future ? '，提前记账' : ''}${today ? '，今天' : ''}`);
      if (today) button.setAttribute('aria-current', 'date');
      $('grid').append(button);
    }
    $('selected').textContent = selected;
    const rows = entries().filter(e => e.date === selected).sort((a,b) => b.createdAt - a.createdAt);
    $('day-total').textContent = `HK$ ${money(rows.reduce((sum,row) => sum + row.cents,0))}${selected > dateKey() ? ' · 提前记账' : ''}`;
    park();
    $('rows').replaceChildren();
    if (!rows.length) { const empty = document.createElement('p'); empty.className = 'calendar-hint'; empty.textContent = '这天还没有消费记录'; $('rows').append(empty); }
    for (const row of rows) {
      const item = document.createElement('article'); item.className = 'journal-row'; item.dataset.record = row.id;
      const category = categories.find(c => c.id === row.category), sub = subcategories[row.category].find(c => c.id === row.subcategory);
      const icon = document.createElement('span'); icon.className = 'row-icon'; icon.style.color = category.color; icon.setAttribute('aria-hidden', 'true'); icon.innerHTML = category.icon;
      const title = document.createElement('span'); title.className = 'record-category'; title.textContent = sub ? sub.name : category.name;
      if (sub) { const parent = document.createElement('small'); parent.textContent = category.name; title.append(parent); }
      const amount = document.createElement('strong'); amount.textContent = `HK$ ${money(row.cents)}`;
      item.append(icon, title, amount);
      if (row.note) { const note = document.createElement('small'); note.className = 'record-note'; note.dataset.noTranslate = ''; note.textContent = row.note; title.append(note); }
      for (const [label, action] of [['编辑', () => edit(row.id)], ['删除', () => {
        if (!discard()) return; browse();
        try { api.remove(row.id); $('message').textContent = '已删除这笔消费'; } catch(e) { $('message').textContent = e.message; } refreshUndo(); tr();
      }]]) { const button = document.createElement('button'); button.type = 'button'; button.className = label === '编辑' ? 'edit-record' : 'delete-button';
        if (label === '编辑') button.textContent = label;
        else { button.setAttribute('aria-label', `删除 ${row.date} ${category.name} ${money(row.cents)} 港币`); button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/></svg>'; }
        button.addEventListener('click', action); item.append(button); }
      $('rows').append(item);
    }
    attach(); refreshUndo(); tr();
    if (focusDate) $('grid').querySelector(`[data-date="${focusDate}"]`)?.focus();
  }
  function select(date, focus = false) { if (!validDate(date) || !discard()) { $('month').value = month; return; } browse(); selected = date; month = date.slice(0,7); refresh(); if (focus) $('grid').querySelector(`[data-date="${date}"]`)?.focus(); }
  function moveMonth(delta) {
    const d = new Date(`${month}-01T12:00:00`); d.setMonth(d.getMonth() + delta);
    const key = dateKey(d); if (validDate(key)) select(key);
  }
  function fillSub(value = '') {
    $('subcategory').replaceChildren(new Option('不选小类', ''));
    for (const sub of subcategories[$('category').value] || []) $('subcategory').add(new Option(sub.name, sub.id));
    $('subcategory').value = value; tr();
  }
  function edit(id, home = false) {
    if (!discard()) return;
    const row = id ? entries().find(e => e.id === id) : null;
    if (id && !row) return;
    park(); inlineHome = home;
    editing = row?.id || null; $('browse').hidden = false; $('form').hidden = false;
    $('amount').value = row ? (row.cents / 100).toFixed(2) : ''; $('date').value = row?.date || selected;
    $('category').replaceChildren();
    for (const cat of categories.filter(c => enabledIds().includes(c.id) || c.id === row?.category)) $('category').add(new Option(cat.name,cat.id));
    $('category').value = row?.category || enabledIds()[0]; fillSub(row?.subcategory);
    $('note').value = row?.note || ''; $('note-count').textContent = `${$('note').value.length} / 50`; $('error').textContent = '';
    baseline = snapshot(); buildCategoryMenu(); attach(); tr(); $('category-trigger').focus({preventScroll:true});
  }
  function categoryContent(cat, sub) {
    const icon = document.createElement('span'); icon.className = 'row-icon'; icon.style.color = cat.color; icon.innerHTML = cat.icon; icon.setAttribute('aria-hidden','true');
    const text = document.createElement('span'); text.textContent = sub ? `${cat.name} / ${sub.name}` : cat.name;
    return [icon,text];
  }
  function buildCategoryMenu() {
    const menu = $('category-menu'); menu.replaceChildren(); menu.hidden = true; $('category-trigger').setAttribute('aria-expanded','false');
    const active = categories.find(c => c.id === $('category').value);
    $('category-trigger').replaceChildren(...categoryContent(active, subcategories[active.id].find(c => c.id === $('subcategory').value)));
    for (const cat of categories.filter(c => enabledIds().includes(c.id) || c.id === active.id)) {
      for (const sub of [null,...subcategories[cat.id]]) {
        const button = document.createElement('button'); button.type = 'button'; button.className = sub ? 'inline-category-option sub' : 'inline-category-option';
        button.append(...categoryContent(cat,sub));
        button.onclick = () => { $('category').value = cat.id; fillSub(sub?.id || ''); buildCategoryMenu(); tr(); $('category-trigger').focus(); };
        menu.append(button);
      }
    }
  }
  $('category-trigger').onclick = () => { const menu = $('category-menu'); menu.hidden = !menu.hidden; $('category-trigger').setAttribute('aria-expanded',String(!menu.hidden)); if (!menu.hidden) menu.querySelector('button')?.focus(); };
  $('category-menu').onkeydown = e => {
    const buttons = [...$('category-menu').querySelectorAll('button')], index = buttons.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); $('category-menu').hidden = true; $('category-trigger').setAttribute('aria-expanded','false'); $('category-trigger').focus(); }
    if (['ArrowDown','ArrowUp','Home','End'].includes(e.key)) { e.preventDefault(); const next = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length-1 : (index + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length)%buttons.length; buttons[next]?.focus(); }
  };
  document.addEventListener('click', e => { if (!e.target.closest('.inline-category')) { $('category-menu').hidden = true; $('category-trigger').setAttribute('aria-expanded','false'); } });
  $('close').onclick = close;
  dialog.addEventListener('cancel', e => { e.preventDefault(); close(); });
  $('cancel').onclick = () => { if (discard()) { const id = editing, home = inlineHome; browse(); (home ? [...document.querySelectorAll('[data-edit]')].find(e => e.dataset.edit === id) : $('add'))?.focus({preventScroll:true}); } };
  $('prev').onclick = () => moveMonth(-1); $('next').onclick = () => moveMonth(1);
  $('today').onclick = () => select(dateKey(), true);
  $('month').onchange = () => { const date = `${$('month').value}-01`; if (validDate(date)) select(date); else $('month').value = month; };
  $('grid').onclick = e => { const button = e.target.closest('[data-date]'); if (button) select(button.dataset.date, true); };
  $('grid').onkeydown = e => {
    const button = e.target.closest('[data-date]'); if (!button) return;
    const offsets = {ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};
    if (e.key in offsets) { e.preventDefault(); select(shiftDay(button.dataset.date, offsets[e.key]), true); }
  };
  $('add').onclick = () => edit(); $('category').onchange = () => fillSub();
  $('note').oninput = () => { $('note-count').textContent = `${$('note').value.length} / 50`; };
  $('undo').onclick = () => { api.undo(); $('message').textContent = document.getElementById('toast-text').textContent; refreshUndo(); tr(); };
  $('form').onsubmit = e => {
    e.preventDefault();
    try {
      const row = {id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`, createdAt: Date.now(), date: $('date').value, cents: parseAmount($('amount').value), category: $('category').value};
      if ($('subcategory').value) row.subcategory = $('subcategory').value;
      const note = $('note').value.trim(); if (note) row.note = note;
      validateRecord(row); commit(replaceLedgerRecord(entries(), row, editing));
      selected = row.date; month = selected.slice(0,7); baseline = snapshot(); const home = inlineHome; browse(); render(); $('message').textContent = '已保存记录'; tr(); if (!home) $('add').focus({preventScroll:true});
    } catch(error) { $('error').textContent = error.message; tr(); }
  };
  window.addEventListener('beforeunload', e => { if (dirty()) { e.preventDefault(); e.returnValue = ''; } });
  return {open, edit, refresh, refreshUndo, beforeRender: park, finishEditing() { if (!discard()) return false; browse(); return true; }, reset() { if (!discard()) return false; selected = dateKey(); month = selected.slice(0,7); browse(); $('message').textContent = ''; return true; }};
}
