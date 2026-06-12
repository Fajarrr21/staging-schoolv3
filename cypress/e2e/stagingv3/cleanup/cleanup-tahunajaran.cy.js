// 🔧 FIX: Support both Dialog & AlertDialog
const DIALOG = '[role="dialog"], [role="alertdialog"]'
const DIALOG_OPEN = '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]'

describe('🧹 CLEANUP: Hapus massal TA test pollution', () => {
  let data

  const DRY_RUN = false
  const TEST_YEAR_MIN = 2030
  const TEST_YEAR_MAX = 2050
  const MAX_ITER = 100

  before(() => {
    cy.fixture('tahunajaran').then((fixtureData) => {
      data = fixtureData
    })
  })

  // 🎯 Helper: cari year text di row regardless of column index
  const getYearFromRow = (row) => {
    const tds = Cypress.$(row).find('td')
    for (let i = 0; i < tds.length; i++) {
      const text = Cypress.$(tds[i]).text().trim()
      const match = text.match(/^(\d{4})\/(\d{4})$/)
      if (match) {
        return { text, year: parseInt(match[1], 10) }
      }
    }
    return null
  }

  // 🎯 Helper: cari semester text di row
  const getSemesterFromRow = (row) => {
    const tds = Cypress.$(row).find('td')
    for (let i = 0; i < tds.length; i++) {
      const text = Cypress.$(tds[i]).text().trim().toUpperCase()
      if (text === 'GANJIL' || text === 'GENAP') {
        return text
      }
    }
    return ''
  }

  it(`${DRY_RUN ? '👀 DRY RUN' : '💥 DELETE'} TA ${TEST_YEAR_MIN}-${TEST_YEAR_MAX}`, () => {
    // Login
    cy.session('admin-cleanup', () => {
      cy.clearAllCookies()
      cy.clearAllLocalStorage()
      cy.clearAllSessionStorage()
      cy.visit(`${data.urls.base}${data.urls.login}`)
      cy.wait(2000)
      cy.get('input[name="email"]').type(data.credentials.email, { delay: 50 })
      cy.get('input[type="password"]').type(data.credentials.password, { delay: 50 })
      cy.wait(500)
      cy.intercept('POST', '**/api/auth/login').as('loginAPI')
      cy.get('button[type="submit"]').click()
      cy.wait('@loginAPI', { timeout: 15000 })
      cy.wait(1000)
      cy.visit(`${data.urls.base}/dashboard`)
      cy.wait(2500)
    })

    // Navigate to list with perPage param
    cy.visit(`${data.urls.base}/setting/academic/school-year?perPage=1000`)
    cy.wait(4000)
    cy.url().should('not.include', '/auth')

    // 🔍 DIAGNOSTIC: log first row structure
    cy.get('tbody tr').first().then(($row) => {
      const tds = $row.find('td')
      cy.log(`🔍 First row has ${tds.length} TDs:`)
      tds.each((i, td) => {
        const text = Cypress.$(td).text().trim().slice(0, 30)
        cy.log(`   td[${i}]: "${text}"`)
      })

      // 🔍 Diagnostic: log all buttons & SVGs in row
      const allBtns = $row.find('button')
      cy.log(`🔍 First row has ${allBtns.length} buttons:`)
      allBtns.each((i, btn) => {
        const svgs = Cypress.$(btn).find('svg')
        svgs.each((j, svg) => {
          cy.log(`  btn[${i}] svg[${j}]: ${svg.getAttribute('class') || 'NO_CLASS'}`)
        })
      })
    })

    if (DRY_RUN) {
      cy.get('tbody tr').then(($rows) => {
        cy.log(`📊 TOTAL ROWS: ${$rows.length}`)

        const targetRows = [...$rows].filter((row) => {
          const data = getYearFromRow(row)
          if (!data) return false
          return data.year >= TEST_YEAR_MIN && data.year <= TEST_YEAR_MAX
        })

        const uniqueYears = new Set()
        targetRows.forEach((row) => {
          const data = getYearFromRow(row)
          if (data) uniqueYears.add(data.text)
        })

        cy.log(`🎯 TARGET ROWS: ${targetRows.length}`)
        cy.log(`📅 UNIQUE TA: ${uniqueYears.size}`)
        ;[...uniqueYears].sort().forEach((ta, i) => cy.log(`  ${i + 1}. ${ta}`))
      })
      return
    }

    // ============================================================
    // DELETE LOOP — Native DOM click strategy
    // ============================================================
    const cleanupOne = (iter = 0) => {
      if (iter >= MAX_ITER) {
        cy.log(`⚠️ Max iterations reached`)
        return
      }

      // 🔧 FIX: Reset stale state (close any open menu/modal)
      cy.get('body').type('{esc}', { force: true })
      cy.wait(500)

      cy.get('tbody tr').then(($rows) => {
        cy.log(`🔄 Iter ${iter + 1}: scanning ${$rows.length} rows`)

        const targetIndex = [...$rows].findIndex((row) => {
          const data = getYearFromRow(row)
          if (!data) return false
          return data.year >= TEST_YEAR_MIN && data.year <= TEST_YEAR_MAX
        })

        if (targetIndex === -1) {
          cy.log(`✅ DONE at iter ${iter}. No more test data.`)
          return
        }

        const yearData = getYearFromRow($rows[targetIndex])
        const semText = getSemesterFromRow($rows[targetIndex])
        cy.log(`[${iter + 1}] 🎯 Targeting "${yearData.text}" (${semText}) at row ${targetIndex}`)

        // 🔍 DIAGNOSTIC: log buttons in TARGET row (first iter only)
        if (iter === 0) {
          const $targetRow = Cypress.$($rows[targetIndex])
          const allBtns = $targetRow.find('button')
          cy.log(`🔍 Target row buttons: ${allBtns.length}`)
          allBtns.each((i, btn) => {
            const svgs = Cypress.$(btn).find('svg')
            svgs.each((j, svg) => {
              cy.log(`  btn[${i}] svg[${j}]: ${svg.getAttribute('class') || 'NO_CLASS'}`)
            })
          })
        }

        // 🎯 Click delete — multi-strategy
        cy.get('tbody tr').eq(targetIndex).then(($row) => {
          // Strategy 1: svg[class*="trash"] (lenient — matches lucide-trash, lucide-trash-2, etc)
          let $deleteBtn = $row.find('button').filter((_, btn) =>
            Cypress.$(btn).find('svg[class*="trash"]').length > 0
          )

          // Strategy 2: aria-label or title contains "hapus"/"delete"
          if ($deleteBtn.length === 0) {
            $deleteBtn = $row.find('button').filter((_, btn) => {
              const aria = Cypress.$(btn).attr('aria-label') || ''
              const title = Cypress.$(btn).attr('title') || ''
              return /hapus|delete/i.test(aria) || /hapus|delete/i.test(title)
            })
            if ($deleteBtn.length > 0) {
              cy.log(`⚠️ Using fallback: aria-label/title match`)
            }
          }

          // Strategy 3: Last button in row (delete usually last in Aksi column)
          if ($deleteBtn.length === 0) {
            cy.log(`⚠️ Using last-resort fallback: last button in row`)
            $deleteBtn = $row.find('button').last()
          }

          if ($deleteBtn.length === 0) {
            throw new Error(`Row ${targetIndex} has NO buttons!`)
          }

          cy.log(`✅ Delete btn found, scrolling + native clicking...`)
          $deleteBtn[0].scrollIntoView()
          cy.wait(500)
          $deleteBtn[0].click()
        })

        cy.wait(2500)

        // 🔧 FIX: Lenient dialog check — any dialog/alertdialog regardless of state
        cy.get(DIALOG, { timeout: 12000 })
          .should('exist')
          .and('contain.text', 'Hapus')

        cy.wait(800)

        // Click Hapus — native click
        cy.get(DIALOG).then(($dialog) => {
          const $hapusBtn = $dialog.find('button').filter((_, btn) =>
            Cypress.$(btn).text().trim() === 'Hapus'
          )

          if ($hapusBtn.length === 0) {
            throw new Error('No Hapus button found in dialog!')
          }

          cy.log(`✅ Hapus btn found, native clicking...`)
          $hapusBtn[0].click()
        })

        cy.wait(3500) // wait API + refresh

        // Recursive call
        cleanupOne(iter + 1)
      })
    }

    cleanupOne()
  })
})