# Copilot Instructions — Budget Tracker

These instructions apply to every file in this repository. Read them before generating, completing, or refactoring any code. When a suggestion would conflict with a rule below, follow the rule.

---

## 1. Role & Core Objective

You are assisting on **Budget Tracker**, a precision personal-finance web app implementing a **50/15/25/10 budgeting method** (Essentials / Growth / Lifestyle / Savings), plus alternate budget profiles (Aggressive Saver, Debt Crusher, High Cost of Living, etc.).

This is a **financial tool handling real money data**. Correctness matters more than cleverness:

- All monetary math must be rounded to 2 decimal places using cents-safe patterns (`Math.round(v * 100) / 100`), never raw floating point.
- Never let a subcategory budget, expense, or transaction silently disappear, double-count, or desync from its parent category/month.
- Every mutation to transactions or budgets must reverse the *old* value before applying the *new* one (see `saveEdit()` in `transactions.js` for the canonical pattern: reverse old `spent`, then apply new `spent`).
- State is scoped **per month** (`STATE.months[key]`). Never write budget/transaction data to the wrong month, and never assume `STATE.activeMonth` without reading it fresh.

When in doubt, prioritize **data integrity and predictability** over UI polish.

---

## 2. Tech Stack Constraints

**Stack:** Vanilla HTML5 + CSS3 + Vanilla JavaScript. Supabase (`@supabase/supabase-js@2`) for auth/data. OneSignal for push notifications.

### Hard rules

- ❌ **No frameworks or libraries.** No React, Vue, Svelte, jQuery, lodash, or any bundler/build step (no Webpack, Vite, esbuild). This is a zero-build, CDN-script project.
- ❌ **No ES modules (`import`/`export`, `type="module"`).** All scripts are loaded as plain `<script src="...">` tags in a fixed dependency order and share the **global `window` scope** on purpose — every function must remain callable from inline `onclick="..."` handlers in `index.html`.
- ❌ **Never introduce TypeScript, JSX, or a `.ts` file.** This is a plain-JS codebase.
- ✅ **Respect the existing module boundaries.** Each file in `js/` owns one concern. When adding a function, put it in the file that already owns that concern — do not create new files unless a genuinely new concern is introduced, and if you do, add a `<script src>` tag for it in `index.html` in the correct dependency position.

### Module responsibilities (do not blur these lines)

| File | Owns |
|---|---|
| `js/supabase-client.js` | Supabase client instantiation, `currentUser`, `authInProgress`. Loads first. |
| `js/state.js` | The `STATE` object shape, `MONTH_NAMES`, `defaultBD()`, `initState()`, `ensureMonth()`, `activeData()`, `saveState()`/`loadState()` (Supabase persistence). This is the single source of truth for data shape. |
| `js/helpers.js` | Generic, stateless utilities used everywhere: `$id()`, `money()`, `getIncome()`, `totalAssigned()`, `saveAndRender()`. No DOM rendering of feature UI here. |
| `js/months.js` | Month lifecycle: create, switch, delete, chronological sorting, the New Month modal, and the Month Picker modal. |
| `js/income.js` | Paycheck input, pay-frequency math, category weight sliders (`WEIGHTS`), applying budget targets. |
| `js/subcategories.js` | Subcategory CRUD: set budget, rename, quick-add presets, delete, income-cap enforcement. |
| `js/transactions.js` | Expense entry forms, the edit-transaction modal, delete, CSV export. Owns the "reverse old spent, apply new spent" pattern. |
| `js/render.js` | All DOM re-rendering: `render()`, `renderStatCards()`, `renderRecentTx()`. If it writes `innerHTML` for the main UI, it belongs here. |
| `js/navigation.js` | `switchTab()` and tab-visibility wiring only. |
| `js/profiles.js` | `BUDGET_PROFILES` data and profile-selection logic. Wraps `switchTab`/`saveIncomeToState` — must load **after** `navigation.js` and `income.js`. |
| `js/auth.js` | Login, signup, passkeys, notification permission flow, `initApp()` bootstrapping. Loads **last** since it triggers session restore on load. |

**Never** reorder `<script>` tags in `index.html` without re-checking these dependency constraints.

### Global state management pattern

- `STATE` is a single global object: `{ activeMonth, months: { [monthKey]: { income, perCheck, payFreq, bd, txs } } }`.
- Always read the active month via `activeData()` — never index `STATE.months[...]` directly from feature code.
- Any function that mutates `STATE` must be followed by either `saveState()` (persist only) or `saveAndRender()` (persist + re-render). Prefer `saveAndRender()` for anything the user should see reflected immediately.
- Do not introduce component-local state, closures holding a private copy of budget data, or any second source of truth. `STATE` is authoritative; the DOM is a derived view of it.
- Supabase calls that read/write `STATE` (`saveState()`, `loadState()`) already exist in `state.js` — call them, don't reimplement persistence elsewhere.

---

## 3. UI & Styling Rules

- **All styling lives in `css/styles.css`.** `index.html` must stay markup-only.
- **Strictly reuse the dark-mode theme variables** defined in `:root` — e.g. `--bg`, `--s1`, `--s2`, `--s3`, `--t1`–`--t4`, `--ln`/`--ln2`/`--ln3`, `--c-growth`, `--c-lifestyle`, `--c-savings`, `--r-sm`/`--r-md`/`--r-lg`/`--r-xl`, `--font`, `--ease`. Never hardcode a raw hex/rgba color, spacing value, or font stack that duplicates an existing variable's purpose — extend the `:root` block with a new variable instead if a genuinely new value is needed.
- **Do not invent a light-mode theme or new color palette.** This app is dark-mode-only by design.
- **Prefer real CSS classes over inline `style="..."` attributes.** Inline styles are acceptable *only* when a value must be computed at render time (e.g. a progress-bar `width:X%`, or a `display:none/flex` toggle written from JS). Static, reusable styling always goes in `styles.css` as a class.
- **Match existing class-naming conventions**, which are short and utility-flavored (`.ccard`, `.scard`, `.brow`, `.bname`, `.gbtn`, `.gbtn.sm`, `.gbtn.ghost`, `.badge`, `.mtab`, `.mp-row`, etc.). New components should follow this same terse, prefix-grouped naming style, not BEM or verbose utility-class patterns.
- **Mobile-first, iPhone-viewport-safe.** Any new UI must fit inside a narrow (~380px) viewport without horizontal overflow. Use the existing responsive patterns (`@media(max-width:860px)`, the bottom `#mobileNav`, modal-based pickers) rather than introducing new breakpoints ad hoc.
- **Reuse existing UI primitives** before building new ones: `.modal-bg`/`.modal` for dialogs, `.gbtn`/`.gbtn.ghost`/`.gbtn.danger` for buttons, `.card`/`.ccard`/`.scard` for panels, `.inp`/`.sel` for form fields.

---

## 4. Code Quality Preferences

- **Clean, small, single-purpose functions.** If a function is doing DOM building *and* state mutation *and* persistence, split it — rendering, mutation, and persistence should be identifiable as distinct steps (mutate → `saveAndRender()`), matching the existing style throughout the codebase.
- **Use `async/await` for all Supabase calls** (auth and data). Do not use `.then()`/`.catch()` chains for new Supabase code — follow the existing pattern in `state.js` (`saveState`, `loadState`) and `auth.js` (`doLogin`, `initApp`).
- **Explicit error handling around every Supabase call:**
  ```js
  async function exampleSupabaseCall(){
    try {
      const { data, error } = await sb.from('table').select('*');
      if(error) throw error;
      // handle success
    } catch(e){
      console.error('exampleSupabaseCall error:', e);
      // surface a user-facing message via existing UI patterns
      // (e.g. an #xMsg element, or alert() for blocking failures)
    }
  }
  ```
  Never let a Supabase error fail silently — always `console.error` with a function-name prefix, and surface user-facing feedback consistent with existing patterns (inline `#...Msg` paragraph elements, `alert()` for blocking confirmations, or `confirm()` before destructive actions).
- **Guard destructive actions.** Deleting a month, subcategory, or transaction must go through a `confirm()` (or an in-app modal equivalent) before mutating `STATE`, matching `deleteMonth()`/`deleteSub()`/`deleteTx()`.
- **Money handling:** always run monetary values through `money()` for display and through `Math.round(v*100)/100` before storing. Never display a raw floating-point number to the user.
- **Naming conventions:** `camelCase` for functions/variables, `UPPER_SNAKE_CASE` for module-level constants (`STATE`, `WEIGHTS`, `MONTH_NAMES`, `BUDGET_PROFILES`), `$id()` (not `document.getElementById` directly) when fetching DOM nodes by id.
- **No dead code paths.** If you replace a function (e.g. an old prompt-based flow with a modal-based one), remove the old function and its references entirely rather than leaving it unused "just in case."
- **Comment sparingly and meaningfully** — existing files use short banner comments (`// ── SECTION NAME ──`) to divide concerns within a file. Follow this convention for new sections rather than dense inline commentary.
- **Never suggest committing secrets.** The Supabase URL/publishable key are already present in `supabase-client.js` by design (public anon key) — do not flag or attempt to "fix" this as a secret leak, but never introduce a service-role key or any other private credential into client code.

---

## 5. App Architecture & Data Flow

### Project Overview

Budget Tracker is a **zero-based budgeting SPA** where every dollar of monthly income is allocated to one of four categories. Users set income, choose a budget profile (weight split), build subcategories, and log expenses. Data is persisted to Supabase per authenticated user, per month.

**Tech:** Vanilla HTML/CSS/JS, Supabase (auth + PostgreSQL), OneSignal (push), hosted on GitHub Pages.

### File Map

```
budget-tracker/
├── index.html              # SPA shell: auth screen, sidebar, 5 tab panels, modals
├── css/styles.css          # Dark theme design system (231 lines)
├── js/
│   ├── supabase-client.js  # Supabase init, currentUser, authInProgress (loads 1st)
│   ├── state.js            # STATE object, initState(), activeData(), saveState(), loadState()
│   ├── helpers.js          # $id(), money(), getIncome(), totalAssigned(), saveAndRender()
│   ├── months.js           # Month CRUD, month tabs, month picker modal
│   ├── income.js           # Paycheck input, WEIGHTS sliders, applyTargets()
│   ├── subcategories.js    # Subcategory CRUD, budget capping, preset quick-add
│   ├── transactions.js     # Expense entry, edit modal, delete, CSV export
│   ├── render.js           # render(), renderStatCards(), renderRecentTx()
│   ├── navigation.js       # switchTab() — tab visibility
│   ├── profiles.js         # BUDGET_PROFILES, profile chips, wraps switchTab/saveIncomeToState
│   └── auth.js             # Login/signup/passkey, initApp(), session restore (loads last)
├── OneSignalSDKWorker.js   # OneSignal service worker
├── months.js               # (legacy, unused)
├── nvidiaapi.py            # (unrelated)
└── copilot-instructions.md # This file
```

### Script Load Order (in index.html)

```
1. supabase-client.js   (sb, currentUser, authInProgress)
2. state.js             (STATE, activeData, initState, saveState, loadState)
3. helpers.js           ($id, money, getIncome, totalAssigned, saveAndRender)
4. months.js            (month CRUD, depends on state + helpers)
5. income.js            (WEIGHTS, income math, depends on state + helpers)
6. subcategories.js     (subcategory CRUD, depends on state + helpers)
7. transactions.js      (expense entry, depends on state + helpers + subcategories)
8. render.js            (DOM rendering, depends on state + helpers + months)
9. navigation.js        (switchTab, depends on render + income + transactions)
10. profiles.js         (BUDGET_PROFILES, wraps switchTab/saveIncomeToState)
11. auth.js             (initApp, session restore — triggers full app boot)
```

### STATE Data Model

```js
STATE = {
  activeMonth: "2026-08",           // "YYYY-MM" key
  months: {
    "2026-08": {
      income: 5000,                 // monthly take-home pay
      perCheck: 2500,               // raw per-check amount entered by user
      payFreq: "semimonthly",       // "monthly" | "semimonthly" | "biweekly"
      bd: [                         // 4 budget categories (always 4)
        {
          name: "Essentials",       // user-editable category name
          pool: 2500,               // category-level budget (from weights × income)
          pct: 0.50,                // weight as decimal (0-1)
          subs: [                   // subcategories
            {
              name: "Rent",
              budget: 1500,         // subcategory budget
              spent: 1500           // total spent in this subcategory
            }
          ]
        },
        { name: "Growth",    pool: 750,  pct: 0.15, subs: [...] },
        { name: "Lifestyle", pool: 1250, pct: 0.25, subs: [...] },
        { name: "Savings",   pool: 500,  pct: 0.10, subs: [...] }
      ],
      txs: [                        // transactions
        {
          id: "1690000000000abc",   // Date.now() + Math.random()
          name: "Rent Payment",
          cat: "Essentials",        // denormalized category name
          sub: "Rent",              // denormalized subcategory name
          ci: 0,                    // category index (0-3)
          si: 0,                    // subcategory index
          amt: 1500,                // amount (positive number)
          date: "2026-08-01"        // ISO date string
        }
      ]
    }
  }
}
```

### Key Global Variables

| Variable | File | Purpose |
|---|---|---|
| `STATE` | state.js | Full app state (all months, active month) |
| `WEIGHTS` | income.js | `[50, 15, 25, 10]` — current category weight percentages |
| `BUDGET_PROFILES` | profiles.js | Array of 7 budget profile objects |
| `SUBCATEGORY_PRESETS` | subcategories.js | Preset subcategory names per category |
| `CURRENT_TAB` | navigation.js | Currently visible tab id |
| `currentUser` | supabase-client.js | Supabase user object (null if logged out) |
| `sb` | supabase-client.js | Supabase client instance |
| `EDIT_ID` | transactions.js | ID of transaction being edited in modal |

### User Flows

#### 1. Authentication
- On load, `auth.js` checks for existing Supabase session
- If no session → shows `#authScreen` (login/signup form)
- Login: email + password via `doLogin()` → `initApp(user)` → loads state, shows shell
- Signup: email + password + first name via `doSignup()` / `doSignupConfirm()`
- Passkey: biometric auth via `signInWithPasskey()`
- Logout: `doLogout()` → `sb.auth.signOut()` → reload

#### 2. Income Setup
1. User navigates to Income tab (`switchTab('income')`)
2. Enters per-check amount + selects pay frequency
3. `updateIncomePreview()` shows calculated monthly income
4. User selects a budget profile (chips) or adjusts weight sliders
5. Weights must total 100% before applying
6. `applyTargets()` → sets `income`, `perCheck`, `payFreq`, and each category's `pool` and `pct`
7. Redirects to Categories tab with a setup banner

#### 3. Category & Subcategory Setup
1. Categories tab shows 4 category cards with editable subcategories
2. Each category has a `pool` (total budget) — subcategory budgets must not exceed it
3. `setBudget(ci, si, val)` enforces income cap: sub-budgets can't exceed unallocated income
4. Quick-add chips offer preset subcategory names (e.g. "Rent", "Groceries")
5. Custom subcategories via text input + "Add" button
6. Delete subcategory with confirmation; transaction references are fixed

#### 4. Expense Entry
1. **Add Expense tab**: single-form UI (`aeSubmit()`) — name, category, subcategory, date, amount
2. **Row-based entry**: `addExpenseRow()` creates table rows; `saveAllExpenses()` batch-saves
3. On save: `sub.spent` is incremented, transaction is pushed to `d.txs`
4. Edit modal (`openEdit`/`saveEdit`): reverses old spent, applies new spent, updates transaction
5. Delete: `deleteTx(id)` reverses spent, removes from `d.txs`
6. CSV export: `exportData()` generates and downloads a CSV file

#### 5. Dashboard
1. **Stat cards**: Take-Home Income, Planned Budget, Spent So Far, Left to Spend
2. **Category cards**: Read-only view with progress bars per subcategory
3. **Recent transactions**: Sorted by date descending
4. **Month tabs**: Switch between months, create new months, delete months

### Design System

```css
:root {
  /* Backgrounds */
  --bg: #0f0f10;          /* Page background */
  --s1: #1c1c1e;          /* Surface 1 (sidebar) */
  --s2: #2c2c2e;          /* Surface 2 (cards) */
  --s3: #3a3a3c;          /* Surface 3 (inputs) */

  /* Text */
  --t1: #ffffff;          /* Primary text */
  --t2: #8E8E93;          /* Secondary text */
  --t3: rgba(255,255,255,.35);  /* Tertiary/muted */
  --t4: rgba(255,255,255,.5);   /* Quaternary */

  /* Lines/Borders */
  --ln: rgba(255,255,255,.05);
  --ln2: rgba(255,255,255,.10);
  --ln3: rgba(255,255,255,.18);

  /* Selection */
  --sel-bg: rgba(255,255,255,.08);
  --sel-text: #ffffff;

  /* Category Colors */
  --c-growth: #0A84FF;
  --c-lifestyle: #BF5AF2;
  --c-savings: #FFD60A;

  /* Radii */
  --r-sm: 10px; --r-md: 16px; --r-lg: 20px; --r-xl: 28px;

  /* Typography */
  --font: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
  --ease: cubic-bezier(.16,1,.3,1);
}
```

### Common Patterns

**Mutate → Persist → Render:**
```js
function someAction() {
  var d = activeData();
  // 1. Mutate STATE
  d.someField = newValue;
  // 2. Persist + re-render
  saveAndRender();
}
```

**Money formatting:**
```js
// Storage: always round to 2 decimals
var amount = Math.round(value * 100) / 100;

// Display: always use money()
el.textContent = money(amount);  // "$1,234.56"
```

**DOM access:**
```js
// Use $id() helper, not document.getElementById directly
var el = $id("someElement");
```

**Destructive actions:**
```js
if (!confirm("Delete this?")) return;
// ... perform deletion
saveAndRender();
```

### External Services

| Service | Config Location | Purpose |
|---|---|---|
| Supabase | `js/supabase-client.js` | Auth (email/passkey) + data persistence (`user_budgets` table) |
| OneSignal | `index.html` (script tag) + `OneSignalSDKWorker.js` | Push notifications for budget reminders |
| GitHub Pages | Repository settings | Hosting at `santiagojleons.github.io` |

### Anti-Patterns to Avoid

- ❌ Direct `document.getElementById` — use `$id()`
- ❌ Raw floating-point money math — always `Math.round(v * 100) / 100`
- ❌ Mutating `STATE` without calling `saveState()` or `saveAndRender()`
- ❌ Reading `STATE.months[key]` directly — use `activeData()`
- ❌ Creating new files without adding `<script>` tags in `index.html`
- ❌ Hardcoding colors/spacing — use CSS variables from `:root`
- ❌ ES modules (`import`/`export`) — all code shares global `window` scope
- ❌ Adding frameworks or build tools — this is zero-build vanilla JS
- ❌ Silent Supabase errors — always `console.error` + user feedback
- ❌ Destructive actions without `confirm()` guard