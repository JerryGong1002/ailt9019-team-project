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

Personal records are stored in browser `localStorage`. A separate demo ledger contains two weeks of synthetic data; demo changes reset on reload and do not affect personal records. The optional backend generates AI reports from aggregate data; it does not store or synchronize ledgers across devices.

Amounts are stored as integer HKD cents and converted to HKD for display. Notes stay in local records and are excluded from the weekly-report payload.

The last seven days means today and the preceding six local calendar days, including both boundaries. Future-dated entries are excluded from actual spending statistics. Daily averages include every calendar day in the selected interval, including days without expenses. All-time statistics run from the first record through today.

For trends longer than 30 days, consecutive date buckets show average daily spending within each bucket. The horizontal reference line represents the daily average across the full selected interval.

## AI weekly report

The weekly-review button now calls a same-origin Node backend, which sends aggregate statistics to the configured AI provider (OpenAI Responses or Alibaba-compatible Chat Completions). The global master prompt lives in `server/weekly-report-prompt.txt` and includes one clarification: matching category totals cannot establish the category of the maximum expense. It requests a neutral English paragraph of 3–5 sentences, without recommendations. Raw records, IDs, notes, subcategories, and creation timestamps are never sent. Reports stay in browser memory and disappear when the selected ledger or summary changes or the page reloads.

The browser produces two adjacent seven-day summaries ending on the user's local date. The server validates dates, totals, counts, categories, daily totals and maximum amounts, then calculates category shares and changes. Percentage change is null when the previous total is zero. Zero previous recorded spending is a valid recorded baseline, not evidence about real-world spending. Empty current weeks use the exact fallback locally without a paid request. Invalid summaries are rejected before the API is called.

### Run the full pipeline locally

Requires Node.js 22 or newer; no npm packages are needed.

1. Copy `.env.example` to `.env` in the repository root.
2. Set the provider credentials and model in `.env` as described below. Never put the key in `dist/` or browser code.
3. Run:

```sh
node --env-file=.env server/server.cjs
```

4. Open the URL printed by the server, select Demo, inspect the summary, then click **Generate weekly report**. The default port is 9019; the current local `.env` uses `PORT=9020`, so its URL is `http://127.0.0.1:9020`. Leave the terminal running while using the app; press Ctrl+C to stop it.

Without credentials, the server still serves the app and reports a clear configuration error for non-empty reports. Python static hosting and directly opening the HTML remain available for the ledger but do not provide AI reporting. Continue using the same browser origin to retain your existing personal records.

### Alibaba Cloud Bailian configuration

Use server-only environment variables:

```dotenv
AI_API_FORMAT=chat
AI_BASE_URL=https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1
AI_MODEL=qwen3.8-flash
AI_ENABLE_THINKING=false
AI_API_KEY=your-private-group-key
```

The actual group key belongs only in the Git-ignored `.env` or host secret settings. It is never included in the example file, browser assets, or tests. The configured Flash model was listed by the course endpoint's `/models` response on 23 October 2026. The course message says the shared allocation is 25,000 credits, coursework only, expiring 19 November 2026; model availability and credit consumption remain provider-controlled.

The backend uses `/chat/completions` with the master prompt as a system message and summary JSON as a user message. Qwen thinking mode is disabled for short direct answers. Only a completed text answer is accepted; truncated responses are treated as errors. One upstream call may run at a time **per server process**, with no automatic retries. Other group members and additional deployments are outside this concurrency limit. For OpenAI instead, retain `AI_API_FORMAT=responses`, set `AI_BASE_URL=https://api.openai.com/v1`, and supply an OpenAI key/model; legacy `OPENAI_API_KEY` and `OPENAI_MODEL` variables remain supported.

Alibaba's public endpoint documentation labels Token Plan access for coding tools rather than backend services. The course-provided access and instructions should be checked with the teaching team before a public deployment; use the configuration appropriate to the sponsored arrangement.

### Local demo server

The app does not require a demo access code. It binds to `127.0.0.1` by default for local use. Keep the provider key in `.env`; the browser calls the local server without a password.

`.openai/hosting.json` is static-only and cannot run the report backend. For the local full pipeline, use the Node command above.

A global process-local limit allows 30 provider attempts per hour by default, configurable with `REPORT_MAX_CALLS_PER_HOUR` (1–1000). Failed attempts count too. One provider call may run at a time, calls time out after 30 seconds, and output is capped at 2048 tokens. The hourly cap resets on process restart.

No provider secrets or upstream errors are sent to the browser. OpenAI Responses requests use `store: false`; Chat Completions requests omit this provider-specific setting. Neither promises zero retention by the provider. No application-level expense/report database or request-body logging is added. The prompt guides factual behavior but does not guarantee factual accuracy; inspect real outputs before presenting. Live provider access, model compatibility, latency and report quality require a credentialed smoke test.

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
| `dist/report-data.js` | Aggregate report schema, validation, and comparisons |
| `dist/report-ui.js` | Explicit generation, loading/errors, and stale-response protection |
| `server/server.cjs` | Static server and local AI report endpoint |
| `server/weekly-report-prompt.txt` | Global report master prompt |
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
node --check dist/report-data.js
node --check dist/report-ui.js
node --check server/server.cjs
node --test tests/*.test.cjs
```

The tests cover statistical boundaries, calendar behavior, calculator precedence and precision, invalid input, budget inheritance and overrides, disabling budgets, year transitions, leap months, future expenses, usage thresholds, and malformed budget data.
