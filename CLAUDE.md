# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Cypress E2E test suite for the CARDS School **production** app (`https://v3.cazh.id`). Tests, folder names, and test descriptions are written in **Bahasa Indonesia** — match that language when adding tests.

> ⚠️ **TARGET = PRODUCTION.** `https://v3.cazh.id` adalah sistem **live**. Nama repo/folder (`schoolv3-automation`, `cypress/e2e/stagingv3/`) dan istilah "staging" di dokumen ini adalah **legacy** — jangan menyimpulkan staging dari nama itu.
> - Spec CRUD (Tambah/Edit/Hapus) **membuat & menghapus data produksi nyata** (mis. `proxy-banking/bill-types`). Perlakukan menjalankan spec sebagai aksi yang mengubah data prod.
> - **Jangan run spec tanpa diminta** — user yang menjalankan.
> - **Cleanup wajib** setelah run CRUD: `cypress/e2e/stagingv3/cleanup/cleanup<modul>.cy.js`. Harus **column-scoped ke kolom Nama + `startsWith("QA")`** — JANGAN pakai `purgeByPrefix` base yang match `includes` seluruh baris (bisa kena data prod asli).

### Environment (production & staging dalam SATU repo)

- **URL per-env**: `cypress/config/environments.js` (aman di-commit). **Kredensial per-env**: `cypress.env.json` di key `creds.<env>` — **RAHASIA, git-ignored, JANGAN commit** (template: `cypress.env.example.json`). `cypress.config.js` menggabungkan keduanya → override `baseUrl` + taruh ke `Cypress.env`; `LoginPage.loginViaSession` memakainya. Jadi **tidak ada spec/fixture yang perlu diedit** saat pindah env.
- ⚠️ **Environment WAJIB dipilih eksplisit — TIDAK ADA default.** Run tanpa flag `environment` akan **dibatalkan** (pengaman anti tidak sengaja menyentuh production live). Ini disengaja; jangan "perbaiki" dengan memberi default.
  - `npm run cy:<modul> -- --env environment=production` (prod live)
  - `npm run cy:<modul> -- --env environment=staging` (staging)
  - Atau script langsung: `cy:prod` / `cy:staging` / `open:prod` / `open:staging`.
- Sesi login di-namespace per-env (`session-<env>-<email>`) — sesi prod & staging tidak saling menimpa.

## App reference (baca duluan sebelum modul baru)

- `cypress/fixtures/app.json` — master data level-app: route map, daftar instansi, akun, selector `data-slot`, pola empty state / date picker / time field / switch. Setiap nilai punya label `verified` / `crosschecked` / `unverified`.
- `docs/REFERENSI_ELEMEN.md` — penjelasan + **audit** repo QA tim lain (`qa-cazh`, app yang sama): mana selector yang terbukti, mana yang tebakan, dan praktik mereka yang sengaja tidak kita tiru.
- `docs/Peta_Fitur_qa-cazh.xlsx` — peta 20 modul app + aset yang tersedia per modul, buat memilih modul berikutnya. Kolom `Siap`: **A** = ada POM + fixture + judul TC · **B** = judul TC lengkap tapi elemen mentah · **C** = sudah kita punya. Generator: `scripts/build_feature_map.py`.
- `docs/Action_Items_QA.xlsx` — daftar perbaikan repo ini (sheet `Repo Ini`) + temuan di repo mereka (sheet `qa-cazh`). Generator: `scripts/build_action_items.py`.
- Nilai berlabel `unverified` **tetap** harus lewat checkpoint element analysis (minta HTML asli) sebelum dikunci ke fixture modul. Kalau terbukti benar, naikkan ke `verified`; kalau salah, hapus.

## Commands

- Only the `cypress/e2e/stagingv3/**/*.cy.{js,ts}` folder is scanned (see `specPattern` in `cypress.config.js`). The `1-getting-started` and `2-advanced-examples` folders are ignored.
- `npm run cy:open` — interactive runner. `npm run cy:run` — headless.
- `npm test` — full pipeline: clean reports → run all → build mochawesome HTML report (in `cypress/reports/`).
- Run one module via the dedicated scripts, e.g. `npm run test:mapel`, or a single spec: `npx cypress run --spec "cypress/e2e/stagingv3/Pengaturan/Pengaturan Akademik/pengaturan mapel/tambahmapel.cy.js"`.
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
- **Modul baru pakai `base/CrudListPage`** (`cypress/support/pageobjects/base/`, lihat README di sana). POM turunan cukup mendeklarasikan config — route, teks tombol, judul dialog, `fields`, `columns`, `api` — sisanya diwarisi. Kalau ada selector yang meleset, yang diperbaiki satu baris config, bukan ratusan baris POM. POM lama (Tag/Jurusan/Kamar/…) **tidak** di-refactor ke base ini supaya run yang sudah jalan tidak terganggu.
- POM turunan yang masih berstatus **KERANGKA** menandai nilai hipotesis dengan `(?)`. Jangan menulis spec di atas config yang masih `(?)` — lewati checkpoint element analysis dulu.
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