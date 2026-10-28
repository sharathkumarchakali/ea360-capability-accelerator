export function initLanding() {
  const header = document.querySelector('[data-landing-header]')
  const menuBtn = document.querySelector('[data-menu-toggle]')
  const mobileNav = document.querySelector('[data-mobile-nav]')

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      const open = mobileNav.hasAttribute('hidden')
      if (open) {
        mobileNav.removeAttribute('hidden')
        menuBtn.setAttribute('aria-expanded', 'true')
      } else {
        mobileNav.setAttribute('hidden', '')
        menuBtn.setAttribute('aria-expanded', 'false')
      }
    })

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileNav.setAttribute('hidden', '')
        menuBtn.setAttribute('aria-expanded', 'false')
      })
    })
  }

  if (header) {
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const id = anchor.getAttribute('href')
      if (!id || id === '#') return
      const target = document.querySelector(id)
      if (!target) return
      event.preventDefault()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      history.replaceState(null, '', id)
    })
  })
}
