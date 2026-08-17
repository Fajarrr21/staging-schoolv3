import TingkatPage from '../../../../../support/pageobjects/TingkatPage'
import LoginPage from '../../../../../support/pageobjects/LoginPage'

// ============================================================
// CLEANUP SPEC (maintenance, bukan test case)
// Tujuan: hapus semua data Tingkat sisa testing yg berprefix "QA<digit>"
//         (mis. QA1234561) dari instansi manapun, biar staging bersih.
//
// CATATAN:
//  - HANYA menarget nama berpola /QA\d/ — AMAN, ga nyentuh data real.
//  - Data test berspasi "Kelas <id>" TIDAK ikut dihapus (terlalu berisiko
//    mass-delete kata "Kelas" yg umum dipakai data asli). Hapus manual bila perlu.
//  - Jalankan terpisah/last (nama file diawali "zzz" -> urut terakhir).
//  - Idempotent: aman dijalankan berkali-kali.
// ============================================================

const DIALOG = '[role="dialog"][data-state="open"]'
const QA_PATTERN = /QA\d/
const MAX_ITER = 80 // safety net biar ga infinite loop

describe('CLEANUP - Hapus data test QA (Tingkat)', () => {
  let data

  before(() => {
    cy.fixture('tingkat').then((d) => { data = d })
  })

  beforeEach(() => {
    // Login terpusat: LoginPage.loginViaSession (cy.session + validate() + tunggu @loginAPI).
    // Sebelumnya spec ini punya blok cy.session sendiri dengan id 'admin-cazh-session'/'admin-cleanup'
    // tanpa validate() — sesi mati tetap dipakai dari cache, dan akun yang sama login berkali-kali.
    LoginPage.loginViaSession(
      data.credentials.email,
      data.credentials.password,
      data.urls.base,
      data.urls.login,
    )

    cy.visit(`${data.urls.base}${data.urls.dashboard}`)
    cy.wait(1500)
    cy.url().should('not.include', '/auth')
  })

  it('Menghapus semua Tingkat berprefix QA sampai bersih', () => {
    let deleted = 0

    const purge = (iter) => {
      if (iter <= 0) {
        cy.log(`⚠️ Berhenti di batas iterasi (${MAX_ITER}). Jalankan ulang bila masih ada.`)
        return
      }

      // VISIT ULANG tiap putaran -> search box dijamin kosong (anti akumulasi "QAQA"),
      // lalu filter "QA" dgn searchFor yg sudah di-guard.
      TingkatPage.visit(data.urls.base, data.urls.list)
      TingkatPage.searchFor('QA')

      cy.get('body').then(($body) => {
        const qaRows = [...$body.find('table tbody tr')]
          .filter((tr) => QA_PATTERN.test(tr.innerText || ''))

        if (qaRows.length === 0) {
          cy.log(`✅ Bersih. Total data QA terhapus: ${deleted}`)
          return
        }

        // hapus row QA pertama
        cy.contains('table tbody tr', QA_PATTERN).first()
          .find('.lucide-trash').parents('button').first()
          .click({ force: true })

        cy.get(DIALOG, { timeout: 8000 }).should('be.visible')
        cy.get(DIALOG).contains('button', 'Hapus').click({ force: true })

        cy.get('[data-sonner-toast][data-type="success"] [data-title]', { timeout: 8000 })
          .should('contain.text', 'berhasil')
        deleted += 1
        cy.log(`🗑️ Terhapus: ${deleted}`)
        cy.wait(800)

        purge(iter - 1) // lanjut sampai habis
      })
    }

    purge(MAX_ITER)
  })
})