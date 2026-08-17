# -*- coding: utf-8 -*-
"""
Generate spec KERANGKA untuk modul-modul yang POM + fixture-nya sudah ada
tapi belum lewat element analysis.

Sekali jalan, hasilnya file .cy.js yang berdiri sendiri (bukan generator runtime).
Setelah dijalankan, file spec-nya diedit langsung — script ini tidak dipakai lagi
kecuali mau bikin ulang dari nol.

    python scripts/_gen_spec_kerangka.py
"""
import pathlib

BASE = pathlib.Path("cypress/e2e/stagingv3/Pengaturan")

# (folder, fixture, POM file, POM var, label, kode, nilai fillForm, kolom nama)
SPECS = {
    "kategori inventaris": ("Pengaturan Inventaris", "kategori_inventaris",
        "KategoriInventarisPage", "KategoriInventaris", "Kategori Inventaris", "KIN",
        "{ instansi: d.instansi.primary, nama }", "nama"),
    "tipe pelanggaran": ("Pengaturan Kesiswaan", "tipe_pelanggaran",
        "TipePelanggaranPage", "TipePelanggaran", "Tipe Pelanggaran", "TPL",
        "{ instansi: d.instansi.primary, nama, minPoin: 5, maxPoin: 15 }", "nama"),
    "kategori pengumuman": ("Pengaturan Administrasi", "kategori_pengumuman",
        "KategoriPengumumanPage", "KategoriPengumuman", "Kategori Pengumuman", "KPU",
        "{ nama }", "nama"),
    "jenis guru": ("Pengaturan Kepegawaian", "jenis_guru",
        "JenisGuruPage", "JenisGuru", "Jenis Guru", "JGR",
        "{ instansi: d.instansi.primary, nama }", "nama"),
    "jenis staff": ("Pengaturan Kepegawaian", "jenis_staff",
        "JenisStaffPage", "JenisStaff", "Jenis Staff", "JST",
        "{ instansi: d.instansi.primary, nama }", "nama"),
    "jenis tagihan": ("Pengaturan Tagihan", "jenis_tagihan",
        "JenisTagihanPage", "JenisTagihan", "Jenis Tagihan", "JTG",
        "{ instansi: d.instansi.primary, nama }", "nama"),
    "pengingat tagihan": ("Pengaturan Tagihan", "pengingat_tagihan",
        "PengingatTagihanPage", "PengingatTagihan", "Pengingat Tagihan", "PTG",
        "{ instansi: d.instansi.primary, judul: nama }", "judul"),
}

HEADER = """// Spec {label} — {kode}
// POM: cypress/support/pageobjects/{pom}.js
// Fixture: cypress/fixtures/{fx}.json
//
// =========================================================================
// STATUS: BELUM TERVERIFIKASI — baca ini dulu.
// =========================================================================
// Config POM & fixture masih berisi nilai hipotesis bertanda (?) / TODO
// (sumber: repo qa-cazh, app-nya sama, tapi belum kita buktikan sendiri).
//
// RUN PERTAMA = ALAT VERIFIKASI, bukan laporan cakupan.
//   1) Lihat blok "S-00 — Kontrak config" duluan. Blok itu memverifikasi
//      asumsi paling dasar: route benar, tabel ada, tombol Tambah ada,
//      dan field yang dideklarasikan di config memang ada di form.
//   2) Kalau S-00 merah, SEMUA blok di bawahnya tidak ada artinya —
//      perbaiki config POM dulu, jangan menilai hasilnya.
//   3) Setelah S-00 hijau, kegagalan di blok lain baru bermakna dan bisa
//      langsung dipakai sebagai hasil element analysis.
//
// JANGAN dilaporkan sebagai cakupan resmi sebelum urutan CLAUDE.md dijalani:
// PRD -> TC sheet (ACC) -> element analysis (ACC) -> naikkan nilai (?) -> spec final.
//
// Assertion pesan validasi sengaja memakai assertNotSilent(), BUKAN teks
// tertentu: teks pesannya belum terverifikasi, jadi yang di-assert adalah
// kewajiban minimum app — tidak boleh diam.

import {pomvar} from '../../../../support/pageobjects/{pom}';
import LoginPage from '../../../../support/pageobjects/LoginPage';
import {{ makeUniq }} from '../../../../support/pageobjects/base/helpers';

describe('{label} — {kode}', () => {{
  let d;
  let uniq;

  before(() => {{
    cy.fixture('{fx}').then((data) => {{
      d = data;
      uniq = makeUniq(d.testData.prefix);
    }});
  }});

  beforeEach(() => {{
    LoginPage.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    {pomvar}.withTimeouts(d.timeouts);
  }});
"""

KONTRAK = """
  // ==========================================================================
  // S-00 — Kontrak config. Kalau blok ini merah, jangan lanjut menilai blok lain.
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {{
    it('TC-{kode}-001 | Happy | Halaman list bisa dibuka & tabel tampil', () => {{
      {pomvar}.visit();
      cy.url().should('include', {pomvar}.cfg.route);
      {pomvar}.elements.table().should('be.visible');
    }});

    it('TC-{kode}-002 | Happy | Tombol Tambah ada & membuka form', () => {{
      {pomvar}.visit().openAddModal();
      {pomvar}.assertDialogOpen();
    }});

    it('TC-{kode}-003 | Happy | Semua field di config benar-benar ada di form', () => {{
      {pomvar}.visit().openAddModal();
      Object.keys({pomvar}.cfg.fields).forEach((key) => {{
        {pomvar}.elements.fieldItem(key).should('exist');
      }});
    }});
  }});
"""

TAMBAH = """
  // ==========================================================================
  // S-01 — Tambah
  // ==========================================================================
  describe('S-01 — Tambah', () => {{
    it('TC-{kode}-010 | Happy | Tambah data valid -> muncul di list', () => {{
      const nama = uniq();
      {pomvar}.visit().openAddModal().fillForm({isi}).saveExpectSuccess();
      {pomvar}.assertRowExists(nama);
    }});

    it('TC-{kode}-011 | Happy | Data persist setelah reload halaman', () => {{
      const nama = uniq();
      {pomvar}.visit().openAddModal().fillForm({isi}).saveExpectSuccess();
      {pomvar}.assertPersisted(nama);
    }});

    it('TC-{kode}-012 | Positif | Batal menutup form tanpa menyimpan', () => {{
      const nama = uniq();
      {pomvar}.visit().openAddModal().fillForm({isi}).cancel();
      {pomvar}.assertDialogClosed().assertRowNotExists(nama);
    }});
  }});
"""

VALIDASI = """
  // ==========================================================================
  // S-02 — Validasi
  // ==========================================================================
  describe('S-02 — Validasi', () => {{
    it('TC-{kode}-020 | Negatif | Simpan form kosong -> FE tidak boleh diam', () => {{
      {pomvar}.visit().openAddModal().save();
      {pomvar}.assertNotSilent();
    }});

    it('TC-{kode}-021 | Negatif | Simpan form kosong -> dialog tetap terbuka', () => {{
      {pomvar}.visit().openAddModal().save();
      {pomvar}.assertDialogOpen();
    }});
  }});
"""

LIST = """
  // ==========================================================================
  // S-03 — List
  // ==========================================================================
  describe('S-03 — List', () => {{
    it('TC-{kode}-030 | Happy | Data terbaru muncul di baris teratas', () => {{
      const nama = uniq();
      {pomvar}.visit().openAddModal().fillForm({isi}).saveExpectSuccess();
      {pomvar}.visit().assertFirstRowCell('{kolom}', nama);
    }});

    it('TC-{kode}-031 | Positif | Search menemukan data yang baru dibuat', () => {{
      const nama = uniq();
      {pomvar}.visit().openAddModal().fillForm({isi}).saveExpectSuccess();
      {pomvar}.visit().search(nama).assertRowExists(nama);
    }});

    it('TC-{kode}-032 | Negatif | Search tanpa hasil -> empty state', () => {{
      {pomvar}.visit().search('ZZZQA000TIDAKADA');
      {pomvar}.assertEmptyState();
    }});
  }});
"""

EDIT = """
  // ==========================================================================
  // S-04 — Edit
  // ==========================================================================
  describe('S-04 — Edit', () => {{
    it('TC-{kode}-040 | Happy | Form edit ter-prefill sesuai baris', () => {{
      const nama = uniq();
      {pomvar}.visit().openAddModal().fillForm({isi}).saveExpectSuccess();
      {pomvar}.visit().search(nama).openEditByText(nama);
      {pomvar}.assertFormPrefilled({{ {kolom}: nama }});
    }});

    it('TC-{kode}-041 | Happy | Perubahan tersimpan & persist', () => {{
      const nama = uniq();
      const namaBaru = uniq();
      {pomvar}.visit().openAddModal().fillForm({isi}).saveExpectSuccess();
      {pomvar}.visit().search(nama).openEditByText(nama)
        .fill('{kolom}', namaBaru).saveExpectSuccess();
      {pomvar}.assertPersisted(namaBaru);
    }});
  }});
"""

HAPUS = """
  // ==========================================================================
  // S-05 — Hapus
  // ==========================================================================
  describe('S-05 — Hapus', () => {{
    it('TC-{kode}-050 | Positif | Dialog konfirmasi muncul sebelum menghapus', () => {{
      const nama = uniq();
      {pomvar}.visit().openAddModal().fillForm({isi}).saveExpectSuccess();
      {pomvar}.visit().search(nama).openDeleteByText(nama);
      {pomvar}.assertDialogOpen();
    }});

    it('TC-{kode}-051 | Happy | Hapus data -> hilang dari list & tidak persist', () => {{
      const nama = uniq();
      {pomvar}.visit().openAddModal().fillForm({isi}).saveExpectSuccess();
      {pomvar}.visit().search(nama).deleteByText(nama);
      {pomvar}.assertNotPersisted(nama);
    }});
  }});
"""

written = []
for key, (folder, fx, pom, pomvar, label, kode, isi, kolom) in SPECS.items():
    ctx = dict(label=label, kode=kode, pom=pom, pomvar=pomvar, fx=fx, isi=isi, kolom=kolom)
    body = HEADER.format(**ctx)
    for blok in (KONTRAK, TAMBAH, VALIDASI, LIST, EDIT, HAPUS):
        body += blok.format(**ctx)
    body += "});\n"

    folder_path = BASE / folder / key
    folder_path.mkdir(parents=True, exist_ok=True)
    f = folder_path / f"{key.replace(' ', '')}.cy.js"
    f.write_text(body, encoding="utf-8")
    written.append((f, body.count("  it(")))

for f, n in written:
    print(f"OK -> {f.as_posix()}  ({n} TC)")
print(f"\n{len(written)} spec, total {sum(n for _, n in written)} TC")
