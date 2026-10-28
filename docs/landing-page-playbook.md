# Landing Page Playbook

A reusable guide for building a landing page for any product, from brief to live site.
Work top to bottom: fill in the brief, write the copy, then design, build, check and ship.

---

## 1. Fill in the brief first

Don't open an editor until every line below has an answer. Most weak landing pages are weak because of a vague brief, not bad design.

```md
## Brief: <Product name>

- **One-line pitch:** <what it is + who it's for, under 15 words>
- **Primary audience:** <who exactly; their job, situation, or need>
- **Problem they have today:** <in their words, not yours>
- **What changes for them:** <the outcome, not the feature list>
- **Single goal of the page:** <one action: sign up / join waitlist / book demo / buy / download / contact>
- **Product status:** <live / beta / pre-launch, with date if known>
- **Proof available:** <customers, numbers, quotes, logos, press, team credentials; or "none yet">
- **Top 3 objections:** <price, trust, effort to switch, privacy, ...>
- **Competitors / alternatives:** <including "do nothing" or "spreadsheet">
- **Brand assets:** <logo, colors, fonts, photos, design system link>
- **Constraints:** <legal, privacy, regions, age limits, accessibility, budget>
- **Domain + hosting:** <where it will live>
- **Owner who approves copy:** <name>
```

Rule: **one page, one goal.** Every section either moves the visitor toward that action or answers an objection that stops them.

---

## 2. Page structure

Use this order as the default. Cut sections you have no honest content for. An empty testimonial block hurts more than no block.

| # | Section | Job | Must contain |
|---|---------|-----|--------------|
| 1 | **Header** | Orient and offer the exit to the goal | Logo, 2–4 anchor links max, primary CTA button |
| 2 | **Hero** | Say what it is and who it's for in 5 seconds | Headline, subhead, primary CTA, supporting visual |
| 3 | **Social proof strip** | Borrow trust early | Logos, a key number, or a short quote |
| 4 | **Problem** | Show you understand their situation | 2–3 pain points in the customer's language |
| 5 | **How it works** | Make it feel easy | 3 steps, each a verb + outcome |
| 6 | **Benefits / features** | Map features to outcomes | 3–6 blocks: outcome headline, one-line feature explanation |
| 7 | **Product visual / demo** | Show, don't tell | Real screenshot, short video, or interactive example |
| 8 | **Testimonials / case study** | Proof from people like them | Name, role, photo, a specific result |
| 9 | **Pricing** (if relevant) | Remove uncertainty | Plans, what's included, the recommended option highlighted |
| 10 | **FAQ** | Kill the top objections | 5–8 real questions with short, direct answers |
| 11 | **Final CTA** | Second chance to convert | Restated promise + the same primary CTA |
| 12 | **Footer** | Trust and legal | Contact, privacy policy, terms, socials, company info |

---

## 3. Copy formulas

### Headline (hero)
Pick one pattern:
- **Outcome:** "<Achieve X> without <pain Y>"
- **Category + audience:** "The <category> for <audience>"
- **Direct:** "<Verb> your <thing> in <time/effort>"

Test it: could a stranger tell **what it is** and **who it's for** from the headline plus subhead alone? If not, rewrite.

### Subhead
One or two sentences: how it works + the key differentiator. Plain words, no buzzwords.

### CTA buttons
- Verb + outcome: "Start free trial", "Join the waitlist", "Book a 15-min demo".
- Avoid "Submit", "Learn more", "Click here".
- Same primary CTA label everywhere on the page.
- Add a reassurance line under it when useful: "No credit card required", "Takes 2 minutes".

### Benefits
Write `Outcome → because → feature`:
> **Close your books in a day.** Bank feeds reconcile automatically every night.

### Writing rules
- Use the customer's words (from interviews, reviews, support tickets).
- Specific beats clever: "Save 6 hours a week" beats "Supercharge productivity".
- Short sentences. One idea per paragraph.
- Remove: "revolutionary", "seamless", "cutting-edge", "unlock", "leverage", "world-class".
- **Be honest about status.** If the product isn't live, say so and offer a waitlist or "notify me". Never show a sign-in or checkout that doesn't work.

---

## 4. Design

- **Use the brand's design system** (colors, type, spacing tokens) instead of inventing a look.
- **Visual hierarchy:** one dominant element per section; the CTA is the highest-contrast element on screen.
- **Typography:** max 2 font families; body text 16–18px; line length 60–75 characters.
- **Spacing:** generous whitespace between sections (64–120px desktop).
- **Imagery:** real product screens and real people beat stock photos and abstract 3D blobs.
- **Mobile first:** most traffic is on phones. Design the 375px layout before desktop.
- **Contrast:** text meets WCAG AA (4.5:1 body, 3:1 large text). Check button text against button color.
- **Consistency:** the same button style, radius and color for every primary CTA.

---

## 5. Build

### Recommended default: static HTML + CSS

For a single marketing page, plain files are the fastest, cheapest and most durable option.

```
landing/
├── index.html
├── privacy.html
├── site.css
├── fonts/        # self-hosted web fonts (woff2)
├── img/          # optimized images (WebP/AVIF/JPG)
└── .gitignore
```

Reach for a framework (Next.js, Astro, etc.) only when you need a CMS, many pages, localization, or app logic.

### Build checklist
- [ ] Semantic HTML: one `<h1>`, ordered headings, `<header> <main> <section> <footer>`.
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- [ ] Images: correct size, compressed, `width`/`height` set, `loading="lazy"` below the fold, meaningful `alt`.
- [ ] Fonts: self-hosted `woff2`, `font-display: swap`, preload the main font.
- [ ] No unnecessary third-party scripts (each one costs speed and privacy).
- [ ] Forms: labels on every field, clear errors, success state, spam protection, a working destination.
- [ ] Every link and button works; anchor links scroll to the right section.
- [ ] Favicon and app icons.

---

## 6. SEO and sharing

```html
<title>Product — one-line value proposition</title>
<meta name="description" content="150–160 characters that sell the click.">
<link rel="canonical" href="https://example.com/">

<meta property="og:title" content="Product — value proposition">
<meta property="og:description" content="Short description.">
<meta property="og:image" content="https://example.com/og.jpg"> <!-- 1200×630 -->
<meta property="og:url" content="https://example.com/">
<meta name="twitter:card" content="summary_large_image">
```

- [ ] `robots.txt` and `sitemap.xml` (if more than one page).
- [ ] Structured data (`Organization`, `Product`, `FAQPage`) where it applies.
- [ ] Preview the share card in a link-preview tool before launch.

---

## 7. Quality checks before launch

### Performance
- [ ] Lighthouse performance ≥ 90 on mobile.
- [ ] Largest Contentful Paint < 2.5s, Cumulative Layout Shift < 0.1.
- [ ] Total page weight ideally < 1.5 MB.

### Accessibility
- [ ] Keyboard-only: every control reachable, visible focus ring.
- [ ] Screen reader: images have alt text, buttons have names, dialogs trap focus and close with Esc.
- [ ] Respect `prefers-reduced-motion`.
- [ ] Lighthouse accessibility ≥ 95.

### Cross-device
- [ ] Phone (375px), tablet (768px), laptop (1280px), wide (1920px).
- [ ] Chrome, Safari (incl. iOS), Firefox, Edge.
- [ ] No horizontal scroll at any width.

### Content
- [ ] Spelling and grammar checked.
- [ ] Every claim is true and provable; numbers have a source.
- [ ] Product status, dates and pricing are current.
- [ ] Contact email/phone works.

### Legal and privacy
- [ ] Privacy policy linked in the footer (and next to any form).
- [ ] Cookie consent only if you set non-essential cookies; prefer cookie-free analytics.
- [ ] Terms of service if you take sign-ups or payments.
- [ ] Rights to every photo, font and logo used.

---

## 8. Version control and deploy

1. **Git from day one.** `git init`, commit the first working version, push to a **private** repo.
2. **Connect the host to the repo** (Vercel, Netlify or Cloudflare Pages):
   - Grant the host's GitHub App access to **this** repo, then connect it from the project's Git settings.
   - Confirm the link points at the right repository (similar names get mixed up).
   - Production branch = `main`.
3. **Preview, then promote:**
   - Every change goes on a branch → pull request → automatic preview URL.
   - Review the preview on desktop and phone.
   - Merge to `main` → production deploys.
4. **Rollback plan:** know how to redeploy the previous production build in one click.
5. **Custom domain:** add it in the host, set DNS, confirm HTTPS works on both `www` and the bare domain, redirect one to the other.

---

## 9. Measure and improve

- **Track one conversion:** the page's single goal (form submit, sign-up, click to checkout).
- **Privacy-friendly analytics** (e.g. Plausible, Fathom, Vercel Analytics) unless you need more.
- **UTM-tag** every link you share, so you know which channel converts.
- **Review weekly:** visits, conversion rate, where people drop off.
- **Test one thing at a time:** headline first, then CTA, then hero visual. Run each test until it has enough traffic to mean something.

Benchmarks (rough): 2–5% is a typical conversion rate for cold traffic; 10%+ is strong for warm traffic or waitlists.

---

## 10. Launch-day checklist

- [ ] Final copy approved by the owner.
- [ ] All checks in section 7 pass.
- [ ] Preview reviewed and merged; production URL loads.
- [ ] Test the conversion end to end on production (submit the form, receive the email).
- [ ] Analytics records the test conversion.
- [ ] Share card looks right when pasted into Slack / LinkedIn / X.
- [ ] Announce: email list, social, communities, partners.
- [ ] Watch errors and form submissions for the first 24 hours.

---

## Quick reference: one-page outline template

Copy this and fill it in as your first draft.

```md
# <Product> landing page — copy draft

## Hero
- Headline:
- Subhead:
- Primary CTA:
- Reassurance line:
- Visual:

## Proof strip
-

## Problem
1.
2.
3.

## How it works
1. <Verb> —
2. <Verb> —
3. <Verb> —

## Benefits
- **<Outcome>** — <feature that delivers it>
- **<Outcome>** —
- **<Outcome>** —

## Testimonial
> "<quote with a specific result>" — <Name>, <Role>, <Company>

## Pricing
-

## FAQ
- Q: | A:
- Q: | A:
- Q: | A:

## Final CTA
- Headline:
- CTA:

## Footer
- Contact:
- Links: Privacy · Terms
```
