// LogAktivasiAlumniPage.js — POM modul Log Aktivasi Alumni
// Menu: ANGGOTA > Alumni > Log Aktivasi
//
// ⚠️ STATUS: KERANGKA — belum lewat checkpoint element analysis.
//
// BENTUK: halaman bertab (Radix Tabs) + tabel per tab.
//
// Data dari qa-cazh yang paling berguna untuk modul ini: nama 8 kolom tabel
// dan 3 nama tab — itu langsung jadi bahan TC struktur list. Tetap (?) sampai
// dikonfirmasi.
//
// Perlu dikonfirmasi saat element analysis:
//   (?) route — qa-cazh menulis 'member/alumni/activation-log' TANPA leading slash
//       (relatif ke baseUrl). Pastikan bentuk final path-nya.
//   (?) urutan kolom & mana yang jadi index `columns`
//   (?) apakah tab memfilter berdasarkan kolom Status
//   (?) aksi apa yang tersedia per baris (Setujui/Tolak?) dan di tab mana saja
//   (?) teks empty state per tab

import TabbedPage from './base/TabbedPage';

class LogAktivasiAlumniPage extends TabbedPage {
  constructor() {
    super({
      modul: 'Log Aktivasi Alumni',
      route: '/member/alumni/activation-log', // (?)
      pageTitle: 'Log Aktivasi Alumni', // (?)
      pageSubtitle: 'Riwayat pengajuan aktivasi alumni dan keputusannya', // (?)
      tabs: ['Menunggu', 'Disetujui', 'Ditolak'], // (?)
      defaultTab: 'Menunggu', // (?)
      columns: {
        tanggal: 0, // (?)
        pengaju: 1, // (?)
        tipeAnggota: 2, // (?)
        jumlah: 3, // (?)
        catatan: 4, // (?)
        status: 5, // (?)
        keputusan: 6, // (?)
        aksi: 7, // (?)
      },
      emptyState: 'Data Log Aktivasi Alumni tidak ditemukan', // (?) ikut pola app
      api: { list: null },
    });
  }

  /** Header kolom sesuai daftar dari element analysis. */
  assertKolomLengkap() {
    return this.assertColumns([
      'Tanggal', 'Pengaju', 'Tipe Anggota', 'Jumlah',
      'Catatan', 'Status', 'Keputusan', 'Aksi',
    ]);
  }

  /**
   * Tab harus benar-benar memfilter: tab "Disetujui" tidak boleh memuat baris
   * berstatus lain. Ini yang membedakan tab fungsional dari tab kosmetik.
   */
  assertTabMemfilter(tabName, statusExpected = tabName) {
    this.switchTab(tabName);
    return this.assertAllRowsCell('status', statusExpected);
  }
}

export default new LogAktivasiAlumniPage();
