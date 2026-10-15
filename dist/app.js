'use strict';
const CATEGORIES = [
  { id: 'food', name: '餐饮', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v7m4-7v7M5 7h4m-2 3v11M18 3c-4 3-4 9 0 9V3Zm0 9v9"/></svg>', color: '#5285ed' },
  { id: 'transport', name: '交通', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="15" rx="3"/><path d="M5 10h14M8 18l-2 3m10-3 2 3M8 14h1m6 0h1"/></svg>', color: '#8b7ae0' },
  { id: 'shopping', name: '购物', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16l-1 14H5L4 7Z"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/></svg>', color: '#edaa58' },
  { id: 'living', name: '生活', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/></svg>', color: '#58b5d6' },
  { id: 'fun', name: '娱乐', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="13" rx="5"/><path d="M6 12h6m-3-3v6m7-4h1m1 3h1"/></svg>', color: '#da819e' },
  { id: 'other', name: '其他', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>', color: '#9da8bc' },
];

CATEGORIES.splice(5, 0, ...[{"id": "study", "name": "学习", "icon": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 4h7l2 2 2-2h7v16h-7l-2 1-2-1H3V4Zm9 2v15\"/></svg>", "color": "#5285ed"}, {"id": "health", "name": "健康", "icon": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z\"/></svg>", "color": "#8b7ae0"}, {"id": "travel", "name": "旅行", "icon": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"4\" y=\"6\" width=\"16\" height=\"14\" rx=\"3\"/><path d=\"M9 6V3h6v3M8 10v6m8-6v6M7 20v2m10-2v2\"/></svg>", "color": "#bd7950"}, {"id": "social", "name": "人情", "icon": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"8\" width=\"18\" height=\"13\" rx=\"2\"/><path d=\"M12 8v13M3 12h18M12 8C3 8 5 0 9 3l3 5Zm0 0c9 0 7-8 3-5l-3 5Z\"/></svg>", "color": "#45978b"}, {"id": "family", "name": "家庭", "icon": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"9\" cy=\"7\" r=\"3\"/><circle cx=\"17\" cy=\"9\" r=\"2\"/><path d=\"M3 21v-4a6 6 0 0 1 12 0v4m1-7a4 4 0 0 1 5 4v3\"/></svg>", "color": "#b06d96"}, {"id": "pets", "name": "宠物", "icon": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><ellipse cx=\"6\" cy=\"8\" rx=\"2\" ry=\"3\"/><ellipse cx=\"18\" cy=\"8\" rx=\"2\" ry=\"3\"/><ellipse cx=\"10\" cy=\"5\" rx=\"2\" ry=\"3\"/><ellipse cx=\"14\" cy=\"5\" rx=\"2\" ry=\"3\"/><path d=\"M6 18c0-3 3-7 6-7s6 4 6 7c0 5-4 2-6 2s-6 3-6-2Z\"/></svg>", "color": "#798958"}]);
const SUBCATEGORIES = {
  "food": [
    {
      "id": "food-1",
      "name": "正餐"
    },
    {
      "id": "food-2",
      "name": "早餐"
    },
    {
      "id": "food-3",
      "name": "零食"
    },
    {
      "id": "food-4",
      "name": "水果"
    },
    {
      "id": "food-5",
      "name": "饮品"
    },
    {
      "id": "food-6",
      "name": "食材"
    }
  ],
  "transport": [
    {
      "id": "transport-1",
      "name": "公共交通"
    },
    {
      "id": "transport-2",
      "name": "打车"
    },
    {
      "id": "transport-3",
      "name": "燃油"
    },
    {
      "id": "transport-4",
      "name": "停车"
    },
    {
      "id": "transport-5",
      "name": "车辆保养"
    }
  ],
  "shopping": [
    {
      "id": "shopping-1",
      "name": "服饰"
    },
    {
      "id": "shopping-2",
      "name": "鞋包"
    },
    {
      "id": "shopping-3",
      "name": "日用品"
    },
    {
      "id": "shopping-4",
      "name": "数码产品"
    },
    {
      "id": "shopping-5",
      "name": "美妆护肤"
    }
  ],
  "living": [
    {
      "id": "living-1",
      "name": "房租"
    },
    {
      "id": "living-2",
      "name": "水电煤"
    },
    {
      "id": "living-3",
      "name": "家居"
    },
    {
      "id": "living-4",
      "name": "通讯"
    },
    {
      "id": "living-5",
      "name": "维修"
    }
  ],
  "fun": [
    {
      "id": "fun-1",
      "name": "电影演出"
    },
    {
      "id": "fun-2",
      "name": "游戏"
    },
    {
      "id": "fun-3",
      "name": "会员订阅"
    },
    {
      "id": "fun-4",
      "name": "聚会"
    },
    {
      "id": "fun-5",
      "name": "兴趣爱好"
    }
  ],
  "study": [
    {
      "id": "study-1",
      "name": "书籍"
    },
    {
      "id": "study-2",
      "name": "课程"
    },
    {
      "id": "study-3",
      "name": "文具"
    },
    {
      "id": "study-4",
      "name": "软件工具"
    },
    {
      "id": "study-5",
      "name": "打印"
    }
  ],
  "health": [
    {
      "id": "health-1",
      "name": "就医"
    },
    {
      "id": "health-2",
      "name": "药品"
    },
    {
      "id": "health-3",
      "name": "体检"
    },
    {
      "id": "health-4",
      "name": "运动健身"
    },
    {
      "id": "health-5",
      "name": "保健"
    }
  ],
  "travel": [
    {
      "id": "travel-1",
      "name": "机票车票"
    },
    {
      "id": "travel-2",
      "name": "住宿"
    },
    {
      "id": "travel-3",
      "name": "景点"
    },
    {
      "id": "travel-4",
      "name": "当地交通"
    },
    {
      "id": "travel-5",
      "name": "旅行用品"
    }
  ],
  "social": [
    {
      "id": "social-1",
      "name": "礼物"
    },
    {
      "id": "social-2",
      "name": "红包"
    },
    {
      "id": "social-3",
      "name": "请客"
    },
    {
      "id": "social-4",
      "name": "公益捐赠"
    }
  ],
  "family": [
    {
      "id": "family-1",
      "name": "育儿"
    },
    {
      "id": "family-2",
      "name": "长辈"
    },
    {
      "id": "family-3",
      "name": "家庭服务"
    },
    {
      "id": "family-4",
      "name": "共同开支"
    }
  ],
  "pets": [
    {
      "id": "pets-1",
      "name": "宠物食品"
    },
    {
      "id": "pets-2",
      "name": "宠物用品"
    },
    {
      "id": "pets-3",
      "name": "宠物医疗"
    },
    {
      "id": "pets-4",
      "name": "宠物护理"
    }
  ],
  "other": [
    {
      "id": "other-1",
      "name": "手续费"
    },
    {
      "id": "other-2",
      "name": "快递"
    },
    {
      "id": "other-3",
      "name": "其他支出"
    }
  ]
};
function validCategory(category, subcategory) {
  return CATEGORIES.some(c => c.id === category) && (subcategory === undefined || SUBCATEGORIES[category].some(c => c.id === subcategory));
}
const MONEY = new Intl.NumberFormat('en-HK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = cents => MONEY.format(cents / 100);
function dateKey(date = new Date()) {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function shiftDay(key, offset) {
  const date = new Date(`${key}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return dateKey(date);
}
function dayDistance(start, end) {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000);
}
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00`);
  return !Number.isNaN(d.getTime()) && dateKey(d) === value;
}
function parseAmount(raw) {
  const value = String(raw).trim();
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(value)) throw new Error('请输入有效金额，最多两位小数。');
  const [whole, fraction = ''] = value.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (cents <= 0 || cents > 999999999) throw new Error('金额须在 HK$0.01–9,999,999.99 之间。');
  return cents;
}
function statistics(entries, period = '7', today = dateKey()) {
  const custom = period && typeof period === 'object';
  if (custom) {
    if (!validDate(period.start) || !validDate(period.end) || period.start > period.end || period.end > today) throw new Error('请选择有效日期，结束日期不得晚于今天。');
  } else if (!['7', '30', 'all', 'month', 'year'].includes(String(period))) throw new Error('Invalid period');
  const end = custom ? period.end : today;
  const eligible = entries.filter(e => e.date <= end);
  const start = custom ? period.start : period === 'month' ? today.slice(0, 7) + '-01' : period === 'year' ? today.slice(0, 4) + '-01-01' : period === 'all' ? eligible.reduce((s, e) => e.date < s ? e.date : s, today) : shiftDay(today, -(Number(period) - 1));
  const rows = eligible.filter(e => e.date >= start).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const total = rows.reduce((sum, e) => sum + e.cents, 0);
  const days = dayDistance(start, end) + 1;
  const categories = CATEGORIES.map(c => ({ ...c, cents: rows.filter(e => e.category === c.id).reduce((sum, e) => sum + e.cents, 0) })).sort((a, b) => b.cents - a.cents);
  // Cap chart resolution at 30 buckets; long histories remain readable and bounded.
  const step = Math.max(1, Math.ceil(days / 30));
  const buckets = Array.from({ length: Math.ceil(days / step) }, (_, i) => ({ date: shiftDay(start, i * step), cents: 0 }));
  for (const row of rows) buckets[Math.floor(dayDistance(start, row.date) / step)].cents += row.cents;
  return { start, end, total, days, average: Math.round(total / days), rows, categories, buckets, step };
}
function demoEntries(today) {
  return [[0, 'food', 5800], [0, 'transport', 1250], [1, 'shopping', 24900], [1, 'food', 7600], [2, 'food', 4200], [2, 'fun', 9800], [3, 'living', 12800], [3, 'transport', 2400], [4, 'food', 6500], [5, 'food', 4800], [5, 'transport', 1850], [6, 'other', 3500], [8, 'shopping', 18900], [10, 'food', 5600], [12, 'living', 8800], [13, 'transport', 2200]].map(([offset, category, cents], i) => ({ id: `demo-${i}`, date: shiftDay(today, -offset), category, cents, createdAt: 100 - i }));
}
if (typeof module !== 'undefined') module.exports = { parseAmount, statistics, dateKey, shiftDay, validDate, demoEntries, validCategory, SUBCATEGORIES };
if (typeof document !== 'undefined') init();
function init() {
  const $ = id => document.getElementById(id);
  const mobileViewport = matchMedia('(max-width: 720px)');
  const entryPanel = document.querySelector('.entry-panel');
  const overviewSections = [...document.querySelectorAll('.overview > .stats, .overview > .charts, .overview > .weekly, .overview > .payload-panel')];
  const overviewAnchors = overviewSections.map(section => {
    const anchor = document.createComment('overview section'); section.before(anchor); return anchor;
  });
  let calculatorState = { expression: '', settled: false };
  const STORAGE = 'spending-analyzer.personal.v1';
  let personal = [], demo = demoEntries(dateKey()), mode = 'personal', undoRecord = null, toastTimer;
  let storageReadable = true;
  const entries = () => mode === 'personal' ? personal : demo;
  function notify(message, undo = false) {
    clearTimeout(toastTimer); $('toast-text').textContent = message; $('toast').hidden = false; $('undo').hidden = !undo;
    window.AppI18n?.apply();
    toastTimer = setTimeout(() => { $('toast').hidden = true; undoRecord = null; calendar?.refreshUndo(); }, undo ? 12000 : 4000);
  }
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.some(e => !e || typeof e.id !== 'string' || !Number.isSafeInteger(e.cents) || e.cents <= 0 || e.cents > 999999999 || !validCategory(e.category, e.subcategory) || (e.note !== undefined && (typeof e.note !== 'string' || e.note.length > 50)) || !validDate(e.date) || !Number.isFinite(e.createdAt)) || new Set(parsed.map(e => e.id)).size !== parsed.length) throw new Error('invalid storage');
      personal = parsed;
    }
  } catch { storageReadable = false; notify('无法读取本地账本，原数据未覆盖。可先使用示例账本。'); }
  function commit(next) {
    if (mode === 'personal') {
      if (!storageReadable) throw new Error('本地账本无法读取，请先使用示例账本。');
      try { localStorage.setItem(STORAGE, JSON.stringify(next)); } catch { throw new Error('保存失败：请允许浏览器本地存储后重试。'); }
      personal = next;
    } else demo = next;
  }
  const SETTINGS_KEY = 'spending-analyzer.categories.v1';
  const defaults = ['food', 'transport', 'shopping', 'living', 'fun', 'study', 'health', 'travel', 'social', 'family', 'pets', 'other'];
  let categoryOrder = [...defaults], disabledCategories = [];
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (saved && Array.isArray(saved.order) && saved.order.length === defaults.length && new Set(saved.order).size === defaults.length && saved.order.every(id => defaults.includes(id)) && Array.isArray(saved.disabled) && saved.disabled.every(id => defaults.includes(id)) && defaults.some(id => !saved.disabled.includes(id))) {
      categoryOrder = saved.order; disabledCategories = saved.disabled;
    }
  } catch {}
  const enabledIds = () => categoryOrder.filter(id => !disabledCategories.includes(id));
  let primaryIds = enabledIds().slice(0, 5);
  function categoryOption(c) {
    return `<label class="category-option"><input type="radio" name="category" value="${c.id}" aria-label="${c.name}"><span><b aria-hidden="true" style="color:${c.color}">${c.icon}</b>${c.name}</span></label>`;
  }
  $('categories').innerHTML = primaryIds.map(id => categoryOption(CATEGORIES.find(c => c.id === id))).join('') + `<div class="more-categories"><button type="button" id="more-categories-button" class="more-categories-button" aria-expanded="false" aria-controls="more-categories-popup"><b aria-hidden="true">${CATEGORIES.find(c => c.id === 'other').icon}</b><span>其他</span></button><div id="more-categories-popup" class="more-categories-popup" hidden><p>更多分类</p><div class="more-categories-grid">${enabledIds().filter(id => !primaryIds.includes(id)).map(id => CATEGORIES.find(c => c.id === id)).map(categoryOption).join('')}</div></div></div>`;
  const more = document.querySelector('.more-categories');
  const moreButton = $('more-categories-button');
  const popup = $('more-categories-popup');
  function setMoreOpen(open) {
    popup.hidden = !open;
    moreButton.setAttribute('aria-expanded', String(open));
  }
  moreButton.addEventListener('click', () => setMoreOpen(popup.hidden));
  document.addEventListener('pointerdown', event => { if (!more.contains(event.target)) setMoreOpen(false); });
  more.addEventListener('keydown', event => {
    // Close only after keyboard navigation leaves this picker. Closing on blur
    // interrupts a pointer press on a label before its radio is activated.
    if (event.key === 'Tab') setTimeout(() => { if (!more.contains(document.activeElement)) setMoreOpen(false); }, 0);
    if (event.key === 'Escape' && !popup.hidden) { event.preventDefault(); event.stopPropagation(); setMoreOpen(false); moreButton.focus(); }
    if (event.key === 'ArrowDown' && event.target === moreButton) {
      event.preventDefault(); setMoreOpen(true); popup.querySelector('input')?.focus();
    }
  });
  function selectSubcategories(category) {
    const extra = !!category && !primaryIds.includes(category);
    const shown = CATEGORIES.find(c => c.id === (extra ? category : 'other'));
    moreButton.classList.toggle('selected', extra);
    moreButton.querySelector('b').innerHTML = shown.icon;
    moreButton.querySelector('b').style.color = extra ? shown.color : '';
    moreButton.querySelector('span').textContent = shown.name;
    $('subcategory-panel').hidden = !category;
    $('subcategories').innerHTML = category ? [{ id: '', name: '不细分' }, ...SUBCATEGORIES[category]].map((c, i) => `<label class="subcategory-option"><input type="radio" name="subcategory" value="${c.id}" ${i === 0 ? 'checked' : ''}><span>${c.name}</span></label>`).join('') : '';
    $('subcategory-title').textContent = category ? CATEGORIES.find(c => c.id === category).name + ' · 小类' : '小类';
    window.AppI18n?.apply();
  }
  $('categories').addEventListener('change', event => {
    selectSubcategories(event.target.value);
    if (popup.contains(event.target)) { setMoreOpen(false); moreButton.focus(); }
  });
  function refreshPicker() {
    const selected = document.querySelector('input[name="category"]:checked')?.value;
    const sub = document.querySelector('input[name="subcategory"]:checked')?.value;
    primaryIds = enabledIds().slice(0, 5);
    $('categories').querySelectorAll(':scope > .category-option').forEach(el => el.remove());
    more.insertAdjacentHTML('beforebegin', primaryIds.map(id => categoryOption(CATEGORIES.find(c => c.id === id))).join(''));
    popup.querySelector('.more-categories-grid').innerHTML = enabledIds().slice(5).map(id => categoryOption(CATEGORIES.find(c => c.id === id))).join('');
    more.hidden = enabledIds().length <= 5;
    const next = selected && !disabledCategories.includes(selected) ? selected : enabledIds()[0];
    const input = document.querySelector(`input[name="category"][value="${next}"]`);
    if (input) input.checked = true;
    selectSubcategories(input ? next : null);
    if (input && sub) { const child = document.querySelector(`input[name="subcategory"][value="${sub}"]`); if (child) child.checked = true; }
    setMoreOpen(false);
    window.AppI18n?.apply();
  }
  function renderSettings() {
    const pinned = enabledIds().slice(0, 5);
    $('settings-categories').innerHTML = categoryOrder.map(id => {
      const c = CATEGORIES.find(c => c.id === id), enabled = !disabledCategories.includes(id);
      return `<div class="settings-category ${enabled ? '' : 'is-disabled'}" data-category="${id}"><button type="button" class="drag-handle" aria-label="拖动排序 ${c.name}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14"/></svg></button><label><input type="checkbox" ${enabled ? 'checked' : ''}><span>${c.name}</span></label>${pinned.includes(id) ? '<span class="pinned-badge">置顶</span>' : ''}</div>`;
    }).join('');
    window.AppI18n?.apply();
  }
  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ order: categoryOrder, disabled: disabledCategories })); $('settings-error').textContent = ''; }
    catch { $('settings-error').textContent = '设置未能保存，刷新后将恢复。'; }
    refreshPicker(); renderSettings();
  }
  $('open-settings').addEventListener('click', () => { renderSettings(); $('settings-dialog').showModal(); });
  $('close-settings').addEventListener('click', () => $('settings-dialog').close());
  $('settings-dialog').addEventListener('close', () => focusFeature('settings', 'open-settings'));
  $('settings-categories').addEventListener('change', event => {
    const id = event.target.closest('[data-category]').dataset.category;
    if (!event.target.checked && enabledIds().length === 1) {
      event.target.checked = true; $('settings-error').textContent = '至少保留一个分类。'; window.AppI18n?.apply(); return;
    }
    disabledCategories = event.target.checked ? disabledCategories.filter(item => item !== id) : [...disabledCategories, id];
    saveSettings();
    $('settings-categories').querySelector(`[data-category="${id}"] input`).focus();
  });
  let drag = null;
  const list = $('settings-categories');
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function positions() {
    return new Map([...list.children].map(row => [row.dataset.category, row.getBoundingClientRect().top]));
  }
  function animateRows(before, excluded) {
    for (const row of list.children) {
      if (row === excluded) continue;
      const delta = before.get(row.dataset.category) - row.getBoundingClientRect().top;
      if (delta && !reducedMotion()) row.animate([{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
  }
  list.addEventListener('pointerdown', event => {
    const handle = event.target.closest('.drag-handle');
    if (!handle || event.button !== 0 || drag) return;
    event.preventDefault(); handle.focus();
    const row = handle.closest('[data-category]');
    drag = { row, pointer: event.pointerId, startY: event.clientY, top: row.getBoundingClientRect().top };
    row.classList.add('dragging'); list.setPointerCapture(event.pointerId);
  });
  list.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const before = positions();
    const siblings = [...list.children].filter(row => row !== drag.row);
    // Layout coordinates avoid animated neighbours moving the insertion threshold.
    const origin = list.getBoundingClientRect().top + list.clientTop;
    const target = siblings.find(row => event.clientY < origin + row.offsetTop + row.offsetHeight / 2);
    if (drag.row.nextElementSibling !== (target || null)) {
      list.insertBefore(drag.row, target || null);
      animateRows(before, drag.row);
    }
    drag.row.style.transform = '';
    const offset = drag.top + event.clientY - drag.startY - drag.row.getBoundingClientRect().top;
    drag.row.style.transform = `translateY(${offset}px) scale(1.02)`;
  });
  function finishDrag(event) {
    if (!drag || (event?.pointerId !== undefined && event.pointerId !== drag.pointer)) return;
    const before = positions(), id = drag.row.dataset.category, pointer = drag.pointer;
    categoryOrder = [...list.children].map(row => row.dataset.category);
    drag = null;
    if (list.hasPointerCapture(pointer)) list.releasePointerCapture(pointer);
    saveSettings(); animateRows(before);
    list.querySelector(`[data-category="${id}"] .drag-handle`).focus({ preventScroll: true });
  }
  list.addEventListener('pointerup', finishDrag);
  list.addEventListener('pointercancel', finishDrag);
  list.addEventListener('lostpointercapture', finishDrag);
  $('settings-dialog').addEventListener('close', () => finishDrag());
  $('show-history').addEventListener('click', () => calendar.open());
  list.addEventListener('keydown', event => {
    const handle = event.target.closest('.drag-handle');
    if (!handle || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault(); const id = handle.closest('[data-category]').dataset.category;
    const from = categoryOrder.indexOf(id), to = from + (event.key === 'ArrowUp' ? -1 : 1);
    if (to < 0 || to >= categoryOrder.length) return;
    const before = positions();
    [categoryOrder[from], categoryOrder[to]] = [categoryOrder[to], categoryOrder[from]];
    saveSettings(); animateRows(before); list.querySelector(`[data-category="${id}"] .drag-handle`).focus();
  });
  $('expense-note').addEventListener('input', () => {
    $('expense-note').value = $('expense-note').value.slice(0, 50);
    $('note-count').textContent = `${$('expense-note').value.length} / 50`;
  });
  function updateCalculator() {
    const expression = calculatorState.expression;
    const hasCalculation = /[+*/-]/.test(expression);
    $('calculator-expression').hidden = !hasCalculation;
    $('calculator-expression').textContent = expression.replaceAll('*', ' × ').replaceAll('/', ' ÷ ').replaceAll('+', ' + ').replaceAll('-', ' − ');
    $('entry-error').textContent = '';
    try {
      const preview = expression.replace(/[+*/-]+$/, '');
      const result = preview ? ExpenseCalculator.evaluate(preview) : null;
      $('amount').value = hasCalculation ? result?.amount || '' : expression;
    } catch (error) {
      $('amount').value = '';
      $('entry-error').textContent = window.AppI18n?.translate(error.message) || error.message;
    }
    $('calculator-expression').scrollLeft = $('calculator-expression').scrollWidth;
  }
  function calculatorKey(key) {
    try { calculatorState = ExpenseCalculator.press(calculatorState, key); updateCalculator(); }
    catch (error) { $('entry-error').textContent = window.AppI18n?.translate(error.message) || error.message; }
  }
  $('calculator-keypad').addEventListener('click', event => {
    const button = event.target.closest('[data-key]');
    if (button) calculatorKey(button.dataset.key);
  });
  entryPanel.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || !(event.target === $('amount') || event.target.closest('#calculator-keypad'))) return;
    if (/^[\d.+*/=-]$/.test(event.key)) { event.preventDefault(); calculatorKey(event.key); }
    else if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); calculatorKey(event.key === 'Delete' ? 'clear' : 'backspace'); }
    else if (event.key === 'Enter' && event.target === $('amount')) { event.preventDefault(); $('expense-form').requestSubmit(); }
  });
  $('amount').addEventListener('paste', event => {
    event.preventDefault();
    try {
      const expression = ExpenseCalculator.normalize(event.clipboardData.getData('text'));
      ExpenseCalculator.evaluate(expression);
      calculatorState = { expression, settled: false }; updateCalculator();
    } catch (error) { $('entry-error').textContent = window.AppI18n?.translate(error.message) || error.message; }
  });
  function focusFeature(action, desktopId) {
    const target = mobileViewport.matches ? document.querySelector(`[data-mobile-action="${action}"]`) : $(desktopId);
    target?.focus({ preventScroll: true });
  }
  function arrangeLayout() {
    if (mobileViewport.matches) {
      $('entry-dialog').append(entryPanel);
      $('mobile-overview-body').append(...overviewSections);
    } else {
      $('entry-dialog').close(); $('overview-dialog').close();
      $('entry-home').append(entryPanel);
      overviewSections.forEach((section, index) => overviewAnchors[index].after(section));
    }
    setMoreOpen(false);
  }
  $('start-entry').addEventListener('click', () => {
    $('entry-dialog').showModal();
    entryPanel.querySelector('.entry-content').scrollTop = 0;
    $('close-entry').focus({ preventScroll: true });
  });
  $('close-entry').addEventListener('click', () => $('entry-dialog').close());
  $('entry-dialog').addEventListener('close', () => { setMoreOpen(false); if (mobileViewport.matches) $('start-entry').focus({ preventScroll: true }); });
  $('close-overview').addEventListener('click', () => $('overview-dialog').close());
  $('overview-dialog').addEventListener('close', () => focusFeature('overview', 'open-statistics'));
  document.querySelector('.mobile-actions').addEventListener('click', event => {
    const action = event.target.closest('[data-mobile-action]')?.dataset.mobileAction;
    if (action === 'history') calendar.open();
    if (action === 'settings') $('open-settings').click();
    if (action === 'statistics') $('open-statistics').click();
    if (action === 'overview') { $('overview-dialog').showModal(); renderOverview(); }
  });
  refreshPicker();
  document.addEventListener('keydown', event => {
    if (event.altKey && /^[1-6]$/.test(event.key)) {
      event.preventDefault();
      if (document.querySelector('dialog[open]:not(#entry-dialog)') || (mobileViewport.matches && !$('entry-dialog').open)) return;
      const id = enabledIds()[Number(event.key) - 1];
      const input = document.querySelector(`input[name="category"][value="${id}"]`);
      if (!input) return;
      input.checked = true; selectSubcategories(input.value);
    }
  });
  $('expense-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const cents = parseAmount(ExpenseCalculator.evaluate(calculatorState.expression).amount);
      const category = document.querySelector('input[name="category"]:checked')?.value;
      if (!category || disabledCategories.includes(category)) throw new Error('请选择一个分类。');
      const row = { id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`, cents, category, date: document.querySelector('input[name="entry-day"]:checked').value === 'custom' ? $('custom-entry-date').value : shiftDay(dateKey(), Number(document.querySelector('input[name="entry-day"]:checked').value)), createdAt: Date.now() };
      const subcategory = document.querySelector('input[name="subcategory"]:checked')?.value;
      if (subcategory) row.subcategory = subcategory;
      if (!validCategory(category, row.subcategory)) throw new Error('请选择一个分类。');
      const note = $('expense-note').value.trim();
      if (note.length > 50) throw new Error('备注最多 50 字符。');
      if (note) row.note = note;
      validateRecord(row);
      commit([...entries(), row]);
      calculatorState = { expression: '', settled: false }; updateCalculator();
      $('expense-note').value = ''; $('note-count').textContent = '0 / 50'; $('entry-error').textContent = ''; $('entry-options').open = false;
      render();
      if ($('entry-dialog').open) $('entry-dialog').close(); else $('amount').focus({ preventScroll: true });
      notify(mode === 'demo' ? '已记入示例账本' : '已记下这笔消费');
    } catch (error) { $('entry-error').textContent = error.message; window.AppI18n?.apply(); }
  });
  for (const book of ['personal', 'demo']) $(`${book}-mode`).addEventListener('click', () => {
    if (!calendar.reset()) return;
    mode = book; undoRecord = null; $('toast').hidden = true; $('expense-form').reset(); $('custom-entry-date').hidden = true; $('custom-entry-date').value = dateKey(); $('note-count').textContent = '0 / 50'; refreshPicker(); setMoreOpen(false); $('entry-error').textContent = '';
    calculatorState = { expression: '', settled: false }; updateCalculator(); updateEntryDate();
    for (const candidate of ['personal', 'demo']) { $(`${candidate}-mode`).classList.toggle('active', candidate === mode); $(`${candidate}-mode`).setAttribute('aria-pressed', String(candidate === mode)); }
    render();
  });
  $('period').addEventListener('change', () => { render(); });
  $('records-body').addEventListener('click', event => {
    const edit = event.target.closest('[data-edit]'); if (edit) { calendar.edit(edit.dataset.edit, true); return; }
    const button = event.target.closest('[data-delete]'); if (!button) return;
    const row = entries().find(e => e.id === button.dataset.delete); if (!row || !calendar.finishEditing()) return;
    try { commit(entries().filter(e => e.id !== row.id)); undoRecord = { row, mode }; render(); notify('已删除这笔消费', true); } catch (error) { notify(error.message); }
  });
  $('undo').addEventListener('click', () => {
    if (!undoRecord || mode !== undoRecord.mode) return;
    try { commit([...entries(), undoRecord.row]); undoRecord = null; render(); notify('已恢复记录'); } catch (error) { notify(error.message); }
  });
  function renderDetailCharts() {
    const today = dateKey(), period = $('pie-period').value;
    try {
      const stats = statistics(entries(), period === 'custom' ? { start: $('statistics-start').value, end: $('statistics-end').value } : period, today);
      $('pie-range').textContent = `${stats.start} — ${stats.end}`;
      const active = stats.categories.filter(c => c.cents);
      let angle = 0;
      const stops = active.map(c => { const start = angle; angle += c.cents / stats.total * 100; return `${c.color} ${start}% ${angle}%`; });
      $('detail-pie').innerHTML = active.length ? `<div class="pie-layout"><div class="detail-pie-disc" role="img" aria-label="消费占比" style="background:conic-gradient(${stops.join(',')})"></div><ul class="pie-legend">${active.map(c => `<li><i style="background:${c.color}" aria-hidden="true"></i><span>${c.name}</span><strong>HK$ ${money(c.cents)}</strong><span>${(c.cents / stats.total * 100).toFixed(1)}%</span></li>`).join('')}</ul></div>` : '<p class="chart-empty">这个时间段还没有消费记录</p>';
    } catch {
      $('pie-range').textContent = '';
      $('detail-pie').innerHTML = '<p class="error">请选择有效日期，结束日期不得晚于今天。</p>';
    }
    const year = Number($('bar-year').value);
    const totals = Array(12).fill(0);
    for (const row of entries()) if (row.date <= today && Number(row.date.slice(0, 4)) === year) totals[Number(row.date.slice(5, 7)) - 1] += row.cents;
    const max = Math.max(...totals, 1), currentMonth = Number(today.slice(5, 7));
    $('monthly-bars').innerHTML = totals.map((total, index) => {
      const future = year === Number(today.slice(0, 4)) && index + 1 > currentMonth;
      return `<div class="month-column${future ? ' future-month' : ''}"><span class="month-value">${future ? '—' : money(total)}</span><div class="month-track"><div class="month-bar" style="height:${total / max * 100}%" title="HK$ ${money(total)}"></div></div><span>${String(index + 1).padStart(2, '0')}</span></div>`;
    }).join('');
    window.AppI18n?.apply();
  }
  $('pie-period').addEventListener('change', renderDetailCharts);
  $('bar-year').addEventListener('change', renderDetailCharts);
  function renderDetails() {
    const today = dateKey();
    $('statistics-start').max = today; $('statistics-end').max = today;
    $('annual-total').textContent = 'HK$ ' + money(statistics(entries(), 'year', today).total);
    $('annual-range').textContent = today.slice(0, 4) + '-01-01 — ' + today;
    try {
      const stats = statistics(entries(), { start: $('statistics-start').value, end: $('statistics-end').value }, today);
      $('statistics-error').textContent = '';
      const activeDays = new Set(stats.rows.map(row => row.date)).size;
      const max = stats.rows.reduce((value, row) => Math.max(value, row.cents), 0);
      const metrics = [['区间总支出', 'HK$ ' + money(stats.total)], ['日均支出', 'HK$ ' + money(stats.average)], ['消费笔数', stats.rows.length], ['平均每笔', 'HK$ ' + money(stats.rows.length ? Math.round(stats.total / stats.rows.length) : 0)], ['最大单笔', 'HK$ ' + money(max)], ['有消费天数', activeDays]];
      $('detail-metrics').innerHTML = metrics.map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join('');
      $('detail-categories').innerHTML = stats.categories.filter(c => c.cents).map(c => `<div class="detail-category"><span>${c.name}</span><strong>HK$ ${money(c.cents)}</strong><span>${(c.cents / stats.total * 100).toFixed(1)}%</span></div>`).join('') || '<p class="settings-hint">这个时间段还没有消费记录</p>';
    } catch (error) {
      $('statistics-error').textContent = error.message;
      $('detail-metrics').replaceChildren(); $('detail-categories').replaceChildren();
    }
    renderDetailCharts();
    window.AppI18n?.apply();
  }
  $('open-statistics').addEventListener('click', () => {
    if ($('overview-dialog').open) $('overview-dialog').close();
    const today = dateKey();
    $('statistics-start').value = today.slice(0, 7) + '-01'; $('statistics-end').value = today;
    $('pie-period').value = 'month';
    const years = [...new Set([today.slice(0, 4), ...entries().filter(row => row.date <= today).map(row => row.date.slice(0, 4))])].sort().reverse();
    $('bar-year').replaceChildren(...years.map(year => new Option(year, year)));
    $('bar-year').value = today.slice(0, 4);
    renderDetails(); $('statistics-dialog').showModal();
  });
  $('close-statistics').addEventListener('click', () => $('statistics-dialog').close());
  $('statistics-dialog').addEventListener('close', () => focusFeature('statistics', 'open-statistics'));
  $('statistics-form').addEventListener('submit', event => { event.preventDefault(); $('pie-period').value = 'custom'; renderDetails(); });
  function renderTrend(stats) {
    if (!stats.rows.length) { $('trend-chart').innerHTML = '<p class="chart-empty">记下消费，看看每天的变化</p>'; return; }
    // Long ranges use daily averages per bucket, keeping the daily mean comparable.
    const buckets = stats.buckets.map(b => ({ ...b, daily: b.cents / Math.min(stats.step, dayDistance(b.date, stats.end) + 1) }));
    const mean = stats.total / stats.days;
    const max = Math.max(...buckets.map(b => b.daily), mean, 100), ceiling = Math.ceil(max / 10000) * 10000;
    const left = 38, width = 306, bottom = 143, top = 12, slot = width / buckets.length;
    let svg = `<svg viewBox="0 0 356 175" role="img" aria-label="支出趋势，${stats.step === 1 ? '每日支出' : `每 ${stats.step} 天一组的日均支出`}，单位港币；虚线为日均 HK$${money(stats.average)}"><title>支出趋势 · 日均 HK$${money(stats.average)}</title>`;
    for (let i = 0; i < 3; i++) { const y = top + i * (bottom - top) / 2; svg += `<line class="trend-grid" x1="${left}" x2="348" y1="${y}" y2="${y}" stroke-dasharray="3 4"/><text class="trend-axis" x="30" y="${y + 3}" text-anchor="end" font-size="12">${Math.round(ceiling * (1 - i / 2) / 100).toLocaleString('en')}</text>`; }
    const labelEvery = Math.max(1, Math.ceil(buckets.length / 7));
    buckets.forEach((bucket, i) => {
      const height = bucket.daily / ceiling * (bottom - top), x = left + slot * i + slot * .23;
      svg += `<rect class="trend-bar${i === buckets.length - 1 ? ' current' : ''}" x="${x}" y="${bottom - height}" width="${slot * .54}" height="${height}" rx="3"><title>${bucket.date}${stats.step > 1 ? ` 至 ${shiftDay(bucket.date, Math.min(stats.step - 1, dayDistance(bucket.date, stats.end)))} · 日均` : ''}：HK$${money(Math.round(bucket.daily))}</title></rect>`;
      if (i % labelEvery === 0) svg += `<text class="trend-axis" x="${left + slot * (i + .5)}" y="166" text-anchor="middle" font-size="12">${Number(bucket.date.slice(5, 7))}/${Number(bucket.date.slice(8))}</text>`;
    });
    const meanY = bottom - mean / ceiling * (bottom - top);
    svg += `<line class="average-line" x1="${left}" x2="348" y1="${meanY}" y2="${meanY}"/><text class="average-label" x="347" y="${Math.max(top + 10, meanY - 7)}" text-anchor="end">日均 HK$${money(stats.average)}</text>`;
    $('trend-chart').innerHTML = svg + '</svg>';
  }
  function renderCategories(stats) {
    const active = stats.categories.filter(c => c.cents);
    $('category-count').textContent = `${active.length} 类`;
    let position = 0;
    const stops = active.map(c => { const start = position; position += c.cents / stats.total * 100; return `${c.color} ${start}% ${position}%`; });
    const gradient = stops.length ? `conic-gradient(${stops.join(',')})` : 'var(--soft)';
    $('category-chart').innerHTML = `<div class="donut" style="background:${gradient}" role="img" aria-label="${active.length ? active.map(c => `${c.name} ${money(c.cents)} 港币`).join('，') : '暂无分类数据'}"><span>${active.length ? '消费分布' : '暂无记录'}</span></div><div class="legend">${(active.length ? active : CATEGORIES.slice(0, 3)).map(c => `<div class="legend-item"><i style="background:${c.color}"></i><span>${c.name}</span><strong>${stats.total ? (c.cents / stats.total * 100).toFixed(1) + '%' : '—'}</strong></div>`).join('')}</div>`;
  }
  function renderMiniTrend(weekly) {
    const width = 144, top = 7, bottom = 63, mean = weekly.total / 7;
    const maximum = Math.max(100, mean, ...weekly.buckets.map(bucket => bucket.cents));
    const y = cents => bottom - cents / maximum * (bottom - top);
    const points = weekly.buckets.map((bucket, index) => `${6 + index * (width - 12) / 6},${y(bucket.cents)}`);
    const todayY = y(weekly.buckets.at(-1).cents), meanY = y(mean);
    $('mini-trend-chart').innerHTML = `<svg viewBox="0 0 144 72" role="img" aria-label="近七日消费折线图，虚线为日均"><title>日均 HK$ ${money(weekly.average)}</title><path class="spark-area" d="M6,${bottom} L${points.join(' L')} L138,${bottom} Z"/><line class="average-line" x1="6" x2="138" y1="${meanY}" y2="${meanY}"/><polyline class="spark-line" points="${points.join(' ')}"/>${weekly.buckets.map((bucket, index) => `<circle class="spark-point" cx="${6 + index * 22}" cy="${y(bucket.cents)}" r="2"><title>${bucket.date} · HK$ ${money(bucket.cents)}</title></circle>`).join('')}<circle class="spark-last" cx="138" cy="${todayY}" r="3.5"/></svg>`;
    $('mini-average').textContent = money(weekly.average);
  }
  function renderOverview() {
    const today = dateKey(), monthly = statistics(entries(), 'month', today);
    const stats = statistics(entries(), $('period').value, today);
    $('total').textContent = money(monthly.total); $('average').textContent = money(monthly.average); $('count').textContent = `${monthly.rows.length} 笔记录`;
    $('range-label').textContent = `${monthly.start.replaceAll('-', '.')} — ${today.slice(5).replace('-', '.')}`;
    $('top-category').textContent = monthly.total ? monthly.categories[0].name : '—'; $('top-share').textContent = monthly.total ? `占总支出 ${(monthly.categories[0].cents / monthly.total * 100).toFixed(1)}%` : '暂无记录';
    renderTrend(stats); renderCategories(stats);
    window.AppI18n?.apply();
  }
  const budget = createBudget({ entries, mode: () => mode, today: dateKey, parseAmount, money, notify });
  function render() {
    budget.refresh();
    calendar?.beforeRender();
    const today = dateKey(), daily = statistics(entries(), { start: today, end: today }, today);
    const stats = mobileViewport.matches ? daily : statistics(entries(), $('period').value, today);
    $('entry-date').textContent = today.replaceAll('-', '.'); $('book-status').textContent = mode === 'demo' ? '示例数据 · 不保存' : '个人账本';
    if (!mobileViewport.matches || $('overview-dialog').open) renderOverview();
    const weekly = statistics(entries(), '7', today);
    if (mobileViewport.matches) {
      $('today-total').textContent = money(daily.total); $('today-count').textContent = `${daily.rows.length} 笔记录`;
      renderMiniTrend(weekly);
    }
    $('weekly-caption').textContent = `近 7 天 · ${weekly.total ? `HK$ ${money(weekly.total)} / ${weekly.rows.length} 笔` : '暂无支出'}`;
    $('records-title').textContent = mobileViewport.matches ? '今日消费记录' : '消费记录';
    $('record-count').textContent = stats.rows.length; $('records-caption').textContent = { '7': '近 7 天', '30': '近 30 天', all: '全部时间' }[$('period').value];
    const feed = $('records-body'); feed.replaceChildren();
    const groups = new Map();
    for (const row of stats.rows) {
      if (!groups.has(row.date)) groups.set(row.date, []);
      groups.get(row.date).push(row);
    }
    for (const [date, rows] of groups) {
      const group = document.createElement('section'); group.className = 'journal-group';
      const label = date === today ? '今天' : date === shiftDay(today, -1) ? '昨天' : date.replaceAll('-', '.');
      group.innerHTML = `<h3><span>${label}</span><span>${rows.length} 笔 · HK$ ${money(rows.reduce((sum, row) => sum + row.cents, 0))}</span></h3>`;
      for (const row of rows) {
        const category = CATEGORIES.find(c => c.id === row.category), item = document.createElement('div');
        const subcategory = SUBCATEGORIES[row.category].find(c => c.id === row.subcategory);
        item.className = 'journal-row';
        item.innerHTML = `<span class="row-icon" aria-hidden="true" style="color:${category.color}">${category.icon}</span><span class="record-category">${subcategory ? `${subcategory.name}<small>${category.name}</small>` : category.name}</span><strong>HK$ ${money(row.cents)}</strong><button class="delete-button" aria-label="删除 ${row.date} ${category.name} ${money(row.cents)} 港币"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/></svg></button>`;
        if (row.note) { const note = document.createElement('small'); note.className = 'record-note'; note.dataset.noTranslate = ''; note.textContent = row.note; item.querySelector('.record-category').append(note); }
        item.querySelector('button').dataset.delete = row.id;
        const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'edit-record'; edit.textContent = '编辑'; edit.dataset.edit = row.id; item.insertBefore(edit, item.querySelector('button')); group.append(item);
      }
      feed.append(group);
    }
    $('journal-date').textContent = today.replaceAll('-', ' / ');
    $('weekly-payload').textContent = JSON.stringify({ currency: 'HKD', start: weekly.start, end: weekly.end, total: weekly.total / 100, average: weekly.average / 100, count: weekly.rows.length, categories: weekly.categories.map(c => ({ category: c.id, total: c.cents / 100 })) }, null, 2);
    $('records-empty').hidden = !!stats.rows.length; $('records-empty').querySelector('p').textContent = entries().length ? '这个时间段还没有消费记录' : '从第一笔消费开始';
    calendar?.refresh();
    window.AppI18n?.apply();
  }
  function validateRecord(row) {
    if (!validDate(row.date)) throw new Error('请选择有效日期。');
    if (!Number.isSafeInteger(row.cents) || row.cents <= 0 || row.cents > 999999999) throw new Error('请输入有效金额，最多两位小数。');
    if (!validCategory(row.category, row.subcategory)) throw new Error('请选择一个分类。');
    if (typeof (row.note ?? '') !== 'string' || (row.note || '').length > 50) throw new Error('备注最多 50 字符。');
    return row;
  }
  const calendar = createLedgerCalendar({ entries, commit, render, validateRecord, parseAmount, dateKey, shiftDay, validDate, money, categories: CATEGORIES, subcategories: SUBCATEGORIES, enabledIds,
    remove(id) { const row = entries().find(e => e.id === id); if (!row) return; commit(entries().filter(e => e.id !== id)); undoRecord = {row, mode}; render(); notify('已删除这笔消费', true); },
    undo() { $('undo').click(); }, canUndo: () => !!undoRecord && undoRecord.mode === mode
  });
  function updateEntryDate() {
    const selected = document.querySelector('input[name="entry-day"]:checked').value;
    $('custom-entry-date').hidden = selected !== 'custom';
    $('entry-options-summary').textContent = selected === 'custom' ? $('custom-entry-date').value : selected === '0' ? '今天' : '昨天';
    window.AppI18n?.apply();
  }
  document.querySelectorAll('input[name="entry-day"]').forEach(input => input.addEventListener('change', updateEntryDate));
  $('custom-entry-date').addEventListener('change', updateEntryDate);
  $('custom-entry-date').value = dateKey();
  let lastDay = dateKey(), midnightTimer;
  function refreshDay() {
    if (dateKey() !== lastDay) { lastDay = dateKey(); render(); if ($('statistics-dialog').open) renderDetails(); }
    clearTimeout(midnightTimer);
    const midnight = new Date(); midnight.setHours(24, 0, 0, 100);
    midnightTimer = setTimeout(refreshDay, midnight.getTime() - Date.now());
  }
  window.addEventListener('focus', refreshDay);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDay(); });
  mobileViewport.addEventListener('change', () => { arrangeLayout(); render(); });
  arrangeLayout(); refreshDay();
  // Native modal focus management, a plain dark backdrop, and no blur/filter work.
  document.querySelectorAll('dialog').forEach(dialog => {
    let pointerStartedOutside = false;
    const outside = event => { const box = dialog.getBoundingClientRect(); return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom; };
    dialog.addEventListener('pointerdown', event => { pointerStartedOutside = event.target === dialog && outside(event); });
    dialog.addEventListener('click', event => {
      if (pointerStartedOutside && event.target === dialog && outside(event)) {
        const cancel = new Event('cancel', { cancelable: true });
        if (dialog.dispatchEvent(cancel)) dialog.close();
      }
      pointerStartedOutside = false;
    });
  });
  render();
  if (!mobileViewport.matches && matchMedia('(pointer: fine)').matches) $('amount').focus({ preventScroll: true });
  // API integration intentionally deferred. No keys, network calls, or fabricated AI reports.
  // Future server implementation should accept only statistics(entries(), '7') aggregates.
}
