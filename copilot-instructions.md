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
