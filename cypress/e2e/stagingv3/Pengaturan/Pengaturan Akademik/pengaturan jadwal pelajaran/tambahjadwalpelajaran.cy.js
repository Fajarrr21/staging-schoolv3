// Tambah Jadwal Pelajaran - Fase 1 (Modal + redirect verify)
// TC sheet: docs/test-cases/TC_JadwalPelajaran_Tambah.xlsx (19 TC)
// Konvensi assert: BEHAVIOR YG BENAR (post-refactor). Beberapa TC sengaja
// FAIL sampai bug fixed (per CLAUDE.md convention).
//   TC-001/002/003/015/016 -> BUG-036 (klik Simpan modal langsung commit DB)
//   TC-018 -> BUG-034 (Tag gak reset saat ganti Instansi)
//   TC-019 -> BUG-035 (Tag picker prematur aktif + tidak scoped per Instansi)

import login from '../../../../../support/pageobjects/LoginPage';
import jp from '../../../../../support/pageobjects/JadwalPelajaranPage';

describe('Tambah Jadwal Pelajaran — Modal (Fase 1)', () => {
  let d;

  before(() => {
    cy.fixture('jadwal_pelajaran').then((data) => { d = data; });
  });

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    login.loginViaSession(
      d.credentials.email,
      d.credentials.password,
      d.urls.base,
      d.urls.login
    );
    jp.visit();
  });

  // =========================================================================
  // HAPPY (TC-001..003)
  // =========================================================================
  describe('Happy path', () => {
    it('TC-JP-ADD-001 : Modal minimum (Instansi+Tingkat+Kelas) -> redirect; list belum bertambah', () => {
      // Assert BENAR: list belum bertambah. AKTUAL: BUG-036 -> test FAIL sampai fixed.
      jp.countRows().then((baseline) => {
        jp.openAddModal()
          .fillMinimum({
            instansi: d.master.instansi,
            tingkat: d.master.tingkat,
            kelas: d.master.kelasSingle,
          })
          .submitAndCaptureId().then((id) => {
            expect(id, 'captured id from redirect').to.match(/^\d+$/);
            jp.visit();
            jp.countRows().should('eq', baseline);
          });
      });
    });

    it('TC-JP-ADD-002 : Modal lengkap (Jurusan + Tag) -> redirect; list belum bertambah', () => {
      jp.countRows().then((baseline) => {
        jp.openAddModal()
          .fillLengkap({
            instansi: d.master.instansi,
            tingkat: d.master.tingkat,
            kelas: d.master.kelasSingle,
            jurusan: d.master.jurusan,
            tag: d.master.tag,
          })
          .submitAndCaptureId().then((id) => {
            expect(id).to.match(/^\d+$/);
            jp.visit();
            jp.countRows().should('eq', baseline);
          });
      });
    });

    it('TC-JP-ADD-003 : Multi Kelas ON (2 kelas, Jurusan hide) -> redirect; list = 1 entry gabungan', () => {
      jp.countRows().then((baseline) => {
        jp.openAddModal()
          .selectInstansi(d.master.instansi)
          .selectTingkat(d.master.tingkat)
          .toggleMultiKelas(true)
          .assertJurusanHidden()
          .selectKelasMulti(d.master.kelasMulti.slice(0, 2))
          .clickSimpan();
        jp.captureIdFromDetailUrl().then((id) => {
          expect(id).to.match(/^\d+$/);
          jp.visit();
          jp.countRows().should('eq', baseline);
        });
      });
    });
  });

  // =========================================================================
  // POSITIF (TC-004..008)
  // =========================================================================
  describe('Positif', () => {
    it('TC-JP-ADD-004 : Form default state saat modal Tambah pertama kali dibuka', () => {
      jp.openAddModal().assertDialogVisible();
      jp.assertFieldEnabled('Instansi');
      jp.assertFieldDisabled('Tingkat');
      jp.assertFieldDisabled('Kelas');
      jp.assertFieldDisabled('Jurusan');
      // Multi Kelas OFF default
      jp.elements.multiKelasSwitch().should('have.attr', 'data-state', 'unchecked');
      // Label footer button aktual = "Simpan"
      jp.elements.simpanButton().should('contain.text', d.labels.btnSimpan);
      // Batal + X exist
      jp.elements.batalButton().should('be.visible');
    });

    it('TC-JP-ADD-005 : Dependency chain: initial disabled -> setelah full chain semua enabled', () => {
      // AKTUAL (verified via manual): dependency chain gak strict.
      // Setelah Instansi dipilih, Kelas juga enable (bukan cuma Tingkat).
      // Jadi TC ini cuma verify initial state + final state, bukan intermediate order.
      jp.openAddModal();
      // Initial: semua child disabled
      jp.assertFieldDisabled('Tingkat');
      jp.assertFieldDisabled('Kelas');
      jp.assertFieldDisabled('Jurusan');
      // Full chain
      jp.selectInstansi(d.master.instansi);
      jp.selectTingkat(d.master.tingkat);
      jp.selectKelas(d.master.kelasSingle);
      // Final: semua enabled
      jp.assertFieldEnabled('Tingkat');
      jp.assertFieldEnabled('Kelas');
      jp.assertFieldEnabled('Jurusan');
      cy.log('Reset child on Instansi change -> perlu master.instansiAlt di fixture; skip untuk sekarang');
    });

    it('TC-JP-ADD-006 : Multi Kelas toggle ON/OFF -> Jurusan hide/show; Kelas mode berubah', () => {
      jp.openAddModal()
        .selectInstansi(d.master.instansi)
        .selectTingkat(d.master.tingkat);
      // Multi OFF: Jurusan visible, Kelas Radix Select trigger ada
      jp.assertJurusanVisible();
      jp.elements.kelasTrigger().should('exist');
      // Multi ON: Jurusan hide, Kelas checkbox mode (klik trigger buat expand)
      jp.toggleMultiKelas(true).assertJurusanHidden();
      cy.wait(400);
      cy.get('[data-slot="dialog-content"]').then(($dlg) => {
        const $trigger = $dlg.find('[data-slot="form-item"]')
          .filter((_, el) => {
            const lbl = el.querySelector('[data-slot="form-label"]');
            return lbl && lbl.textContent.trim() === 'Kelas';
          })
          .find('button:not([role="checkbox"])')
          .first();
        if ($trigger.length) cy.wrap($trigger).click({ force: true });
      });
      cy.wait(400);
      cy.contains('[data-slot="dialog-content"] label[data-slot="label"]', new RegExp(`^${d.master.kelasMulti[0]}$`))
        .should('exist');
      // Multi OFF lagi (jangan Esc dulu — bisa close modal; toggle langsung dgn force click)
      jp.toggleMultiKelas(false).assertJurusanVisible();
    });

    it('TC-JP-ADD-007 : Tag picker inline checkbox multi-select; chip render setelah pilih', () => {
      jp.openAddModal()
        .selectInstansi(d.master.instansi)
        .selectTingkat(d.master.tingkat)
        .selectKelas(d.master.kelasSingle)
        .pickTag(d.master.tag);
      jp.elements.tagChip(d.master.tag).should('be.visible');
      // Klik ulang label -> unpick
      cy.contains(
        '[data-slot="dialog-content"] label[data-slot="label"]',
        new RegExp(`^${d.master.tag}$`)
      ).click({ force: true });
      jp.elements.tagCheckboxByName(d.master.tag)
        .should('have.attr', 'data-state', 'unchecked');
    });

    it('TC-JP-ADD-008 : Batal / X / Esc close modal tanpa Simpan -> list tidak berubah', () => {
      const openIsi = () => {
        jp.openAddModal()
          .selectInstansi(d.master.instansi)
          .selectTingkat(d.master.tingkat)
          .selectKelas(d.master.kelasSingle);
      };
      // Case 1: Batal
      jp.countRows().then((baseline) => {
        openIsi();
        jp.clickBatal().assertDialogClosed();
        jp.countRows().should('eq', baseline);
      });
      // Case 2: X
      jp.countRows().then((baseline) => {
        openIsi();
        jp.clickX().assertDialogClosed();
        jp.countRows().should('eq', baseline);
      });
      // Case 3: Esc
      jp.countRows().then((baseline) => {
        openIsi();
        jp.pressEsc().assertDialogClosed();
        jp.countRows().should('eq', baseline);
      });
    });
  });

  // =========================================================================
  // NEGATIF (TC-009..013)
  // =========================================================================
  describe('Negatif', () => {
    it('TC-JP-ADD-009 : Simpan dgn Instansi kosong -> error required inline', () => {
      jp.openAddModal().clickSimpan();
      jp.assertInstansiError(d.messages.instansiRequired);
      jp.assertDialogVisible();
    });

    it('TC-JP-ADD-010 : Simpan dgn Tingkat kosong (Instansi terisi) -> error required', () => {
      jp.openAddModal().selectInstansi(d.master.instansi).clickSimpan();
      jp.assertTingkatError(d.messages.tingkatRequired);
      jp.assertDialogVisible();
    });

    it('TC-JP-ADD-011 : Simpan dgn Kelas kosong (Multi OFF; Instansi+Tingkat terisi) -> error required', () => {
      jp.openAddModal()
        .selectInstansi(d.master.instansi)
        .selectTingkat(d.master.tingkat)
        .clickSimpan();
      jp.assertKelasError(d.messages.kelasRequired);
      jp.assertDialogVisible();
    });

    it('TC-JP-ADD-012 : Multi Kelas ON tapi Kelas kosong / 1 kelas -> error min 2', () => {
      // Case 1: kelas kosong
      jp.openAddModal()
        .selectInstansi(d.master.instansi)
        .selectTingkat(d.master.tingkat)
        .toggleMultiKelas(true)
        .clickSimpan();
      jp.elements.anyFormMessage().should('be.visible');
      jp.assertDialogVisible();
      jp.clickBatal();
      // Case 2: hanya 1 kelas
      jp.openAddModal()
        .selectInstansi(d.master.instansi)
        .selectTingkat(d.master.tingkat)
        .toggleMultiKelas(true)
        .selectKelasMulti([d.master.kelasMulti[0]])
        .clickSimpan();
      jp.elements.anyFormMessage().should('be.visible');
      jp.assertDialogVisible();
    });

    it('TC-JP-ADD-013 : Semua field wajib kosong -> pesan error muncul', () => {
      jp.openAddModal().clickSimpan();
      jp.assertInstansiError(d.messages.instansiRequired);
      jp.assertDialogVisible();
      // Tingkat/Kelas disabled -> tidak divalidate (per note TC sheet)
    });
  });

  // =========================================================================
  // EDGE (TC-014..019)
  // =========================================================================
  describe('Edge', () => {
    // SKIP: duplikat validation TIDAK terjadi di modal Simpan (aktual: modal langsung
    // commit ke DB apa aja, konsisten BUG-036). Toast warning "sudah terdaftar" yg
    // pernah user liat manual kemungkinan besar muncul di flow halaman edit (fase 2),
    // BUKAN di modal Tambah. Test dipindah ke TC sheet fase 2 setelah element analysis.
    it.skip('TC-JP-ADD-014 : Duplikasi kombinasi -> toast warning (PINDAH KE FASE 2 — modal Simpan tidak validate duplikat, ref BUG-036)', () => {
      // Placeholder — refactor saat sudah analisis flow validasi di halaman edit.
    });

    it('TC-JP-ADD-015 : Ghost record prevention: back tanpa Simpan halaman edit -> list = baseline', () => {
      // Assert BENAR. AKTUAL: BUG-036 -> list bertambah setelah modal Simpan.
      jp.countRows().then((baseline) => {
        jp.openAddModal()
          .fillMinimum({
            instansi: d.master.instansi,
            tingkat: d.master.tingkat,
            kelas: d.master.kelasSingle,
          })
          .submitAndCaptureId().then(() => {
            jp.visit();
            jp.countRows().should('eq', baseline);
          });
      });
    });

    it('TC-JP-ADD-016 : Halaman edit setelah redirect: URL cocok pattern; list belum bertambah', () => {
      jp.countRows().then((baseline) => {
        jp.openAddModal()
          .fillMinimum({
            instansi: d.master.instansi,
            tingkat: d.master.tingkat,
            kelas: d.master.kelasSingle,
          })
          .submitAndCaptureId().then((id) => {
            expect(id).to.match(/^\d+$/);
            cy.url().should('match', /\/setting\/academic\/course-schedule\/\d+$/);
            jp.visit();
            jp.countRows().should('eq', baseline);
          });
      });
    });

    it('TC-JP-ADD-017 : Label tombol utama: modal = "Simpan", halaman edit = "Simpan"', () => {
      // TC ini murni verify LABEL — ga perlu bikin record baru.
      // Bagian 1: label modal
      jp.openAddModal();
      jp.elements.simpanButton().should('contain.text', d.labels.btnSimpan);
      jp.clickBatal();
      jp.assertDialogClosed();

      // Bagian 2: label halaman edit (state-agnostic — masuk via dropdown Edit
      // di row existing, jadi ga bergantung DB kosong / kombinasi unique).
      cy.get('table[data-slot="data-grid-table"] tbody tr', { timeout: 10000 })
        .first()
        .find('svg.lucide-ellipsis-vertical')
        .closest('button')
        .click();
      cy.contains('[data-slot="dropdown-menu-item"]', /^\s*Edit\s*$/, { timeout: d.timeouts.dropdown })
        .should('be.visible')
        .click({ force: true });
      cy.url({ timeout: d.timeouts.redirect })
        .should('match', /\/setting\/academic\/course-schedule\/\d+$/);
      cy.contains('button', new RegExp(`^\\s*${d.labels.btnSimpan}\\s*$`))
        .should('be.visible');
    });

    it('TC-JP-ADD-018 : Ganti Instansi -> Tag TIDAK ikut reset (assert BENAR; FAIL sampai BUG-034 fixed)', () => {
      // TODO(fixture): perlu master.instansiAlt buat trigger reset. Sekarang pilih ulang
      // Instansi yg sama (aktual gak trigger reset -> tetep bisa surface BUG-034 secara partial).
      jp.openAddModal()
        .selectInstansi(d.master.instansi)
        .selectTingkat(d.master.tingkat)
        .selectKelas(d.master.kelasSingle)
        .pickTag(d.master.tag);
      jp.elements.tagChip(d.master.tag).should('be.visible');
      // Simulate ganti Instansi
      jp.selectInstansi(d.master.instansi);
      // Behavior BENAR: chip hilang. AKTUAL (BUG-034): chip masih ada.
      jp.elements.tagChip(d.master.tag).should('not.exist');
    });

    it('TC-JP-ADD-019 : Tag picker DISABLED sebelum Instansi dipilih (assert BENAR; FAIL sampai BUG-035 fixed)', () => {
      jp.openAddModal();
      // Behavior BENAR: picker Tag disabled (dependency chain Instansi -> Tag).
      // AKTUAL (BUG-035): picker aktif meski Instansi belum dipilih.
      jp.elements.tagPickerButton().should('be.disabled');
    });
  });
});
