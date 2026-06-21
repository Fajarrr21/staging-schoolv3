// hapustag.cy.js — Spec Hapus Tag
// Modul: Pengaturan > Akademik > Tag  |  Route: /setting/academic/tag
// Sumber TC: docs/test-cases/TC_Tag_Hapus.xlsx (TC-TAG-HPS-001..013)
// Konvensi: reuse cy.session; fixed-wait (no intercept); naming rerun-safe QA<6digit><2digit-seq>.
//
// Catatan:
//   - assertSuccessToast() di POM hanya cek [data-title] -> BUG-021 (description "data Kelas")
//     ter-reproduce di toast Hapus TAPI assertion title-only mitigate noise di TC.
//   - openDeleteByName POM punya defensive retry (sama pola dgn openEditByName) supaya
//     edit/delete icon first-click-miss ditolerir.

import tag from '../../../../../support/pageobjects/TagPage';
import login from '../../../../../support/pageobjects/LoginPage';

describe('Tag — Hapus (CARDS School)', () => {
  const ts = String(Date.now()).slice(-6);
  let seq = 0;
  let d;

  const uniq = () => `${d.testData.prefix}${ts}${String(++seq).padStart(2, '0')}`;

  before(() => {
    cy.fixture('tag').then((data) => { d = data; });
  });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    tag.visit();
    tag.waitBodyUnlocked(); // ensure body interaktif sebelum aksi
  });

  // Cleanup: paksa tutup dialog/popup yg masih nyangkut antar-TC + force unlock body
  afterEach(() => {
    cy.get('body', { log: false }).then(($b) => {
      const stuck = $b.find('[data-slot="dialog-content"][data-state="open"]').length > 0;
      if (stuck) {
        cy.get('body').type('{esc}', { force: true });
        cy.wait(300, { log: false });
      }
    });
    tag.waitBodyUnlocked();
  });

  // Helper: seed 1 tag baru utk TC, return obj-nya. Akhir di list page + body unlocked.
  const seedFresh = (over = {}) => {
    const t = {
      instansi: d.instansi.primary,
      nama: uniq(),
      kode: uniq(),
      tipe: d.tipeAnggota.semua,
      ...over,
    };
    tag.addTag(t.instansi, t.nama, t.kode, t.tipe);
    tag.assertSuccessToast(d.messages.addSuccess);
    tag.visit();
    tag.waitBodyUnlocked();
    return t;
  };

  // ---------- HAPPY ----------
  it('TC-TAG-HPS-001 | Happy | Buka popup konfirmasi hapus via Aksi -> Hapus', () => {
    const t = seedFresh();
    tag.openDeleteByName(t.nama);
    tag.assertModalOpen(d.labels.deleteTitle);
    tag.elements.deleteConfirmBtn().should('be.visible');
    tag.elements.cancelButton().should('be.visible');
  });

  it('TC-TAG-HPS-002 | Happy | Hapus tag -> sukses (toast + row hilang)', () => {
    const t = seedFresh();
    tag.deleteByName(t.nama);
    tag.assertSuccessToast(d.messages.deleteSuccess);
    tag.assertModalClosed();
    tag.visit();
    tag.assertRowNotExists(t.nama);
  });

  it('TC-TAG-HPS-003 | Happy | Klik Batal -> tidak terhapus, kembali ke list', () => {
    const t = seedFresh();
    tag.openDeleteByName(t.nama);
    tag.clickCancel();
    tag.assertModalClosed();
    tag.visit();
    tag.search(t.nama);
    tag.assertRowExists(t.nama); // baris masih ada
  });

  // ---------- POSITIF ----------
  it('TC-TAG-HPS-004 | Positif | Hapus tag instansi sekunder (Sekolah Alam)', () => {
    const t = seedFresh({ instansi: d.instansi.secondary });
    tag.deleteByName(t.nama);
    tag.assertSuccessToast(d.messages.deleteSuccess);
    tag.visit();
    tag.assertRowNotExists(t.nama);
  });

  it('TC-TAG-HPS-005 | Positif | Hapus setelah Cari by nama', () => {
    const t = seedFresh();
    tag.search(t.nama);
    tag.assertRowExists(t.nama);
    tag.openDeleteByName(t.nama); // openDeleteByName re-search (idempotent)
    tag.confirmDelete();
    tag.assertSuccessToast(d.messages.deleteSuccess);
  });

  // ---------- EDGE ----------
  it('TC-TAG-HPS-006 | Edge | Tutup popup via Escape -> tidak terhapus', () => {
    const t = seedFresh();
    tag.openDeleteByName(t.nama);
    tag.pressEscape();
    tag.assertModalClosed();
    tag.visit();
    tag.search(t.nama);
    tag.assertRowExists(t.nama);
  });

  it('TC-TAG-HPS-007 | Edge | Tutup popup via X close -> tidak terhapus', () => {
    const t = seedFresh();
    tag.openDeleteByName(t.nama);
    tag.elements.closeXButton().click({ force: true });
    tag.assertModalClosed();
    tag.visit();
    tag.search(t.nama);
    tag.assertRowExists(t.nama);
  });

  it('TC-TAG-HPS-008 | Edge | Hapus baris terakhir di hasil search -> empty state', () => {
    const t = seedFresh();
    tag.search(t.nama);
    cy.get('table tbody tr').its('length').should('eq', 1); // tepat 1 baris hasil search
    tag.openDeleteByName(t.nama);
    tag.confirmDelete();
    tag.assertSuccessToast(d.messages.deleteSuccess);
    // Search masih aktif; setelah hapus -> tidak ada row match -> empty state
    tag.assertEmptyState();
  });

  it('TC-TAG-HPS-009 | Edge | Persistence: reload setelah hapus -> tetap hilang', () => {
    const t = seedFresh();
    tag.deleteByName(t.nama);
    tag.assertSuccessToast(d.messages.deleteSuccess);
    tag.assertNotPersisted(t.nama); // reload + cari -> not found
  });

  it('TC-TAG-HPS-010 | PRD-ambigu | Popup konfirmasi memuat nama tag + instansi', () => {
    const t = seedFresh();
    tag.openDeleteByName(t.nama);
    tag.assertDeletePopupMentions(t.nama, t.instansi);
  });

  // ---------- DEFERRED (asosiasi Member -- per instruksi user) ----------
  it.skip('TC-TAG-HPS-011 | Positif | Tag Tipe=Siswa terhapus tidak muncul di picker Data Siswa [DEFERRED]', () => {});
  it.skip('TC-TAG-HPS-012 | Positif | Tag Tipe=Guru&Staff terhapus tidak muncul di picker Data Guru/Staff [DEFERRED]', () => {});
  it.skip('TC-TAG-HPS-013 | Positif | Tag terhapus tidak muncul di picker Presensi/Tagihan [DEFERRED]', () => {});
});
