# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Cypress E2E test suite for the CARDS School staging app (`https://staging-new-school.cazh.id`). Tests, folder names, and test descriptions are written in **Bahasa Indonesia** — match that language when adding tests.

## Commands

- Only the `cypress/e2e/stagingv3/**/*.cy.{js,ts}` folder is scanned (see `specPattern` in `cypress.config.js`). The `1-getting-started` and `2-advanced-examples` folders are ignored.
- `npm run cy:open` — interactive runner. `npm run cy:run` — headless.
- `npm test` — full pipeline: clean reports → run all → build mochawesome HTML report (in `cypress/reports/`).
- Run one module via the dedicated scripts, e.g. `npm run test:mapel`, or a single spec: `npx cypress run --spec "cypress/e2e/stagingv3/pengaturan mapel/tambahmapel.cy.js"`.
- `retries: 0` in both run and open modes — a flaky failure is a real failure, do not assume re-running fixes it.

## Git

- **Commit only when explicitly asked.** Do not commit or branch on your own.

## Workflow

- **PRD-first**: never invent a PRD or requirement. If one doesn't exist yet, ask first.
- **Order per module**: Test Case sheet (xlsx) → element analysis (ask for the real HTML, don't assume selectors) → code (POM + spec + fixture).
- **Sub-order within a module**: Tambah → List → Edit → Hapus → cleanup utility (`zzz_cleanup_*`).
- **Generate first, don't run Cypress** — ask before executing.
- Run `node --check <file>` on each JS file before considering it done.
  - **False alarm to ignore**: on ESM files (those using `import`), `node --check` throws `Cannot use import statement outside a module` because `package.json` is `type: commonjs` — Cypress does the bundling, so this specific error is expected. Ignore it; just confirm there's no *other* syntax error. The real validation is Cypress compiling/running the spec.

## Test conventions

- **Page Object Model**: each page is a class exported as a singleton (`export default new JurusanPage()`) under `cypress/support/pageobjects/`. Element getters live in an `elements` object; methods are chainable (`return this`). Add behavior to the relevant page object rather than inlining selectors in specs.
- **Selectors** target the app's Radix UI / shadcn markup: prefer `data-slot` attributes (`[data-slot="dialog-content"]`, `[data-slot="select-trigger"]`), label-scoped form items, row-by-text (`cy.contains('table tbody tr', name)`), and lucide icon classes (`svg.lucide-square-pen`). Toasts are Sonner: `[data-sonner-toast][data-type="success"]`.
- **Use native `.click()`** — do not use `cypress-real-events`. We tried it but it caused CDP errors (`Page.bringToFront` / CRI reset), so we reverted to native events.
- **Avoid flaky waits**: to handle re-renders after search/filter, use `cy.intercept` + `cy.wait('@alias')` (deterministic). **Do not** use `cy.wait(<number>)`.
- **Fixtures drive everything**: URLs, credentials, labels, messages, test data, viewports, and timeouts all come from `cypress/fixtures/*.json` — don't hardcode them in specs. Generate unique names for rerun safety (existing specs use a short random suffix).
- **Test data is rerun-safe**: `QA<6-digit-timestamp><seq>` (e.g. `QA48211203`).
- **`formItem(label)` helper** scopes a field via `[data-slot="form-label"]` within a dialog; **`rx()`** builds an exact-match regex for Radix options (avoids substring collisions like `"Aktif"` vs `"Tidak Aktif"`).
- **Row action buttons** are `data-slot="dialog-trigger"`, distinguished by icon: edit `svg.lucide-square-pen`, delete `svg.lucide-trash`, then `.closest('button')`.
- **Multi-row assertions**: use `.should(callback)` + synchronous `Cypress.$` — do **not** use `.each()` + `cy.wrap()` (causes detached DOM).
- **Naming**: nested `describe` blocks per scenario group; `it` titles are `TC-### : <deskripsi Bahasa Indonesia>`.
- **Persistence**: verify backend persistence by reloading the page (`assertPersisted`-style), not just the optimistic UI update.
- **Auth**: reuse login via `cy.session` (`LoginPage.loginViaSession(...)`); `beforeEach` clears cookies/localStorage for isolation.

## Test case sheet (xlsx)

- Columns: `ID | Kategori | Skenario | Pre-condition | Langkah | Test Data | Expected | Sumber | Status | Catatan`.
- `Kategori`: Happy / Positif / Negatif / Edge. **No** security/injection cases.
- `Sumber`: PRD / PRD-ambigu / Asumsi.
- Flag bugs inline: `Status` = FAIL + `BUG-###` reference in `Catatan`.

## Known bugs

Fixtures track known bugs as `bug: { ... }` with `BUG-###` ids. When writing tests for these, **assert the correct expected behavior** so the test fails until the bug is fixed (do not lock in the buggy behavior).

## Bug tracker

Sumber kebenaran bug = `bugs.csv` (teks, di-commit ke git). File `Bug_Tracker_QA_CARDS.xlsx` adalah **artifact hasil generate** — jangan pernah diedit manual.

**Saat menambah bug:**
- Append baris ke `bugs.csv` saja, lalu jalankan `python scripts/build_bug_tracker.py` untuk regenerate xlsx.
- Atau pakai slash command `/bug <deskripsi temuan>`.
- Bug ID berurutan, zero-padded 3 digit (`BUG-001`, `BUG-015`, ...).
- Kolom (urutan tetap): `Bug ID, Module, Title, Steps to Reproduce, Expected Result, Actual Result, Severity, Priority, Reporter, Status, Date Found`.
- Severity: `High` (integritas data/blocker/security) · `Medium` (fungsional salah, ada proteksi/workaround) · `Low` (kosmetik/layout).
- Steps bernomor, mulai `1. Login sebagai admin`; bila terkait API sertakan langkah cek Network (XHR) + response body.
- Reporter default `Fajar Ardiansyah`, Status default `Open`, Date Found format `DD Bulan YYYY` (ID).

**Jangan** commit ulang xlsx tiap perubahan kecil — cukup commit `bugs.csv`. Generate xlsx hanya saat mau setor laporan.