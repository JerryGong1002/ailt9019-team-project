'use strict';
(() => {
  const key = 'spending-analyzer.language.v1';
  const supported = ['en', 'zh-CN', 'zh-TW'];
  let language = 'en';
  try { const saved = localStorage.getItem(key); if (supported.includes(saved)) language = saved; } catch {}
  // Source strings stay separate from translated DOM, including dynamic amounts.
  const phrases = [
    ["月预算", "Monthly budget", "月預算"],
    ["关闭预算", "Close budget", "關閉預算"],
    ["无法读取预算", "Budget unavailable", "無法讀取預算"],
    ["设置月预算", "Set monthly budget", "設定月預算"],
    ["本月剩余", "Left this month", "本月剩餘"],
    ["已超支", "Over budget", "已超支"],
    ["设置额度，查看本月剩余金额", "Set a limit to track what’s left this month", "設定額度，查看本月剩餘金額"],
    ["已用", "Spent", "已用"],
    ["已超出预算", "Over budget", "已超出預算"],
    ["预算已用完", "Budget fully used", "預算已用完"],
    ["接近预算", "Near budget limit", "接近預算"],
    ["预算使用进度", "Budget used", "預算使用進度"],
    ["未设置", "Not set", "未設定"],
    ["本月剩余天数（含今天）", "Days left (including today)", "本月剩餘天數（含今天）"],
    ["仅扣除本月截至今天的支出，余额不结转。", "Only this month’s spending through today counts. Balances do not roll over.", "僅扣除本月截至今天的支出，餘額不結轉。"],
    ["预算金额（HKD）", "Budget amount (HKD)", "預算金額（HKD）"],
    ["生效范围", "Apply to", "生效範圍"],
    ["本月及以后", "This month and future months", "本月及以後"],
    ["仅本月", "This month only", "僅本月"],
    ["保存后生效；关闭或取消会放弃未保存修改。", "Changes apply when saved. Closing or cancelling discards unsaved changes.", "儲存後生效；關閉或取消會放棄未儲存修改。"],
    ["保存预算", "Save budget", "儲存預算"],
    ["停用预算", "Disable budget", "停用預算"],
    ["停用从本月起生效，历史配置保留。示例预算修改刷新后重置。", "Disabling starts this month and keeps past settings. Demo changes reset on reload.", "停用從本月起生效，歷史設定保留。示例預算修改重新整理後重置。"],
    ["无法读取本地预算，原数据未覆盖。", "Cannot read the saved budget. Original data has not been overwritten.", "無法讀取本地預算，原資料未覆蓋。"],
    ["月份或账本已变化，请关闭后重新设置预算。", "The month or ledger changed. Close and reopen to edit the budget.", "月份或帳本已變化，請關閉後重新設定預算。"],
    ["预算保存失败，请允许浏览器本地存储后重试。", "Budget could not be saved. Allow browser storage and try again.", "預算儲存失敗，請允許瀏覽器本地儲存後重試。"],
    ["已停用预算", "Budget disabled", "已停用預算"],
    ["预算已保存", "Budget saved", "預算已儲存"],

    ['今日总消费', 'Spent today', '今日總消費'],
    ['今日消费记录', 'Today’s expenses', '今日消費記錄'],
    ['开始记账', 'Add expense', '開始記帳'],
    ['关闭记账', 'Close entry', '關閉記帳'],
    ['关闭概览', 'Close overview', '關閉概覽'],
    ['常用功能', 'Quick actions', '常用功能'],
    ['日期与备注', 'Date & note', '日期與備註'],
    ['近七日消费折线图，虚线为日均', 'Seven-day spending; dashed line shows the daily average', '近七日消費折線圖，虛線為日均'],
    ['清零', 'Clear all', '清零'],
    ['加法', 'Add', '加法'], ['减法', 'Subtract', '減法'],
    ['乘法', 'Multiply', '乘法'], ['除法', 'Divide', '除法'],
    ['计算结果', 'Calculate', '計算結果'],
    ['请输入完整的计算式。', 'Enter a complete calculation.', '請輸入完整的計算式。'],
    ['不能除以零。', 'Cannot divide by zero.', '不能除以零。'],
    ['计算结果超出金额范围。', 'Result exceeds HK$9,999,999.99.', '計算結果超出金額範圍。'],
    ["类别", "Category", "類別"],
    ["历史账单", "History", "歷史帳單"],
    ["关闭历史账单", "Close history", "關閉歷史帳單"],
    ["月份选择", "Choose month", "月份選擇"],
    ["上月", "Previous month", "上月"],
    ["下月", "Next month", "下月"],
    ["年月跳转", "Jump to month", "年月跳轉"],
    ["回今天", "Today", "回今天"],
    ["已发生支出", "Spent so far", "已發生支出"],
    ["提前记账", "Future entries", "提前記帳"],
    ["日期选择", "Pick a date", "日期選擇"],
    ["按本月每日记录金额比较，含提前记账", "Darker shades mean higher daily totals, including future entries.", "按本月每日記錄金額比較，含提前記帳"],
    ["不同月份的深浅不代表相同金额", "Compare shades within this month only.", "不同月份的深淺不代表相同金額"],
    ["在这天记一笔", "Add expense", "在這天記一筆"],
    ["这天还没有消费记录", "No entries on this day", "這天還沒有消費記錄"],
    ["未来日期将在当天自动计入支出统计", "Future entries count toward spending on their date", "未來日期將在當天自動計入支出統計"],
    ["保存记录", "Save entry", "儲存記錄"],
    ["已保存记录", "Entry saved", "已儲存記錄"],
    ["编辑记录", "Edit entry", "編輯記錄"],
    ["编辑", "Edit", "編輯"],
    ["取消", "Cancel", "取消"],
    ["不选小类", "No subcategory", "不選小類"],
    ["自选日期", "Pick a date", "自選日期"],
    ["请选择有效日期。", "Choose a valid date.", "請選擇有效日期。"],
    ["放弃未保存的修改？选择取消可继续编辑。", "Discard unsaved changes? Choose Cancel to keep editing.", "放棄未儲存的修改？選擇取消可繼續編輯。"],

    ["饼图时间范围", "Pie chart date range", "圓餅圖時間範圍"],
    ["柱状图年份", "Bar chart year", "柱狀圖年份"],
    ["消费占比", "Breakdown", "消費佔比"],
    ["每月支出", "Monthly spending", "每月支出"],
    ["本月", "This month", "本月"],
    ["今年", "This year", "今年"],
    ["单位 HKD · 当月截至今天，未来月份不计入统计。", "HKD · Current month through today; future months are excluded.", "單位 HKD · 當月截至今天，未來月份不計入統計。"],

    ["当月总支出", "Month to date", "當月總支出"],
    ["当月日均", "Daily average", "當月日均"],
    ["当月主要消费", "Top category", "當月主要消費"],
    ["点击查看更多统计", "View stats", "點擊查看更多統計"],
    ["更多统计", "Statistics", "更多統計"],
    ["关闭统计", "Close statistics", "關閉統計"],
    ["当年总支出", "Year to date", "當年總支出"],
    ["自定义时间段", "Custom range", "自訂時間區間"],
    ["开始日期", "Start date", "開始日期"],
    ["结束日期", "End date", "結束日期"],
    ["查看统计", "Apply range", "查看統計"],
    ["区间总支出", "Range total", "區間總支出"],
    ["消费笔数", "Transactions", "消費筆數"],
    ["平均每笔", "Average entry", "平均每筆"],
    ["最大单笔", "Largest entry", "最大單筆"],
    ["有消费天数", "Spending days", "有消費天數"],
    ["分类明细", "Category details", "分類明細"],
    ["请选择有效日期，结束日期不得晚于今天。", "Choose valid dates ending no later than today.", "請選擇有效日期，結束日期不得晚於今天。"],
    ["日均按所选区间的全部自然日计算，包含无消费日期。当月和当年统计截至今天。", "Daily averages include every calendar day in the range, including days without spending. Month and year totals run through today.", "日均按所選區間的全部自然日計算，包含無消費日期。當月和當年統計截至今天。"],

    ["输入金额，选择日期与分类后保存。金额最多两位小数。", "Add an amount, date and category, then save. Use up to 2 decimal places.", "輸入金額，選擇日期與分類後儲存。金額最多兩位小數。"],
    ["键盘快捷键", "Keyboard shortcuts", "鍵盤快捷鍵"],
    ["固定快捷键，仅供查看，不可修改。", "Shortcuts are fixed.", "固定快捷鍵，僅供查看，不可修改。"],
    ["金额输入框内保存记账", "Save while entering an amount", "金額輸入框內儲存記帳"],
    ["选择前六个已启用分类", "Select category 1–6", "選擇前六個已啟用分類"],
    ["聚焦分类拖动按钮时调整顺序", "Reorder a focused category", "聚焦分類拖動按鈕時調整順序"],
    ["聚焦“其他”时展开更多分类", "Open the Other menu", "聚焦「其他」時展開更多分類"],
    ["关闭设置、统计或更多分类", "Close the open panel or menu", "關閉設定、統計或更多分類"],
    ["切换到下一个 / 上一个控件", "Move to the next / previous control", "切換到下一個 / 上一個控制項"],

    ["历史账单 ↗", "History ↗", "歷史帳單 ↗"],
    ["设置", "Settings", "設定"],
    ["关闭设置", "Close settings", "關閉設定"],
    ["深色 / 浅色", "Dark / Light", "深色 / 淺色"],
    ["浅色", "Light", "淺色"],
    ["深色", "Dark", "深色"],
    ["分类管理", "Categories", "分類管理"],
    ["拖动调整顺序，前五个已启用分类置顶。取消勾选仅隐藏记账入口，历史记录保留。", "Drag to reorder. The first five appear on the home screen. Hide a category by unchecking it; past entries stay.", "拖動調整順序，前五個已啟用分類置頂。取消勾選僅隱藏記帳入口，歷史記錄保留。"],
    ["拖动排序 ", "Drag to reorder ", "拖動排序 "],
    ["置顶", "Pinned", "置頂"],
    ["备注最多 50 字符。", "Notes can contain up to 50 characters.", "備註最多 50 字元。"],
    ["备注", "Note", "備註"],
    ["至少保留一个分类。", "Keep at least one category enabled.", "至少保留一個分類。"],
    ["设置未能保存，刷新后将恢复。", "Settings could not be saved and will reset on reload.", "設定未能儲存，重新整理後將恢復。"],

    ['更多分类', 'More categories', '更多分類'],
    ["大类", "Category", "大類"],
    ["小类", "Subcategory", "小類"],
    ["不细分", "General", "不細分"],
    ["学习", "Learning", "學習"],
    ["健康", "Health", "健康"],
    ["旅行", "Travel", "旅行"],
    ["人情", "Gifts", "人情"],
    ["家庭", "Family", "家庭"],
    ["宠物", "Pets", "寵物"],
    ["正餐", "Meals", "正餐"],
    ["早餐", "Breakfast", "早餐"],
    ["零食", "Snacks", "零食"],
    ["水果", "Fruit", "水果"],
    ["饮品", "Drinks", "飲品"],
    ["食材", "Groceries", "食材"],
    ["公共交通", "Public transit", "公共交通"],
    ["打车", "Taxi", "搭車"],
    ["燃油", "Fuel", "燃油"],
    ["停车", "Parking", "停車"],
    ["车辆保养", "Car care", "車輛保養"],
    ["服饰", "Clothing", "服飾"],
    ["鞋包", "Shoes & bags", "鞋包"],
    ["日用品", "Essentials", "日用品"],
    ["数码产品", "Electronics", "數碼產品"],
    ["美妆护肤", "Skincare", "美妝護膚"],
    ["房租", "Rent", "房租"],
    ["水电煤", "Utilities", "水電煤"],
    ["家居", "Furnishings", "家居"],
    ["通讯", "Phone & internet", "通訊"],
    ["维修", "Repairs", "維修"],
    ["电影演出", "Movies & shows", "電影演出"],
    ["游戏", "Games", "遊戲"],
    ["会员订阅", "Subscriptions", "會員訂閱"],
    ["聚会", "Gatherings", "聚會"],
    ["兴趣爱好", "Hobbies", "興趣愛好"],
    ["书籍", "Books", "書籍"],
    ["课程", "Courses", "課程"],
    ["文具", "Stationery", "文具"],
    ["软件工具", "Software", "軟體工具"],
    ["打印", "Printing", "列印"],
    ["就医", "Medical visits", "就醫"],
    ["药品", "Medicine", "藥品"],
    ["体检", "Checkups", "體檢"],
    ["运动健身", "Fitness", "運動健身"],
    ["保健", "Wellness", "保健"],
    ["机票车票", "Tickets", "機票車票"],
    ["住宿", "Stays", "住宿"],
    ["景点", "Attractions", "景點"],
    ["当地交通", "Local transit", "當地交通"],
    ["旅行用品", "Travel supplies", "旅行用品"],
    ["礼物", "Presents", "禮物"],
    ["红包", "Cash gifts", "紅包"],
    ["请客", "Treating others", "請客"],
    ["公益捐赠", "Donations", "公益捐贈"],
    ["育儿", "Childcare", "育兒"],
    ["长辈", "Elders", "長輩"],
    ["家庭服务", "Home services", "家庭服務"],
    ["共同开支", "Shared expenses", "共同開支"],
    ["宠物食品", "Pet food", "寵物食品"],
    ["宠物用品", "Pet supplies", "寵物用品"],
    ["宠物医疗", "Vet care", "寵物醫療"],
    ["宠物护理", "Pet grooming", "寵物護理"],
    ["手续费", "Fees", "手續費"],
    ["快递", "Delivery", "快遞"],
    ["其他支出", "Other expenses", "其他支出"],

    ['输入金额，选择日期与分类后保存。Enter 保存，Alt + 1–6 选择分类。金额最多两位小数。', 'Enter an amount, choose a date and category. Enter to save; Alt + 1–6 to select a category. Up to two decimal places.', '輸入金額，選擇日期與分類後儲存。Enter 儲存，Alt + 1–6 選擇分類。金額最多兩位小數。'],
    ['仅在本地预览；尚未发送数据，也未生成 AI 周报。', 'Local preview only. No data has been sent and no AI report has been generated.', '僅在本地預覽；尚未傳送資料，也未產生 AI 週報。'],
    ['查看周报汇总数据', 'Weekly summary data', '檢視週報彙總資料'],
    ['尚未连接 API', 'Not connected', '尚未連接 API'],
    ['记录保存在当前浏览器', 'Entries stay in this browser', '記錄儲存在目前瀏覽器'],
    ['今天', 'Today', '今天'], ['昨天', 'Yesterday', '昨天'],
    ['输入金额、选择分类，点击「记一笔」。记录仅保存在当前浏览器，清除浏览器数据会删除账本。示例账本与个人账本分开。AI 周报暂未接入。外观默认跟随系统，右上角可手动切换并记住选择。', 'Enter an amount, choose a category, then select “Add expense”. Your ledger stays in this browser; clearing browser data removes it. The demo ledger is separate. AI reports are not connected yet. Appearance follows your system until you choose a theme.', '輸入金額、選擇分類，點擊「記一筆」。記錄僅儲存在目前瀏覽器，清除瀏覽器資料會刪除帳本。示例帳本與個人帳本分開。AI 週報暫未接入。外觀預設跟隨系統，右上角可手動切換並記住選擇。'],
    ['使用键盘或数字按钮输入金额，选择分类后保存。每笔记录使用保存当天的日期，金额最多保留两位小数。', 'Use your keyboard or the keypad to enter an amount, then choose a category and save. Entries use today’s date. Amounts support up to two decimal places.', '使用鍵盤或數字按鈕輸入金額，選擇分類後儲存。每筆記錄使用儲存當天的日期，金額最多保留兩位小數。'],
    ['近 7 天含今天与前 6 个自然日，近 30 天含今天与前 29 天。日均按整个所选区间计算；全部时间从首笔记录起计算。', 'Last 7 days includes today and the previous 6 calendar days; last 30 days includes today and the previous 29. Daily averages include every day in the period. All time starts with your first entry.', '近 7 天含今天與前 6 個曆日，近 30 天含今天與前 29 天。日均按整個所選區間計算；全部時間從首筆記錄起計算。'],
    ['预留功能，尚未连接 API。未来仅在你请求时发送近 7 天的汇总统计，生成简短周报；金额始终由程序计算。', 'Not connected yet. When available, reports will send only seven-day aggregate statistics on request. All amounts are calculated by code.', '預留功能，尚未連接 API。未來僅在你請求時傳送近 7 天的彙總統計，產生簡短週報；金額始終由程式計算。'],
    ['无法读取本地账本，原数据未覆盖。可先使用示例账本。', 'Cannot read your local ledger. Existing data is untouched. You can use the demo ledger.', '無法讀取本地帳本，原資料未覆蓋。可先使用示例帳本。'],
    ['本地账本无法读取，请先使用示例账本。', 'Cannot read your local ledger. Please use the demo ledger.', '本地帳本無法讀取，請先使用示例帳本。'],
    ['保存失败：请允许浏览器本地存储后重试。', 'Could not save. Allow local browser storage and try again.', '儲存失敗：請允許瀏覽器本地儲存後重試。'],
    ['请输入有效金额，最多两位小数。', 'Enter a valid amount with up to two decimal places.', '請輸入有效金額，最多兩位小數。'],
    ['金额须在 HK$0.01–9,999,999.99 之间。', 'Enter an amount from HK$0.01 to HK$9,999,999.99.', '金額須在 HK$0.01–9,999,999.99 之間。'],
    ['请选择一个分类。', 'Choose a category.', '請選擇一個分類。'],
    ['这个时间段还没有消费记录', 'No expenses in this period', '這個時段還沒有消費記錄'],
    ['从第一笔消费开始', 'Start with your first expense', '從第一筆消費開始'],
    ['记下消费，看看每天的变化', 'Add expenses to see your daily trend', '記下消費，看看每天的變化'],
    ['简洁的港币记账与消费统计。', 'Simple HKD expense tracking and spending insights.', '簡潔的港幣記帳與消費統計。'],
    ['每一笔，都清楚。', 'Know your spending.', '每一筆，都清楚。'],
    ['简单记录，慢慢了解。', 'Small entries. Clear insights.', '簡單記錄，慢慢了解。'],
    ['YOUR EVERYDAY, IN VIEW', 'YOUR EVERYDAY, IN VIEW', 'YOUR EVERYDAY, IN VIEW'],
    ['消费手记', 'Spending journal', '消費手記'], ['本地账本', 'Local ledger', '本地帳本'],
    ['使用指南', 'Quick guide', '使用指南'], ['账本选择', 'Choose ledger', '帳本選擇'],
    ['我的账本', 'My spending', '我的帳本'], ['示例账本', 'Try demo', '示例帳本'],
    ['个人账本', 'My spending', '個人帳本'], ['示例数据 · 不保存', 'Demo · not saved', '示例資料 · 不儲存'],
    ['记账帮助', 'Entry help', '記帳說明'], ['记一笔', 'Add expense', '記一筆'],
    ['数字键盘', 'Numeric keypad', '數字鍵盤'], ['删除一位', 'Backspace', '刪除一位'],
    ['消费概览', 'Overview', '消費概覽'], ['统计时间范围', 'Time period', '統計時段'],
    ['统计范围说明', 'Period help', '統計範圍說明'], ['近 7 天', 'Last 7 days', '近 7 天'],
    ['近 30 天', 'Last 30 days', '近 30 天'], ['全部时间', 'All time', '全部時間'],
    ['总支出', 'Total spending', '總支出'], ['日均支出', 'Daily average', '日均支出'],
    ['主要消费', 'Top category', '主要消費'], ['暂无记录', 'No entries yet', '暫無記錄'],
    ['支出趋势', 'Spending trend', '支出趨勢'], ['分类占比', 'By category', '分類佔比'],
    ['AI 每周回顾', 'Weekly insights', 'AI 每週回顧'], ['即将开放', 'Coming soon', '即將開放'],
    ['周报说明', 'Report help', '週報說明'], ['生成周报', 'Create report', '產生週報'],
    ['暂无支出', 'No spending yet', '暫無支出'], ['消费记录', 'Expenses', '消費記錄'],
    ['上一页', 'Previous page', '上一頁'], ['下一页', 'Next page', '下一頁'],
    ['切换到白天模式', 'Switch to light mode', '切換至日間模式'], ['切换到夜间模式', 'Switch to dark mode', '切換至夜間模式'],
    ['已记入示例账本', 'Added to the demo ledger', '已記入示例帳本'], ['已记下这笔消费', 'Expense saved', '已記下這筆消費'],
    ['已删除这笔消费', 'Expense deleted', '已刪除這筆消費'], ['已恢复记录', 'Expense restored', '已還原記錄'],
    ['暂无分类数据', 'No category data yet', '暫無分類資料'], ['消费分布', 'Breakdown', '消費分佈'],
    ['占总支出 ', 'Share of total: ', '佔總支出 '], [' 笔记录', ' entries', ' 筆記錄'],
    ['每日支出', 'Daily spending', '每日支出'], ['单位港币；虚线为日均', 'in HKD; dashed line: daily average', '單位港幣；虛線為日均'],
    [' 天一组的日均支出', '-day groups, daily average', ' 天一組的日均支出'], ['每 ', 'Every ', '每 '],
    ['日均', 'Daily avg.', '日均'], [' 至 ', ' to ', ' 至 '], [' 港币', ' HKD', ' 港幣'],
    [' 类', ' categories', ' 類'], [' 笔', ' entries', ' 筆'],
    ['餐饮', 'Food', '餐飲'], ['交通', 'Transport', '交通'], ['购物', 'Shopping', '購物'],
    ['生活', 'Living', '生活'], ['娱乐', 'Leisure', '娛樂'], ['其他', 'Other', '其他'],
    ['分类', 'Category', '分類'], ['金额', 'Amount', '金額'], ['日期', 'Date', '日期'],
    ['操作', 'Actions', '操作'], ['撤销', 'Undo', '復原'], ['删除 ', 'Delete ', '刪除 '],
    ['语言', 'Language', '語言'], ['，', ', ', '，'], ['：', ': ', '：'],
  ];
  const ordered = [...phrases].sort((a, b) => b[0].length - a[0].length);
  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(ordered.map(row => escape(row[0])).join('|'), 'g');
  const dictionary = new Map(phrases.map(row => [row[0], row]));
  const originals = new WeakMap();
  function translate(source) {
    if (language === 'zh-CN') return source;
    return source.replace(pattern, match => dictionary.get(match)[language === 'en' ? 1 : 2]);
  }
  function update(node, field, current, write) {
    let fields = originals.get(node);
    if (!fields) { fields = new Map(); originals.set(node, fields); }
    let item = fields.get(field);
    if (!item || current !== item.last) item = { source: current };
    item.last = translate(item.source); fields.set(field, item);
    if (current !== item.last) write(item.last);
  }
  function apply() {
    document.documentElement.lang = language;
    const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement || node.parentElement.closest('script,style,[data-no-translate]')) continue;
      const text = node;
      update(text, 'text', text.nodeValue, value => { text.nodeValue = value; });
    }
    document.querySelectorAll('[aria-label],meta[name="description"]').forEach(element => {
      const attribute = element.matches('meta') ? 'content' : 'aria-label';
      update(element, attribute, element.getAttribute(attribute), value => element.setAttribute(attribute, value));
    });
    const calendarLabels = {'一':['Mon','一'], '二':['Tue','二'], '三':['Wed','三'], '四':['Thu','四'], '五':['Fri','五'], '六':['Sat','六'], '日':['Sun','日'], '少':['Less','少'], '多':['More','多'], '预':['F','預']};
    document.querySelectorAll('.calendar-week span,.calendar-legend span,.calendar-grid em').forEach(el => {
      const source = el.dataset.calendarLabel || el.textContent; el.dataset.calendarLabel = source;
      if (calendarLabels[source]) el.textContent = language === 'zh-CN' ? source : calendarLabels[source][language === 'en' ? 0 : 1];
    });
    document.querySelectorAll('[data-language]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
  }
  window.AppI18n = { apply, translate };
  document.documentElement.lang = language;
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    document.querySelectorAll('[data-language]').forEach(button => {
      button.addEventListener('click', () => {
        language = button.dataset.language;
        try { localStorage.setItem(key, language); } catch {}
        apply();
      });
    });
  });
})();
