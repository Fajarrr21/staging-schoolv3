# Referensi Elemen & Data App CAZH v3

Hasil ekstraksi dari repo QA tim lain (`qa-cazh`, dianalisis 13 Agustus 2026) + cross-check ke repo ini.
Tujuan: **jangan riset elemen/route yang sama dua kali.**

Data yang bisa langsung dipakai program ada di `cypress/fixtures/app.json`.
File ini isinya penjelasan + **audit** (bagian mana dari qa-cazh yang salah / tidak boleh ditiru).

> `qa-cazh` = `https://github.com/faleroid/qa-cazh`, Cypress 15, target app yang **sama** (`https://v3.cazh.id`),
> akun yang **sama** (`androidtesting117@gmail.com`). Jadi temuannya relevan — tapi tidak semuanya benar.

## Tingkat kepercayaan

| Label | Arti |
|---|---|
| ✅ **Verified** | sudah dipakai & jalan di repo ini |
| 🔵 **Cross-checked** | nilainya sama persis di repo ini dan di qa-cazh |
| 🟡 **Unverified** | baru dari qa-cazh, **belum** dicek ke DOM asli — konfirmasi dulu sebelum masuk spec |
| 🔴 **Konflik / salah** | qa-cazh sendiri tidak konsisten, atau terbukti keliru |

---

## 1. Peta modul & route

### 1.1 Pengaturan → Akademik ✅ 🔵

Semua sudah kita punya, dan qa-cazh memakai path identik — jadi penamaan route kita sudah benar.

| Modul | Route | Status kita |
|---|---|---|
| Tahun Ajaran | `/setting/academic/school-year` | sudah ada |
| Tingkat | `/setting/academic/school-level` | sudah ada |
| Jurusan | `/setting/academic/major` | sudah ada |
| Kelas | `/setting/academic/class` | sudah ada |
| Kamar | `/setting/academic/room` | sudah ada |
| Mapel | `/setting/academic/subject` | sudah ada |
| Tag | `/setting/academic/tag` | sudah ada |
| Kalender Akademik | `/setting/academic/academic-calendar` | sudah ada |
| Jadwal Pelajaran | `/setting/academic/course-schedule` | sudah ada |

### 1.2 Modul yang belum kita sentuh 🟡

| Modul | Route | Catatan |
|---|---|---|
| Kategori Inventaris | `/setting/inventory` | CRUD + filter instansi + sorting + page size |
| Tipe Pelanggaran | `/setting/student-affairs/violation-type` | field: Instansi, Nama, Min Poin, Max Poin, Status |
| Kategori Pengumuman | `/setting/administration/announcement-category` | **halaman** (bukan modal) untuk tambah/edit |
| Detail Instansi | `/setting/institution` | |
| Progres Kegiatan | `/student-affairs/progress` | |
| Perizinan | `/student-affairs/permission` | |
| Pelanggaran | `/student-affairs/violation`, `.../violation/create` | |
| Pengumuman | `/administration/announcement/list`, `.../list/create` | |
| Laporan Pembayaran | `/administration/billing/payment-report` | |
| Log Aktivasi Alumni | `/member/alumni/activation-log` | tab: Menunggu / Disetujui / Ditolak |
| Alumni Siswa / Guru | `/member/alumni/student`, `/member/alumni/teacher` | |
| PPDB Pengaturan Web | `/member/admission/setting` | 7 tab |
| Ganti PIN | `/profile?tab=pin` | field `old_pin`, `pin`, `confirm_pin` |
| Dashboard | `/dashboard` | `h1` = "Dashboard" |

### 1.3 Route yang KONFLIK — jangan dipakai dulu 🔴

| Modul | Nilai A | Nilai B | Masalah |
|---|---|---|---|
| Legalitas Bukti Bayar | `/setting/invoice/legality` (fixture) | `/setting/invoice/invoice-reminder` (POM) | Dua-duanya ada di repo mereka, saling bertentangan |
| Waktu Perizinan | `/setting/student-affairs/permission-time` | `/setting/student-affairs/permit-time` | Fixture menyimpan dua kandidat = tidak pernah dipastikan. POM-nya malah `cy.visit('.../violation-type')` — jelas copy-paste |

### 1.4 Modul "modal dari sidebar" 🟡

**Legalitas Bukti Bayar** dan **Pengaturan Perizinan** tidak punya halaman sendiri — item sidebar-nya
langsung membuka `[role="dialog"]` di atas halaman yang sedang aktif. Itu sebabnya route-nya kacau di
qa-cazh: mereka `visit` halaman lain dulu, baru klik sidebar.

Konsekuensi untuk kita: **jangan bikin konstanta `ROUTE`** untuk modul seperti ini; POM-nya harus
`openFromSidebar()`.

---

## 2. Master data akun & instansi

| Item | Nilai | Status |
|---|---|---|
| Akun utama | `androidtesting117@gmail.com` / `f7ki6b2u` | ✅ sama dengan yang kita pakai |
| Akun PIN lemah | `cazhv3@pgl.my.id` / `346z1pb5` | 🟡 memunculkan banner + popup "Perkuat Keamanan PIN Anda" |
| Instansi | `Sekolah Digital Indonesia`, `Academy QA Engineer`, `Academy Cazh` | 🔵 |
| Placeholder instansi | `Pilih Instansi` / `Select Institution` | 🔵 |

> ⚠️ Akun PIN lemah bikin dashboard punya modal nyangkut. Kalau dipakai untuk `cy.session` global,
> spec modul lain bisa gagal karena dialog menutupi. Pakai hanya di spec PIN.

---

## 3. Selector

### 3.1 Konfirmasi selector yang sudah kita pakai ✅ 🔵

`data-slot` yang muncul di **dua** repo, jadi aman: `dialog-content`, `dialog-title`, `dialog-footer`,
`dialog-close`, `dialog-trigger`, `form-item`, `form-label`, `form-control`, `form-message`,
`select-trigger`, `select-content`, `select-item`, `select-value`, `badge`, `button`, `input`,
`data-grid-table`, `data-grid-pagination`, `dropdown-menu-trigger`, `dropdown-menu-content`,
`alert`, `alert-title`, `alert-description`, `card-header`, `page-title`.

Ikon: `lucide-square-pen` (edit), `lucide-trash` (hapus), `lucide-x` (tutup), `lucide-chevrons-up-down` (sort).

### 3.2 Selector baru yang belum kita punya 🟡

| Selector | Dipakai untuk |
|---|---|
| `[data-slot="card"]`, `card-title`, `card-description` | kartu metrik & section dashboard |
| `[data-slot="popover-trigger"]` / `popover-content` | date picker & combobox besar (dominan di modul Subhan/PGT-14) |
| `[data-slot="accordion-menu-item"]` / `accordion-menu-title` | **item sidebar** — ini yang selama ini kita hindari karena tidak tahu selectornya |
| `[data-slot="datefield"]` + `[data-type="hour"]` / `[data-type="minute"]` | input jam React Aria (bukan `input[type=time]`) |
| `button[role="switch"]` + `data-state="checked"` | toggle aktif/nonaktif |
| `[data-slot="dialog-description"]` | teks konfirmasi di modal hapus |
| `[data-radix-scroll-area-viewport]` | list scrollable di dashboard |
| `svg.recharts-surface`, `g.recharts-xAxis`, `path.recharts-rectangle` | grafik (recharts) |
| `[data-slot="info-note"]`, `[data-slot="alert-icon"]`, `[data-slot="tooltip-trigger"]` | 1× pakai, paling lemah |
| `svg.lucide-calendar-days` | tombol buka date picker |
| `svg.lucide-shield-alert` | ikon banner PIN lemah |

### 3.3 Selector yang JANGAN ditiru 🔴

`[data-slot="error"]`, `[data-slot="toast"]`, `[data-slot="dialog"]`, `.toast`, `[class*="toast"]`,
`p.text-red-500`.

Alasan: di qa-cazh keenamnya **tidak pernah berdiri sendiri** — selalu jadi ekor OR-list panjang
(`cy.get('.toast, [role="status"], [class*="toast"], [data-slot="toast"], [data-sonner-toast]')`).
Itu ciri selector tebakan yang tidak pernah dibuktikan; yang benar-benar match kemungkinan cuma
`[data-sonner-toast]` (yang memang kita pakai) dan `[data-slot="form-message"]`.

### 3.4 Date picker — punya kita lebih benar ✅

| | Selector |
|---|---|
| qa-cazh | `button[aria-label*="July 17"]` |
| repo ini | `td[data-day="2025-07-17"] button` |

`aria-label` memakai **nama bulan Inggris** walaupun UI berbahasa Indonesia. Selain rapuh terhadap
pergantian bahasa, `*=` juga bisa nyangkut ke tanggal lain. `td[data-day]` itu ISO dan exact —
tetap pakai punya kita.

---

## 4. Teks UI yang sudah terkonfirmasi

### 4.1 Empty state 🔵

Pola: **`Data {Modul} tidak ditemukan`** — "Data Tahun Ajaran tidak ditemukan", "Data Tingkat
tidak ditemukan", "Data Kelas tidak ditemukan", "Data Kamar tidak ditemukan", "Data Tipe
Pelanggaran tidak ditemukan".

Pengecualian yang mereka catat: Kategori Pengumuman → `Kategori tidak ditemukan.` (ada titik).

### 4.2 Halaman login (ID / EN) 🟡

| | Indonesia | English |
|---|---|---|
| Judul | `Masuk ke akun anda !` | `Log in to your account!` |
| Deskripsi | `Isikan alamat email dan password...` | `Please enter your email and password...` |
| Tombol utama | `Masuk` | `Login` |
| Lupa password | `Lupa Password` | `Forgot Password` |
| Google | `Masuk dengan google` | `Login using google` |
| Kartu anggota | `Cek Kartu Anggota` | `Check Membership Card` |
| Switcher bahasa | teks `Bahasa` → opsi `Indonesia` | teks `Language` → opsi `English` |

Sudah ditambahkan ke `cypress/fixtures/login.json` di blok `localization`.

### 4.3 Pesan validasi per modul (belum kita pakai) 🟡

**Kategori Pengumuman**
- `Nama kategori harus diisi.`
- `Nama kategori minimal 2 karakter.`
- `Nama kategori maksimal 100 karakter.`
- `Nama kategori hanya boleh berisi huruf, angka, spasi, dan karakter - _ & .`
- `Nama kategori sudah digunakan.`
- `Gagal menyimpan kategori. Silakan coba lagi.`
- `Kategori tidak dapat dihapus karena masih digunakan oleh pengumuman lain.`
- Toast: `Kategori berhasil ditambahkan` / `... diperbarui` / `... dihapus`

**Kategori Inventaris**
- `Instansi wajib diisi`, `Nama kategori inventaris wajib diisi`
- Placeholder nama: `Contoh: Meja atau Kursi` / `Example: Table or Chair`

**Tipe Pelanggaran**
- `Instansi wajib diisi`, `Tipe pelanggaran wajib diisi`, `Poin minimum wajib diisi`,
  `Poin maksimum wajib diisi`, `Range poin wajib diisi`, `Status wajib diisi`
- Batas: max poin ≤ 999, min < max, range tidak boleh bertumpuk, nama max 100 karakter

**Legalitas Bukti Bayar**
- `Pengesahan wajib diisi`, `Jabatan wajib diisi`, `Nama Terang wajib diisi`
- `File melebihi ukuran maksimal 2MB`, `bukan tipe file yang diterima`
- Info: `Pastikan tanda tangan memiliki background transparan/putih`
- Upload: PNG/JPG/JPEG < 2MB

**Waktu Perizinan**
- Helper OFF: `Jika diaktifkan, pengajuan perizinan untuk hari yang sama hanya dapat dilakukan sebelum batas waktu yang ditentukan.`
- Helper ON: `Contoh: Jika diatur pada pukul 07.00, maka pengajuan perizinan untuk hari yang sama hanya dapat dilakukan sebelum pukul tersebut.`

> ⚠️ Semua teks di 4.3 **belum** kita verifikasi ke UI. Kalau nanti garap modulnya, tetap minta
> screenshot/HTML dulu — anggap ini kandidat, bukan fakta.

---

## 5. Audit qa-cazh — yang TIDAK boleh ditiru

Ditulis supaya kalau nanti ada yang bilang "kan di repo sebelah begitu", jawabannya sudah ada.

### 5.1 Bug nyata di kode mereka

| # | Lokasi | Masalah |
|---|---|---|
| 1 | `ViolationTypePage.js:217,252,327`, `InventoryCategoryPage.js:151` | `this.elements.formModal({ timeout: 15000 })` — getter-nya `() => cy.get(...)`, **tidak menerima argumen**. Timeout-nya dibuang diam-diam; yang berlaku tetap timeout default. |
| 2 | `ViolationTypePage.js:34` | `deleteModal` = `[role="dialog"]:contains("Hapus")` — modal form pun cocok kalau memuat kata "Hapus", lalu `deleteConfirmBtn` mengambil tombol pertama yang berbunyi /hapus/. Bisa mengklik tombol yang salah. |
| 3 | `AnnouncementCategoryPage.js:31` | `deleteModal` = `[role="dialog"]` polos — **identik** dengan `formModal`. Tidak ada cara membedakan modal hapus dan modal form. |
| 4 | `ViolationTypePage.js:27-28` | Min poin = `input[type="number"]).first()`, Max = `.last()`. Kalau field number-nya cuma satu (atau tiga), keduanya menunjuk elemen yang sama tanpa error. |
| 5 | `InventoryCategoryPage.js:22` | `input[data-slot="input"], input:not([type="hidden"]), ...` lalu `.last()` — posisional, ikut berubah kalau urutan field digeser. |
| 6 | semua POM | `pageSizeDropdown` = `[role="combobox"]` di-filter `:contains("10")` — kena juga combobox lain yang kebetulan memuat "10" (mis. tahun ajaran, nama instansi). |
| 7 | `commands.js:32-35` | `cy.session` `validate()` cuma memastikan body **tidak** memuat "Peran Belum Ditetapkan". Halaman login juga tidak memuat teks itu → sesi kedaluwarsa dianggap valid. |
| 8 | `support/e2e.js:4-6` | `beforeEach(() => cy.login())` **global** — termasuk untuk spec yang mengetes halaman login itu sendiri (`input-email.cy.js`). Login sudah aktif saat mau menguji login. |
| 9 | `InventoryCategoryPage.js:41` vs `inventoryCategoryData.json` | POM cari `/data inventaris tidak ditemukan/`, fixture-nya bilang `Tidak ada data yang ditemukan`. Salah satu pasti tidak pernah match. |
| 10 | `violationTypeData.json` | Nilai seperti `"sudah digunakan\|sudah ada"` dan `"Batas 100 karakter tercapai\|maksimal 100"` — regex alternation disimpan sebagai **string biasa**. Kalau dipakai lewat `contains()` apa adanya, tidak akan pernah cocok. |
| 11 | `jurusan.cy.js:1` | `describe('The School Year Page')` padahal isinya modul Jurusan. |
| 12 | `README.md` | Masih ada penanda konflik git `<<<<<<< HEAD` / `=======` yang belum di-resolve. Contoh perintah di dalamnya juga menunjuk path lama (`cypress/e2e/PGT-16_...`, padahal file ada di `cypress/e2e/PGT/`). |
| 13 | `.env` | Berisi `PASSWORD_EMAIL` asli, ikut ter-commit, **dan** `cypress.config.js` tidak pernah membacanya (tidak ada dotenv). File mati yang isinya cuma bocoran kredensial. |
| 14 | `cypress.config.js:7` | `allowCypressEnv: false` bukan opsi Cypress yang valid — tidak berefek apa-apa. |
| 15 | `package.json` | Script `test` masih stub bawaan npm (`echo "Error: no test specified" && exit 1`). |

### 5.2 Praktik yang bertentangan dengan aturan repo ini

| Praktik mereka | Kenapa kita tolak |
|---|---|
| `cy.wait(<angka>)` di mana-mana (500–3000 ms, ratusan kali) | Melanggar aturan anti-flaky kita. Pakai `cy.intercept` + `cy.wait('@alias')`. |
| `afterEach(() => cy.wait(3000))` di spec akademik | Murni buang waktu — 5 spec × ~50 test × 3 dtk ≈ 12 menit per run. |
| `.click({ force: true })` sebagai default | Menyembunyikan bug overlay/disabled. Kita pakai native `.click()` biasa. |
| OR-list selector 4–6 alternatif | Kalau satu selector benar, sisanya cuma noise yang bikin kegagalan tidak terbaca. Minta HTML, pilih satu. |
| `ViolationTypePage.saveForm()` mengklik **Simpan dua kali** kalau modal masih terbuka | Ini paling berbahaya: bisa membuat data ganda, **dan** menutupi bug "FE silent". Aturan kita justru kebalikannya — `assertNotSilent()` harus FAIL kalau FE diam. |
| `ensureDataExists()` bikin data dummy di tengah test | Mencemari data & bikin assertion jumlah baris tidak deterministik. Kita pakai data unik `QA<ts><seq>` + spec cleanup terpisah. |
| `Cypress.on('uncaught:exception', () => false)` global | Sama seperti punya kita — tapi mereka juga menelan `ResizeObserver` dsb. tanpa filter. Perlu dipersempit kalau kita mau menangkap error app asli. |
| Penamaan `cypress/e2e/Subhan/...` (nama orang) | Struktur folder ikut orang, bukan modul — tidak terbaca dari luar. |

### 5.3 Yang justru layak ditiru

- **`cy.session` + `validate()`** — idenya benar (validasi-nya saja yang salah). Punya kita
  belum pakai `validate()` sama sekali; menambahkannya (cek URL, bukan cek teks) akan menghindari
  spec jalan dengan sesi mati.
- **Fixture berisi teks UI lengkap ID + EN** — kita baru menyimpan versi ID. Kalau app benar
  bilingual, spec kita akan pecah begitu bahasa diganti.
- **`cypress.config.js` task `readExcel` / `findDownloadedFile` / `deleteDownloads`** — pola yang
  rapi untuk menguji fitur **Export/Download** (mereka pakai `xlsx`). Kita belum punya, dan modul
  kita banyak yang punya tombol export.
- **Penomoran TC per modul** (`PGT-1` Tahun Ajaran, `PGT-2` Jurusan, `PGT-3` Tingkat, `PGT-4` Kelas,
  `PGT-5` Kamar, `PGT-16` Legalitas, `PGT-17` Kategori Inventaris, `PGT-18` Tipe Pelanggaran,
  `PGT-19` Waktu Perizinan, `PGT-20` Kategori Pengumuman, `DSH-1` Dashboard, `KSW-1` Progres Kegiatan)
  — ini tampaknya penomoran modul resmi tim. Berguna kalau nanti laporan kita harus nyambung dengan punya mereka.

---

## 6. Cara pakai

1. Modul baru → buka `cypress/fixtures/app.json`, ambil route + selector + teks kandidat dari sini.
2. Yang berlabel 🟡 **tetap lewat checkpoint element analysis**: minta HTML asli ke user dulu,
   baru dikunci ke fixture modul.
3. Kalau sebuah nilai 🟡 sudah terbukti benar, pindahkan ke blok `verified` di `app.json` dan
   naikkan labelnya di sini.
4. Kalau ternyata salah, hapus — jangan dibiarkan jadi jebakan buat sesi berikutnya.
