/**
 * Browser rehearsal for BoG payment resilience (7 min) playlist.
 * Reports verified / not verified per beat. Not a substitute for presenter sign-off.
 */
import { chromium } from 'playwright'

const BASE = process.env.EA360_BASE || 'http://127.0.0.1:4173/app/'
const results = []

function record(step, ok, detail = '') {
  results.push({ step, status: ok ? 'verified' : 'not verified', detail })
  console.log(`${ok ? 'VERIFIED' : 'NOT VERIFIED'} — ${step}${detail ? `: ${detail}` : ''}`)
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
  // Allow preparing to appear after a transition, then clear.
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

async function currentTitle(page) {
  return (await page.locator('.demo-tour-bar__title').textContent())?.trim() || ''
}

async function uiSnapshot(page) {
  return page.evaluate(() => {
    const askOpen = Boolean(document.querySelector('.ask-root'))
    const tourActive = Boolean(document.querySelector('.demo-tour-bar'))
    const title = document.querySelector('.demo-tour-bar__title')?.textContent?.trim() || ''
    const count = document.querySelector('.demo-tour-bar__count')?.textContent?.trim() || ''
    const alert = document.querySelector('.demo-tour-bar__alert')?.textContent?.trim() || ''
    const detail =
      document.querySelector('.drawer-root [data-demo-target="entity-detail"]') ||
      document.querySelector('[data-demo-target="entity-detail"]')
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
    const toast = [...document.querySelectorAll('.toast, .ea-toast, [class*="toast"]')]
      .map((el) => el.textContent?.trim())
      .filter(Boolean)
    const hash = window.location.hash.replace('#', '') || 'executive'
    return {
      askOpen,
      tourActive,
      title,
      count,
      alert,
      selectedId,
      selectedType,
      graphRootLabel,
      scenarioLabel,
      main,
      toast,
      hash,
      graphNodes: document.querySelectorAll('[data-demo-target="graph-node"]').length,
      edges: document.querySelectorAll('.react-flow__edge-path').length,
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

async function closeAsk(page) {
  await page.evaluate(() => {
    const btn =
      document.querySelector('.ask-root button[aria-label="Close"]') ||
      document.querySelector('.ask-root .drawer-backdrop')
    if (btn) btn.click()
  })
  await page.waitForTimeout(250)
}

async function startPlaylist(page) {
  await closeAsk(page)
  await page.evaluate(() => {
    window.location.hash = 'demo-studio'
  })
  await page.waitForSelector('[data-demo-target="demo-studio"]', { timeout: 8000 })
  const card = page.locator('.ds-card', { hasText: 'BoG payment resilience (7 min)' })
  await card.waitFor({ state: 'visible', timeout: 8000 })
  const status = await card.locator('.status-tag').first().textContent()
  if (!/Ready/i.test(status || '')) throw new Error(`Playlist not Ready (${status})`)
  await card.getByRole('button', { name: /Start playlist/i }).click({ force: true })
  await waitReady(page, { expectTitle: 'Enterprise health' })
  await page.waitForSelector('[data-demo-target="executive-health"]', { timeout: 8000 }).catch(() => null)
}

async function rehearsePath(page, label) {
  console.log(`\n=== Rehearsal: ${label} ===`)
  await startPlaylist(page)

  let snap = await uiSnapshot(page)
  record(
    `${label} / cockpit`,
    /Enterprise health/i.test(snap.title) &&
      (snap.hash === 'executive' || snap.hash === '' || snap.hash === 'demo-studio') &&
      !snap.askOpen &&
      !snap.alert,
    `title="${snap.title}" hash=${snap.hash} askOpen=${snap.askOpen}`,
  )

  await advance(page, 'Open the interface')
  snap = await uiSnapshot(page)
  record(
    `${label} / RTGS-to-oversight interface (int-bog-12)`,
    /Open the interface/i.test(snap.title) &&
      snap.hash === 'integrations' &&
      snap.selectedId === 'int-bog-12' &&
      /Retail Oversight/i.test(snap.main) &&
      !snap.askOpen,
    `title="${snap.title}" sel=${snap.selectedId} askOpen=${snap.askOpen}`,
  )
  record(
    `${label} / interface name visible (not SWIFT substitute)`,
    /Retail Oversight/i.test(snap.main),
    /SWIFT Gateway/i.test(snap.main) && !/Retail Oversight/i.test(snap.main)
      ? 'SWIFT copy dominant'
      : 'oversight path present',
  )

  await advance(page, 'Dependency graph')
  await page.waitForSelector('[data-demo-target="graph-node"]', { timeout: 10000 })
  snap = await uiSnapshot(page)
  record(
    `${label} / graph rooted at int-bog-12`,
    /Dependency graph/i.test(snap.title) &&
      snap.hash === 'explorer' &&
      /Retail Oversight|RTGS/i.test(snap.graphRootLabel || '') &&
      /Payment-System Resilience|Payment/i.test(snap.scenarioLabel || snap.main) &&
      snap.graphNodes > 0 &&
      snap.edges > 0 &&
      !snap.askOpen,
    `root="${snap.graphRootLabel}" scenario="${snap.scenarioLabel}" nodes=${snap.graphNodes} edges=${snap.edges}`,
  )

  await advance(page, 'Supporting evidence')
  snap = await uiSnapshot(page)
  record(
    `${label} / evidence`,
    /Supporting evidence/i.test(snap.title) && snap.hash === 'evidence' && snap.selectedId === 'ev-bog-06',
    `title="${snap.title}" sel=${snap.selectedId}`,
  )

  await advance(page, 'Decision with conditions')
  snap = await uiSnapshot(page)
  record(
    `${label} / recorded conditional decision`,
    /Decision with conditions/i.test(snap.title) &&
      (snap.hash === 'decisions' || snap.hash === 'governance') &&
      snap.selectedId === 'dec-bog-02' &&
      /Approved with Conditions|Conditional approval/i.test(snap.main),
    `title="${snap.title}" hash=${snap.hash} sel=${snap.selectedId}`,
  )

  await advance(page, 'Initiative and delivery')
  snap = await uiSnapshot(page)
  record(
    `${label} / delivery owner`,
    /Initiative and delivery/i.test(snap.title) &&
      snap.hash === 'roadmap' &&
      snap.selectedId === 'init-bog-03' &&
      /Payment-system resilience/i.test(snap.main),
    `title="${snap.title}" sel=${snap.selectedId}`,
  )

  await advance(page, 'Executive briefing')
  snap = await uiSnapshot(page)
  record(
    `${label} / decision brief step ready`,
    /Executive briefing/i.test(snap.title) && !snap.askOpen,
    `title="${snap.title}" askOpen=${snap.askOpen}`,
  )
  await page.locator('.demo-tour-btn--primary', { hasText: /Finish/ }).click({ force: true })
  await page.waitForTimeout(800)
  snap = await uiSnapshot(page)
  const genericToast = (snap.toast || []).some((t) => /Journey complete/i.test(t))
  record(
    `${label} / ends on decision brief (not generic toast)`,
    snap.askOpen === true && snap.tourActive === false && !genericToast,
    `askOpen=${snap.askOpen} tourActive=${snap.tourActive} toasts=${JSON.stringify(snap.toast).slice(0, 120)}`,
  )
}

async function rehearseControls(page) {
  console.log('\n=== Controls: Back / Retry / Restart / Ask closed ===')
  await startPlaylist(page)
  await advance(page, 'Open the interface')
  const afterFirst = await currentTitle(page)
  await page.getByRole('button', { name: 'Back' }).click({ force: true })
  await waitReady(page, { expectTitle: 'Enterprise health' })
  const afterBack = await currentTitle(page)
  record(
    'Back returns to previous step',
    /Enterprise health/i.test(afterBack) && /Open the interface/i.test(afterFirst),
    `${afterFirst} -> ${afterBack}`,
  )

  await advance(page, 'Open the interface')
  await page.getByRole('button', { name: /More/ }).click({ force: true })
  await page.getByRole('menuitem', { name: /Retry step/ }).click({ force: true })
  await waitReady(page, { expectTitle: 'Open the interface' })
  let snap = await uiSnapshot(page)
  record(
    'Retry re-applies without opening Ask',
    /Open the interface/i.test(snap.title) && !snap.askOpen && snap.selectedId === 'int-bog-12',
    `title="${snap.title}" sel=${snap.selectedId} askOpen=${snap.askOpen}`,
  )

  await page.getByRole('button', { name: /More/ }).click({ force: true })
  await page.getByRole('menuitem', { name: /Restart walkthrough/ }).click({ force: true })
  await waitReady(page, { expectTitle: 'Enterprise health' })
  snap = await uiSnapshot(page)
  record(
    'Restart returns to step 1 with Ask closed',
    /Enterprise health/i.test(snap.title) && !snap.askOpen && /^1 of /i.test(snap.count),
    `title="${snap.title}" count=${snap.count} askOpen=${snap.askOpen}`,
  )
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await context.addInitScript(() => {
    try {
      localStorage.clear()
    } catch {
      /* ignore */
    }
  })
  const page = await context.newPage()
  page.on('dialog', (d) => d.accept())

  await page.goto(BASE, { waitUntil: 'networkidle' })
  const landing = page.getByRole('dialog', { name: 'EA360' })
  await landing.getByLabel('Organisation').selectOption('BOG')
  await landing.getByRole('button', { name: /Explore EA360/i }).click()
  await page.waitForSelector('.executive-cockpit, [data-demo-target="executive-health"]', { timeout: 10000 })
  record('Fresh session lands on BoG cockpit', true, 'Explore EA360')

  await page.evaluate(() => {
    window.location.hash = 'demo-studio'
  })
  await page.waitForSelector('[data-demo-target="demo-studio"]')
  for (const [label, re] of [
    ['J4 unavailable for BoG', /Data trust/i],
    ['J5 unavailable for BoG', /Technology lifecycle/i],
    ['J6 unavailable for BoG', /Governed AI/i],
  ]) {
    const card = page.locator('.ds-card', { hasText: re })
    const status = await card.locator('.status-tag').first().textContent()
    record(label, /Unavailable/i.test(status || ''), status || '')
  }

  await rehearsePath(page, 'fresh')
  await rehearseControls(page)

  await page.setViewportSize({ width: 1280, height: 720 })
  const presentationBtn = page.locator('button', { hasText: /Presentation mode/i }).first()
  if (await presentationBtn.count()) {
    const pressed = await presentationBtn.getAttribute('aria-pressed')
    if (pressed !== 'true') await presentationBtn.click({ force: true })
  }
  await rehearsePath(page, 'screen-share 1280x720')

  await browser.close()
  const failed = results.filter((r) => r.status !== 'verified')
  console.log('\n=== Summary ===')
  for (const r of results) {
    console.log(`${r.status.toUpperCase()}: ${r.step}${r.detail ? ` (${r.detail})` : ''}`)
  }
  console.log(`\n${results.length - failed.length}/${results.length} verified`)
  process.exit(failed.length ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(2)
})
