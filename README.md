# Spending Analyzer

A browser-based HKD expense tracker developed for the AILT9019 Group 9 team project. It combines expense entry, spending summaries, a transaction calendar, an arithmetic calculator, and monthly budgets in a dependency-free frontend.

## Project language requirement

The current prototype defaults to English on first use and remembers the selected language. It also contains legacy Simplified Chinese and Traditional Chinese translations and Chinese source strings. These remain in the implementation and require a separate migration to meet the project-wide English requirement fully.

## Run locally

From the repository root:

```powershell
python -m http.server 9019 --bind 127.0.0.1 --directory dist
```

Open [http://127.0.0.1:9019](http://127.0.0.1:9019). Python is needed only for this local server; no frontend dependencies or build step are required. You can also open `dist/index.html` directly.

Use the same browser and origin to access the same personal ledger. Browser storage is local to that browser and origin.

## Features

### Expense entry and records

- Record HKD expenses using 12 main categories and 56 optional subcategories.
- Enter an amount directly or use the built-in calculator. Choose today, yesterday, or a custom date and add a note of up to 50 characters.
- Press Enter to save or Alt + 1–6 to select a category.
- Browse records grouped by date with daily subtotals, and filter by the last 7 days, last 30 days, or all time.
- Edit an entry inline, including its amount, category, subcategory, date, and note. Editing preserves the record ID and creation time.
- Delete entries with a 12-second undo window.
- Reorder categories by dragging or using the arrow keys on a focused drag handle. The first five enabled categories appear on the main entry panel; the rest are available through More. At least one category must remain enabled. Hiding a category preserves its historical records and statistics.

### Overview and statistics

- The desktop overview shows spending, daily average, and the leading category for the current month through today.
- More Statistics provides year-to-date totals and custom inclusive date ranges, with total spending, daily average, transaction count, average transaction amount, largest transaction, active spending days, and category shares.
- The mobile home screen shows today's spending and records, plus a seven-day trend with a daily-average reference line.
- Charts and summaries use the currently selected ledger.

### Transaction calendar

- Browse months, jump to a year and month, return to today, or select dates using the arrow keys.
- View daily details and add or edit entries from the calendar. Leaving an unsaved calendar form prompts for confirmation.
- Four blue intensity levels represent daily spending relative to the highest daily amount in the displayed month. Colors are relative to each month.
- Future-dated entries appear in the calendar and advance-entry totals. They enter actual spending statistics when their date arrives.
- Date-dependent views refresh at local midnight and when the page becomes active again.

### Calculator

- Supports addition, subtraction, multiplication, division, operator precedence, clear, backspace, and equals.
- Accepts keyboard input and pasted expressions. Backspace removes input, Delete clears it, and Enter saves a valid expense.
- Uses exact fractions for intermediate calculations and rounds only the final result to two decimal places. For example, `10 / 3 * 3` produces `10.00`.
- Rejects division by zero, incomplete expressions, out-of-range amounts, and non-positive expense totals.

### Monthly budgets

- Shows the remaining budget, amount spent, and usage progress for the current month.
- Applies an initial budget to this month and future months. Later changes can apply to this month only or to this month and future months.
- Retains historical settings without carrying forward unused balances or overspending.
- Counts actual spending from the first day of the month through today; future entries count when their date arrives.
- Warns at 80% usage, shows full usage at 100%, and displays the overspent amount above the limit. Expense entry remains available.
- Includes today in the remaining-day count.
- Disabling a budget takes effect from the current month. Re-enabling requires an amount.
- Closing settings discards unsaved changes; failed saves preserve the input. A month change requires reopening settings before saving.
- Stores personal budget settings under `spending-analyzer.budget.v1` using integer HKD cents. Unreadable budget data is not automatically overwritten.
- Provides a separate HK$3,000 demo budget whose changes reset on reload. Historical budget browsing is not currently available.

### Appearance and mobile layout

- Responsive layouts support desktop and mobile screens, including a dedicated mobile entry panel at widths of 720px and below.
- Light and dark themes follow the system preference initially and remember a manual selection.
- Mobile shortcuts open the calendar, statistics, overview, and settings. Dialogs support Escape, close buttons, and backdrop dismissal, with confirmation where unsaved calendar changes need protection.
- The mobile entry panel preserves unfinished input when closed and reopened.
- Category reordering respects reduced-motion preferences. Charts use inline SVG without external fonts, images, or chart libraries.

## Data and calculation rules

Personal records are stored in browser `localStorage`. A separate demo ledger contains two weeks of synthetic data; demo changes reset on reload and do not affect personal records. There is no backend or cross-device synchronization.

Amounts are stored as integer HKD cents and converted to HKD for display. Notes stay in local records and are excluded from the weekly-report payload.

The last seven days means today and the preceding six local calendar days, including both boundaries. Future-dated entries are excluded from actual spending statistics. Daily averages include every calendar day in the selected interval, including days without expenses. All-time statistics run from the first record through today.

For trends longer than 30 days, consecutive date buckets show average daily spending within each bucket. The horizontal reference line represents the daily average across the full selected interval.

## Weekly report and planned API integration

The weekly-report area currently displays an API-disconnected state and lets users inspect a locally generated summary JSON payload. It does not call an agent API or generate an AI report.

In `dist/app.js`, `statistics(entries, '7')` produces the weekly summary. A future backend should call the agent API with credentials stored on the server. Send only the approved summary fields: `currency`, `start`, `end`, `total`, `average`, `count`, and category totals. Exclude raw `rows`, record IDs, notes, and individual transactions.

Preserve explicit empty-week and API-failure states. Numerical summaries and charts should continue to work independently of the API.

The current frontend implements calculations in JavaScript. A future Python backend should preserve the same validation, date boundaries, and statistical rules.

## Repository structure

| Path | Purpose |
| --- | --- |
| `dist/index.html` | Application markup and entry point |
| `dist/styles.css` | Responsive layout and visual styles |
| `dist/app.js` | Ledger management, expense entry, summaries, and charts |
| `dist/calendar.js` | Calendar navigation and transaction editing |
| `dist/calculator.js` | Arithmetic parsing and calculator behavior |
| `dist/budget.js` | Budget validation, settings, calculations, and interface |
| `dist/i18n.js` | Existing language selection and translation layer |
| `dist/theme.js` | Theme selection and persistence |
| `tests/*.test.cjs` | Statistics, calendar, calculator, and budget tests |
| `.openai/hosting.json` | Static hosting configuration targeting `dist` |

The `dist` directory contains the complete runnable frontend source. A static hosting configuration is included in the repository; the application itself remains a browser-local prototype.

## Validation

With Node.js installed, run:

```powershell
node --check dist/app.js
node --check dist/calendar.js
node --check dist/calculator.js
node --check dist/budget.js
node --check dist/i18n.js
node --check dist/theme.js
node --test tests/*.test.cjs
```

The tests cover statistical boundaries, calendar behavior, calculator precedence and precision, invalid input, budget inheritance and overrides, disabling budgets, year transitions, leap months, future expenses, usage thresholds, and malformed budget data.
