// JenisTagihanPage.js — POM modul Jenis Tagihan
// Menu: PENGATURAN > Tagihan > Jenis Tagihan
//
// ⚠️ STATUS: KERANGKA, hipotesis tinggi.
// qa-cazh TIDAK punya POM maupun fixture untuk modul ini — mereka menavigasi
// dengan klik sidebar dan tidak pernah cy.visit ke route-nya. ROUTE DI BAWAH
// MURNI DUGAAN dari pola modul lain, WAJIB dibuka manual dulu.
//
// Yang berharga dari mereka untuk modul ini: judul it()-nya memuat Skenario +
// Expected Result lengkap (60 TC) — itu bahan TC sheet, bukan bahan POM.
//
// ATURAN BISNIS yang tercatat di judul TC mereka (perlu divalidasi ke PRD,
// JANGAN dianggap fakta):
//   - Dropdown "Pengulangan Tagihan" punya 8 opsi:
//       Sekaligus Lunas, Setiap Minggu, Setiap Bulan, Setiap 2 Bulan,
//       Setiap 3 Bulan, Setiap 4 Bulan, Setiap 6 Bulan, Setiap Tahun
//   - Duplikat ditolak berdasarkan KOMBINASI Nama + Instansi + Pengulangan + Periode
//     (bukan cuma nama) — ini beda dari modul lain, penting untuk TC duplikasi.
//
// Perlu dikonfirmasi saat element analysis:
//   (?) SEMUA nilai config, terutama route & field Periode (tipe & formatnya)

import CrudListPage from './base/CrudListPage';

/** Opsi Pengulangan Tagihan — kandidat dari qa-cazh, belum diverifikasi. */
export const OPSI_PENGULANGAN = [
  'Sekaligus Lunas',
  'Setiap Minggu',
  'Setiap Bulan',
  'Setiap 2 Bulan',
  'Setiap 3 Bulan',
  'Setiap 4 Bulan',
  'Setiap 6 Bulan',
  'Setiap Tahun',
];

class JenisTagihanPage extends CrudListPage {
  constructor() {
    super({
      route: '/setting/invoice/invoice-type', // (?) DUGAAN — belum pernah dibuka
      modul: 'Jenis Tagihan',
      addButtonText: 'Tambah Jenis Tagihan', // (?)
      titles: {
        add: 'Tambah Jenis Tagihan', // (?)
        edit: 'Edit Jenis Tagihan', // (?)
        delete: 'Hapus Jenis Tagihan', // (?)
      },
      emptyState: 'Data Jenis Tagihan tidak ditemukan', // (?)
      fields: {
        instansi: { type: 'select', label: 'Instansi' }, // (?)
        nama: { type: 'text', label: 'Nama Jenis Tagihan', name: 'name' }, // (?)
        pengulangan: { type: 'select', label: 'Pengulangan Tagihan' }, // (?)
        periode: { type: 'select', label: 'Periode' }, // (?) tipe belum pasti — bisa select/date
        status: { type: 'select', label: 'Status' }, // (?)
      },
      columns: {
        instansi: 0, // (?)
        nama: 1, // (?)
        pengulangan: 2, // (?)
        periode: 3, // (?)
        status: 4, // (?)
      },
      api: { list: null, save: null },
    });
  }

  /** Verifikasi dropdown Pengulangan berisi TEPAT 8 opsi sesuai PRD. */
  assertOpsiPengulangan(expected = OPSI_PENGULANGAN) {
    return this.assertOptions('pengulangan', expected);
  }

  tambah({ instansi, nama, pengulangan, periode, status } = {}) {
    this.openAddModal();
    this.fillForm({ instansi, nama, pengulangan, periode, status });
    this.save();
    return this;
  }
}

export default new JenisTagihanPage();
