# base/ — fondasi POM modul baru

Dibangun sendiri mengikuti konvensi repo ini (rujukan: `TagPage.js`).
**Bukan** salinan dari repo `qa-cazh` — dari sana kita hanya mengambil informasi
*apa* yang ada di app, bukan *bagaimana* menulis test-nya.

## Isi

| File | Fungsi |
|---|---|
| `helpers.js` | Utilitas murni: `rx()`, `formItem()`, `makeUniq()`, `cellText()`, konstanta `DIALOG` |
| `BasePage.js` | Primitif semua halaman: timeouts, Radix scroll-lock, select, switch, toast, sidebar |
| `CrudListPage.js` | Modul "list + modal CRUD" — mewarisi `BasePage` |
| `SidebarModalPage.js` | Modul **tanpa halaman sendiri** — dialog dibuka dari sidebar. Termasuk upload file & time field React Aria |
| `TabbedPage.js` | Halaman bertab (Radix Tabs) + tabel per tab |

## Memilih base class

| Bentuk modul | Base | Contoh |
|---|---|---|
| List + modal Tambah/Edit/Hapus | `CrudListPage` | Kategori Inventaris, Tipe Pelanggaran, Jenis Tagihan |
| Item sidebar langsung membuka dialog (tanpa route) | `SidebarModalPage` | Legalitas Bukti Bayar, Waktu Perizinan |
| Halaman dengan tab | `TabbedPage` | Log Aktivasi Alumni, PPDB Pengaturan Web |
| Read-only / bentuk lain | `BasePage` | Dashboard, Pengaturan Aplikasi |

Kalau modulnya tidak pas di salah satu bentuk di atas, **jangan dipaksakan** —
itu justru yang bikin POM `PermissionTimePage` di repo qa-cazh `cy.visit` ke
halaman modul lain.

## Kenapa ada base-nya

`TagPage.js` panjangnya ~570 baris, dan sekitar 60% isinya pola yang **berulang
persis** di tiap POM: buka select Radix, tangani body scroll-lock, assertion toast,
assertion semua-baris, cek persistence. Selama ini tiap modul baru menyalin ulang
semuanya — termasuk menyalin ulang bug-nya.

Dengan base ini, POM modul baru cukup **mendeklarasikan config**. Efek yang paling
penting: kalau setelah element analysis ternyata ada selector yang salah, yang
diperbaiki **satu baris di config** — bukan menulis ulang ratusan baris.

## Cara pakai

```js
import CrudListPage from './base/CrudListPage';

class ModulBaruPage extends CrudListPage {
  constructor() {
    super({
      route: '/setting/xxx',
      modul: 'Modul Baru',
      addButtonText: 'Tambah Anu',
      titles: { add: 'Tambah Anu', edit: 'Edit Anu', delete: 'Hapus Anu' },
      emptyState: 'Data Anu tidak ditemukan',
      fields: {
        instansi: { type: 'select', label: 'Instansi' },
        nama:     { type: 'text',   label: 'Nama Anu', name: 'name' },
      },
      columns: { instansi: 0, nama: 1 },
      api: { list: '**/anu**', save: '**/anu**' },
    });
  }
}

export default new ModulBaruPage();
```

Di spec:

```js
Page.withTimeouts(data.timeouts)   // angka tetap satu sumber di fixture
    .visit()
    .openAddModal()
    .fillForm({ instansi: data.instansi.primary, nama })
    .saveExpectSuccess()
    .assertSuccessToast(data.messages.addSuccess)
    .assertPersisted(nama);
```

## Sikap yang disengaja berbeda dari repo qa-cazh

| Mereka | Kita | Alasan |
|---|---|---|
| `cy.wait(500..3000)` di mana-mana | `cy.intercept` + `cy.wait('@alias')`, atau assertion elemen | Deterministik, dan tidak melambat kalau BE cepat |
| OR-list selector 4–6 alternatif | Satu selector; kalau salah, diperbaiki | OR-list bikin kegagalan tidak terbaca |
| `.click({ force: true })` sebagai default | `.click()` biasa | `force` menyembunyikan overlay/disabled — itu bug yang harus ketahuan |
| `ensureDataExists()` bikin data dummy di tengah test | Data unik `QA<ts><seq>` + spec cleanup terpisah | Auto-create mencemari data & bikin assertion jumlah baris tidak deterministik |
| `saveForm()` klik Simpan **dua kali** kalau modal belum tutup | `save()` sekali; `assertNotSilent()` justru FAIL kalau FE diam | Klik ulang bisa bikin data ganda **dan** menutupi bug yang paling layak dilaporkan |
| Getter `()=>` tapi dipanggil dengan argumen | Getter menerima `opts` dan meneruskannya | Argumen yang dibuang diam-diam = rasa aman palsu |
| `switchTab(name)` mengabaikan `name`, selalu klik tab pertama | `switchTab()` pilih tab lewat teks **dan verifikasi** `data-state="active"` | Pindah tab yang tidak diverifikasi = test menguji tab yang salah |
| Modul tanpa halaman dipaksa punya `ROUTE` | `SidebarModalPage` dengan `anchorRoute` + `sidebarPath` | Memaksakan route menghasilkan `cy.visit` ke modul lain |

Detail temuannya ada di `docs/REFERENSI_ELEMEN.md` §5 dan sheet `qa-cazh` pada
`docs/Action_Items_QA.xlsx`.

## Status POM turunan

Semua POM modul baru saat ini berstatus **KERANGKA**: nilai config bertanda `(?)`
masih hipotesis. Urutan kerja per modul tetap mengikuti `CLAUDE.md`:

1. **PRD** → 2. **TC sheet** (STOP, tunggu ACC) → 3. **element analysis** dengan
HTML asli (STOP, tunggu ACC) → 4. kunci config + fixture → 5. tulis spec.

Jangan menulis spec di atas config yang masih `(?)`.
