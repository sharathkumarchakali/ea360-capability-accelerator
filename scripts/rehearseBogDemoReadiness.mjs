/**
 * BoG demo-readiness rehearsal (panels, print, one-click start, walkthrough ×2).
 * Reports Pass / Fail / Not verified. Not presenter sign-off.
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import zlib from 'node:zlib'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = process.env.EA360_BASE || 'http://127.0.0.1:4173/app/'
const OUT_DIR = path.join(__dirname, '..', 'tmp', 'bog-demo-readiness')
const DISCLAIMER = 'Synthetic scenario — not a Bank of Ghana assessment'

const results = []

function record(step, ok, detail = '') {
  const status = ok === null ? 'Not verified' : ok ? 'Pass' : 'Fail'
  results.push({ step, status, detail })
  const tag = status === 'Pass' ? 'PASS' : status === 'Fail' ? 'FAIL' : 'NOT VERIFIED'
  console.log(`[${tag}] ${step}${detail ? ` — ${detail}` : ''}`)
}

async function waitReady(page, opts = {}) {
  const timeout = opts.timeout || 15000
  const expectTitle = opts.expectTitle
  await page.locator('.demo-tour-bar').waitFor({ state: 'visible', timeout })
  if (expectTitle) {
    await page.waitForFunction(
      (re) => new RegExp(re, 'i').test(document.querySelector('.demo-tour-bar__title')?.textContent || ''),
      expectTitle,
      { timeout },
    )
  }
  await page.waitForTimeout(150)
  await page.waitForFunction(
    () => {
      const preparing = document.querySelector('.demo-tour-bar__preparing')
      const alert = document.querySelector('.demo-tour-bar__alert')
      const next = [...document.querySelectorAll('.demo-tour-btn--primary')].find((b) =>
        /Next|Finish/.test(b.textContent || ''),
      )
      return !preparing && !alert && next && !next.disabled
    },
    { timeout },
  )
}

async function snapshot(page) {
  return page.evaluate(() => {
    const askOpen = Boolean(document.querySelector('.ask-root'))
    const tourActive = Boolean(document.querySelector('.demo-tour-bar'))
    const title = document.querySelector('.demo-tour-bar__title')?.textContent?.trim() || ''
    const count = document.querySelector('.demo-tour-bar__count')?.textContent?.trim() || ''
    const alert = document.querySelector('.demo-tour-bar__alert')?.textContent?.trim() || ''
    const disclaimer = document.querySelector('.demo-tour-bar__disclaimer')?.textContent?.trim() || ''
    const detail =
      document.querySelector('.drawer-root [data-demo-target="entity-detail"]') ||
      document.querySelector('[data-demo-target="entity-detail"]')
    const drawerOpen = Boolean(document.querySelector('.drawer-root .entity-drawer:not(.ask-panel)'))
    const inlineDetail = Boolean(
      document.querySelector(
        '.recs-detail[data-demo-target="entity-detail"], .findings-detail[data-demo-target="entity-detail"], .ea-detail-panel[data-demo-target="entity-detail"], .gov-detail[data-demo-target="entity-detail"]',
      ),
    )
    const selectedId = detail?.getAttribute('data-demo-entity-id') || null
    const selectedType = detail?.getAttribute('data-demo-entity-type') || null
    const graphRootLabel =
      document.querySelector('.explorer-root-text strong')?.textContent?.trim() ||
      document.querySelector('[data-demo-target="graph-node"] .rf-node-name')?.textContent?.trim() ||
      null
    const scenarioLabel =
      document.querySelector('.explorer-scenario-title')?.textContent?.trim() ||
      document.querySelector('.explorer-select option:checked')?.textContent?.trim() ||
      null
    const main =
      (document.querySelector('#main-content')?.innerText || '') +
      '\n' +
      (document.querySelector('.drawer-root')?.innerText || '') +
      '\n' +
      (document.querySelector('.ask-root')?.innerText || '')
    const hash = window.location.hash.replace('#', '') || 'executive'
    const tourBar = document.querySelector('.demo-tour-bar')
    const drawerEl = document.querySelector('.drawer-root .entity-drawer:not(.ask-panel)')
    let drawerClearsToolbar = true
    if (tourBar && drawerEl) {
      const barBottom = tourBar.getBoundingClientRect().bottom
      const head = drawerEl.querySelector('.drawer-head')
      const headTop = head?.getBoundingClientRect().top ?? drawerEl.getBoundingClientRect().top
      drawerClearsToolbar = headTop >= barBottom - 1
    }
    const surfaces = [
      ...document.querySelectorAll(
        '.drawer-root .entity-drawer:not(.ask-panel), .recs-detail, .findings-detail, .gov-detail, .ea-detail-panel[data-demo-target="entity-detail"]',
      ),
    ].filter((el) => {
      const st = getComputedStyle(el)
      return st.visibility !== 'hidden' && st.display !== 'none' && el.getBoundingClientRect().width > 0
    })
    return {
      askOpen,
      tourActive,
      title,
      count,
      alert,
      disclaimer,
      selectedId,
      selectedType,
      graphRootLabel,
      scenarioLabel,
      main,
      hash,
      drawerOpen,
      inlineDetail,
      drawerClearsToolbar,
      visibleDetailSurfaces: surfaces.length,
      graphNodes: document.querySelectorAll('[data-demo-target="graph-node"]').length,
      edges: document.querySelectorAll('.react-flow__edge-path').length,
      presentation: document.documentElement.classList.contains('presentation-mode')
        || Boolean(document.querySelector('.presentation-mode')),
    }
  })
}

async function clickNext(page) {
  await page.locator('.demo-tour-btn--primary', { hasText: /Next|Finish/ }).click({ force: true })
}

async function advance(page, expectTitle) {
  await clickNext(page)
  await waitReady(page, { expectTitle })
  await page.waitForTimeout(400)
}

async function resetToLanding(page) {
  await page.evaluate(() => {
    try { localStorage.clear() } catch {}
  })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.getByRole('dialog', { name: /EA360/i }).waitFor({ state: 'visible', timeout: 10000 })
}

async function startOneClick(page) {
  if ((await page.getByRole('button', { name: /Start BoG resilience demo/i }).count()) === 0) {
    await resetToLanding(page)
  }
  await page.getByRole('button', { name: /Start BoG resilience demo/i }).click()
  await waitReady(page, { expectTitle: 'Enterprise health' })
  await page.locator('[data-demo-target="executive-health"]').waitFor({ timeout: 8000 }).catch(() => null)
}

function extractPdfText(buf) {
  const raw = buf.toString('latin1')
  const chunks = [raw]
  const re = /stream\r?\n([\s\S]*?)endstream/g
  let m
  while ((m = re.exec(raw))) {
    let payload = Buffer.from(m[1], 'binary')
    // PDF streams may start with an extra newline already consumed by the regex.
    for (const fn of ['inflateSync', 'unzipSync']) {
      try {
        chunks.push(zlib[fn](payload).toString('latin1'))
        break
      } catch {}
      try {
        chunks.push(zlib[fn](payload.subarray(2)).toString('latin1'))
        break
      } catch {}
    }
  }
  const literals = [...raw.matchAll(/\((?:\\.|[^\\)]){2,}\)/g)].map((x) =>
    x[0].slice(1, -1).replace(/\\([nrt\\()])/g, (_, c) => ({ n: '\n', r: '\r', t: '\t', '\\': '\\', '(': '(', ')': ')' }[c] || c)),
  )
  chunks.push(literals.join(' '))
  return chunks.join('\n')
}

function pdfHas(buf, needles) {
  const text = extractPdfText(buf)
  const missing = needles.filter((n) => !text.includes(n))
  return {
    ok: missing.length === 0,
    missing,
    bytes: buf.length,
    textSample: text.replace(/\s+/g, ' ').slice(0, 280),
  }
}


async function capturePdf(page, fileName, needles) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  await page.emulateMedia({ media: 'print' })
  const metrics = await page.evaluate(() => {
    const body = getComputedStyle(document.body)
    const app = getComputedStyle(document.querySelector('.app') || document.body)
    const main = getComputedStyle(document.querySelector('.main') || document.body)
    return {
      bodyOverflow: body.overflow,
      appOverflow: app.overflow,
      mainOverflow: main.overflow,
      bodyHeight: body.height,
      scrollHeight: document.documentElement.scrollHeight,
    }
  })
  const buf = await page.pdf({
    path: path.join(OUT_DIR, fileName),
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', right: '12mm', bottom: '14mm', left: '12mm' },
  })
  await page.emulateMedia({ media: 'screen' })
  const check = pdfHas(buf, needles)
  const multiPageLikely = metrics.scrollHeight > 2200 || buf.length > 40000
  return { ...check, metrics, multiPageLikely, file: path.join(OUT_DIR, fileName) }
}

async function checkDetailClearance(page, label) {
  const snap = await snapshot(page)
  const oneSurface = snap.visibleDetailSurfaces <= 1
  const clears = snap.drawerOpen ? snap.drawerClearsToolbar : true
  const opaqueWrap = await page.evaluate(() => {
    const el =
      document.querySelector('.drawer-root .entity-drawer:not(.ask-panel)') ||
      document.querySelector('.recs-detail, .findings-detail, .ea-detail-panel[data-demo-target="entity-detail"]')
    if (!el) return { ok: false, reason: 'no detail' }
    const st = getComputedStyle(el)
    const bg = st.backgroundColor
    const wrap = st.overflowWrap === 'anywhere' || st.overflowWrap === 'break-word' || st.wordBreak === 'break-word'
    const opaque = bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent'
    return { ok: opaque && wrap, bg, wrap, opaque }
  })
  record(
    `${label} / one detail surface`,
    oneSurface && clears,
    `surfaces=${snap.visibleDetailSurfaces} drawerClears=${clears} drawer=${snap.drawerOpen} inline=${snap.inlineDetail}`,
  )
  record(`${label} / opaque wrap`, opaqueWrap.ok, JSON.stringify(opaqueWrap))
  return snap
}

async function rehearsePath(page, label) {
  console.log(`\n=== Rehearsal: ${label} ===`)
  await startOneClick(page)
  let snap = await snapshot(page)
  record(
    `${label} / one-click start`,
    /Enterprise health/i.test(snap.title) && snap.presentation && !snap.askOpen && snap.disclaimer.includes('not a Bank of Ghana'),
    `title=${snap.title} presentation=${snap.presentation} disclaimer=${snap.disclaimer.slice(0, 60)}`,
  )

  await advance(page, 'Open the interface')
  snap = await snapshot(page)
  record(
    `${label} / RTGS-to-oversight (int-bog-12)`,
    /Open the interface/i.test(snap.title) && snap.hash === 'integrations' && snap.selectedId === 'int-bog-12' && /Retail Oversight/i.test(snap.main) && !snap.askOpen,
    `title=${snap.title} sel=${snap.selectedId} hash=${snap.hash}`,
  )
  record(
    `${label} / interface not SWIFT substitute`,
    /Retail Oversight/i.test(snap.main) && !(/SWIFT Gateway/i.test(snap.main) && !/Retail Oversight/i.test(snap.main)),
    /Retail Oversight/i.test(snap.main) ? 'oversight path present' : 'missing oversight',
  )
  await checkDetailClearance(page, `${label} / interface detail`)

  await advance(page, 'Dependency graph')
  await page.locator('[data-demo-target="graph-node"]').first().waitFor({ timeout: 10000 })
  snap = await snapshot(page)
  record(
    `${label} / graph rooted at int-bog-12`,
    /Dependency graph/i.test(snap.title) &&
      snap.hash === 'explorer' &&
      /Retail Oversight|RTGS/i.test(snap.graphRootLabel || '') &&
      /Payment/i.test(snap.scenarioLabel || snap.main) &&
      snap.graphNodes > 0 &&
      snap.edges > 0 &&
      !snap.askOpen,
    `root=${snap.graphRootLabel} scenario=${snap.scenarioLabel} nodes=${snap.graphNodes} edges=${snap.edges}`,
  )

  await advance(page, 'Supporting evidence')
  snap = await snapshot(page)
  record(
    `${label} / evidence`,
    /Supporting evidence/i.test(snap.title) && snap.hash === 'evidence' && snap.selectedId === 'ev-bog-06',
    `title=${snap.title} sel=${snap.selectedId}`,
  )
  await checkDetailClearance(page, `${label} / evidence detail`)

  await advance(page, 'Decision with conditions')
  snap = await snapshot(page)
  record(
    `${label} / recorded conditional decision`,
    /Decision with conditions/i.test(snap.title) &&
      (snap.hash === 'decisions' || snap.hash === 'governance') &&
      snap.selectedId === 'dec-bog-02' &&
      /Approved with Conditions|Conditional approval/i.test(snap.main),
    `title=${snap.title} hash=${snap.hash} sel=${snap.selectedId}`,
  )
  await checkDetailClearance(page, `${label} / decision detail`)

  await advance(page, 'Initiative and delivery')
  snap = await snapshot(page)
  record(
    `${label} / delivery owner and next action`,
    /Initiative and delivery/i.test(snap.title) && snap.hash === 'roadmap' && snap.selectedId === 'init-bog-03' && /Payment-system resilience/i.test(snap.main),
    `title=${snap.title} sel=${snap.selectedId}`,
  )
  await checkDetailClearance(page, `${label} / initiative detail`)

  await advance(page, 'Executive briefing')
  snap = await snapshot(page)
  record(
    `${label} / decision brief step ready`,
    /Executive briefing/i.test(snap.title) && !snap.askOpen,
    `title=${snap.title} askOpen=${snap.askOpen}`,
  )

  await page.locator('.demo-tour-btn--primary', { hasText: /Finish/ }).click({ force: true })
  await page.waitForTimeout(800)
  snap = await snapshot(page)
  const genericToast = (snap.toasts || []).some?.((t) => /Journey complete/i.test(t))
  const askText = await page.locator('.ask-root').innerText().catch(() => '')
  record(
    `${label} / ends on decision brief (not generic toast)`,
    snap.askOpen === true && snap.tourActive === false && /Synthetic scenario|not a Bank of Ghana/i.test(askText + snap.disclaimer),
    `askOpen=${snap.askOpen} tourActive=${snap.tourActive}`,
  )
  record(
    `${label} / exported brief disclaimer`,
    /Synthetic scenario — not a Bank of Ghana assessment/i.test(askText) || /not a Bank of Ghana/i.test(askText),
    askText.slice(0, 120).replace(/\s+/g, ' '),
  )
}

async function rehearseControls(page) {
  console.log('\n=== Controls: Back / Retry / Restart ===')
  await startOneClick(page)
  await advance(page, 'Open the interface')
  const afterFirst = await page.locator('.demo-tour-bar__title').textContent()
  await page.getByRole('button', { name: 'Back' }).click({ force: true })
  await waitReady(page, { expectTitle: 'Enterprise health' })
  const afterBack = await page.locator('.demo-tour-bar__title').textContent()
  record('Back returns to previous step', /Enterprise health/i.test(afterBack || '') && /Open the interface/i.test(afterFirst || ''), `${afterFirst} → ${afterBack}`)

  await advance(page, 'Open the interface')
  await page.getByRole('button', { name: /More/ }).click({ force: true })
  await page.getByRole('menuitem', { name: /Retry step/ }).click({ force: true })
  await waitReady(page, { expectTitle: 'Open the interface' })
  let snap = await snapshot(page)
  record(
    'Retry re-applies without opening Ask',
    /Open the interface/i.test(snap.title) && !snap.askOpen && snap.selectedId === 'int-bog-12',
    `title=${snap.title} sel=${snap.selectedId} askOpen=${snap.askOpen}`,
  )

  // dialogs handled by page.on
  await page.getByRole('button', { name: /More/ }).click({ force: true })
  await page.getByRole('menuitem', { name: /Restart walkthrough/ }).click({ force: true })
  await waitReady(page, { expectTitle: 'Enterprise health' })
  snap = await snapshot(page)
  record(
    'Restart returns to step 1 with Ask closed',
    /Enterprise health/i.test(snap.title) && !snap.askOpen && /1 of/i.test(snap.count),
    `title=${snap.title} count=${snap.count} askOpen=${snap.askOpen}`,
  )
}

async function rehearseRecommendationPanel(page) {
  console.log('\n=== Recommendation detail panel overlap ===')
  await page.evaluate(() => {
    try {
      localStorage.clear()
    } catch {
      /* ignore */
    }
  })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Start BoG resilience demo/i }).click()
  await waitReady(page, { expectTitle: 'Enterprise health' })
  // Jump via hash + store selection to recommendations record
  await page.evaluate(() => {
    window.location.hash = 'recommendations'
  })
  await page.waitForTimeout(500)
  const opened = await page.evaluate(() => {
    const store = window.__EA360_STORE__
    // Fallback: click list row if present
    const row = [...document.querySelectorAll('tr, .itemcard, button, a')].find((el) =>
      /Rationalise overlapping analytics platforms/i.test(el.textContent || ''),
    )
    if (row) {
      row.click()
      return 'clicked'
    }
    return store ? 'no-row' : 'no-store'
  })
  await page.waitForTimeout(400)
  // Force presentation mode + select via UI search if needed
  const presentBtn = page.locator('button', { hasText: /Presentation mode/i }).first()
  if (await presentBtn.count()) {
    const pressed = await presentBtn.getAttribute('aria-pressed')
    if (pressed !== 'true') await presentBtn.click({ force: true })
  }
  const detail = page.locator('.recs-detail, [data-demo-entity-id="rec-bog-02"]')
  const hasDetail = (await detail.count()) > 0
  const drawerCount = await page.locator('.drawer-root .entity-drawer:not(.ask-panel)').count()
  record(
    'Recommended response / Rationalise overlapping analytics — single surface',
    hasDetail && drawerCount === 0,
    `opened=${opened} hasInline=${hasDetail} drawers=${drawerCount}`,
  )
  for (const vp of [
    { w: 1280, h: 720, scale: 1 },
    { w: 1920, h: 1080, scale: 1 },
    { w: 1280, h: 720, scale: 1.25 },
    { w: 1920, h: 1080, scale: 1.25 },
  ]) {
    await page.setViewportSize({ width: vp.w, height: vp.h })
    // deviceScaleFactor requires new context; approximate with CSS zoom
    await page.evaluate((z) => {
      document.documentElement.style.zoom = z === 1 ? '' : String(z)
    }, vp.scale)
    await page.waitForTimeout(200)
    const ok = await page.evaluate(() => {
      const inline = document.querySelector('.recs-detail, [data-demo-target="entity-detail"]')
      const drawer = document.querySelector('.drawer-root .entity-drawer:not(.ask-panel)')
      const bar = document.querySelector('.demo-tour-bar')
      if (!inline && !drawer) return { ok: false, reason: 'no detail' }
      const surface = drawer || inline
      const st = getComputedStyle(surface)
      const head = surface.querySelector('h2, h3, .detail-surface-head')
      const close = surface.querySelector('button')
      const headBox = head?.getBoundingClientRect()
      const barBottom = bar?.getBoundingClientRect().bottom ?? 0
      const clears = !bar || !headBox || headBox.top >= barBottom - 2
      const wrap =
        st.overflowWrap === 'anywhere' ||
        st.overflowWrap === 'break-word' ||
        st.wordBreak === 'break-word' ||
        st.whiteSpace === 'normal'
      const opaque = st.backgroundColor && st.backgroundColor !== 'rgba(0, 0, 0, 0)'
      return {
        ok: !drawer && Boolean(inline) && clears && wrap && opaque,
        clears,
        wrap,
        opaque,
        drawer: Boolean(drawer),
        closeVisible: close ? getComputedStyle(close).visibility !== 'hidden' : true,
      }
    })
    record(
      `Panel layout ${vp.w}×${vp.h}@${Math.round(vp.scale * 100)}%`,
      ok.ok,
      JSON.stringify(ok),
    )
  }
  await page.evaluate(() => {
    document.documentElement.style.zoom = ''
  })
}

async function rehearsePrint(page) {
  console.log('\n=== Print / PDF ===')
  await page.evaluate(() => {
    try {
      localStorage.clear()
    } catch {
      /* ignore */
    }
  })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Start BoG resilience demo/i }).click()
  await waitReady(page, { expectTitle: 'Enterprise health' })

  // Executive Report
  await page.evaluate(() => {
    window.location.hash = 'reports'
  })
  await page.waitForSelector('#executive-report, .executive-report', { timeout: 8000 })
  await page.waitForTimeout(500)
  const reportPdf = await capturePdf(page, 'bog-executive-report.pdf', [
    'Executive summary',
    'Priority findings',
    'Synthetic',
  ])
  const reportDom = await page.evaluate(() => {
    const root = document.querySelector('#executive-report, .executive-report')
    const text = root?.innerText || ''
    return {
      first: /Executive summary/i.test(text),
      middle: /Priority findings|Recommendations|Integration/i.test(text),
      final: /Synthetic|disclaimer/i.test(text),
      pages: document.querySelectorAll('.report-page').length,
    }
  })
  record(
    'Print Executive Report multi-page PDF',
    reportDom.first && reportDom.middle && reportDom.final && reportDom.pages >= 3 &&
      reportPdf.multiPageLikely && reportPdf.metrics.bodyOverflow.includes('visible'),
    `domPages=${reportDom.pages} bytes=${reportPdf.bytes} pdfTextMissing=${reportPdf.missing.join('|') || 'none'} scrollH=${reportPdf.metrics.scrollHeight} overflow=${reportPdf.metrics.bodyOverflow} sample=${reportPdf.textSample || ''}`,
  )

  // Executive Briefing via Ask
  await page.getByRole('button', { name: /Ask EA360/i }).first().click({ force: true }).catch(() => null)
  const askOpen = await page.locator('.ask-root').waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false)
  if (!askOpen) {
    record('Print Executive Briefing', null, 'Ask panel did not open')
    record('Print Ask EA360', null, 'Ask panel did not open')
    return
  }
  const briefingTab = page.locator('.ask-tab', { hasText: /Briefing/i })
  if (await briefingTab.count()) await briefingTab.click()
  const gen = page.getByRole('button', { name: /Generate|Refresh|Create briefing/i }).first()
  if (await gen.count()) await gen.click()
  await page.waitForTimeout(1200)
  const briefingPdf = await capturePdf(page, 'bog-executive-briefing.pdf', [
    'Synthetic',
    'Bank of Ghana',
  ])
  const briefDom = await page.evaluate(() => {
    const text = document.querySelector('.ask-root')?.innerText || document.body.innerText || ''
    return {
      first: /Executive briefing|summary|health/i.test(text),
      middle: /finding|decision|initiative|risk/i.test(text),
      final: /Synthetic scenario — not a Bank of Ghana assessment|not a Bank of Ghana/i.test(text),
    }
  })
  record(
    'Print Executive Briefing multi-page PDF',
    briefDom.first && briefDom.middle && briefDom.final && briefingPdf.metrics.bodyOverflow.includes('visible') && briefingPdf.bytes > 20000,
    `bytes=${briefingPdf.bytes} pdfTextMissing=${briefingPdf.missing.join('|') || 'none'} scrollH=${briefingPdf.metrics.scrollHeight} sample=${briefingPdf.textSample || ''}`,
  )

  // Ask print entry (print-briefing action or Print button)
  const printBtn = page.getByRole('button', { name: /Print/i }).first()
  if (await printBtn.count()) {
    // Capture PDF directly (window.print is blocked in headless); same CSS path.
    const askPdf = await capturePdf(page, 'bog-ask-ea360.pdf', ['Synthetic'])
    record(
      'Print Ask EA360',
      askPdf.metrics.bodyOverflow.includes('visible') && askPdf.bytes > 20000,
      `bytes=${askPdf.bytes} pdfTextMissing=${askPdf.missing.join('|') || 'none'} sample=${askPdf.textSample || ''}`,
    )
  } else {
    record('Print Ask EA360', null, 'No Print button visible in Ask panel')
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  page.on('dialog', async (d) => { try { await d.accept() } catch {} })

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    try {
      localStorage.clear()
    } catch {
      /* ignore */
    }
  })
  await page.goto(BASE, { waitUntil: 'networkidle' })

  // Landing one-click without tenant/role selection
  const landing = page.getByRole('dialog', { name: /EA360/i })
  await landing.waitFor({ state: 'visible', timeout: 10000 })
  const bogBtn = landing.getByRole('button', { name: /Start BoG resilience demo/i })
  record('Landing shows Start BoG resilience demo', (await bogBtn.count()) === 1, `count=${await bogBtn.count()}`)
  record('Landing disclaimer visible', (await landing.getByText(DISCLAIMER).count()) > 0)

  await rehearsePath(page, 'fresh')
  await rehearseControls(page)

  // After Restart path already ends on step 1 — full path again
  await rehearsePath(page, 'after-Restart')

  await rehearseRecommendationPanel(page)
  await rehearsePrint(page)

  await browser.close()

  console.log('\n=== Summary ===')
  for (const r of results) {
    console.log(`${r.status}: ${r.step}${r.detail ? ` (${r.detail})` : ''}`)
  }
  const failed = results.filter((r) => r.status === 'Fail')
  const unverified = results.filter((r) => r.status === 'Not verified')
  console.log(`\n${results.length - failed.length - unverified.length}/${results.length} Pass · ${failed.length} Fail · ${unverified.length} Not verified`)
  console.log(`PDFs: ${OUT_DIR}`)
  process.exit(failed.length ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(2)
})
