// Case study detail pages (/projects/[slug]/). Static/hardcoded for now —
// not an Astro Content Collection yet — but shaped as an explicit interface
// so migrating to a collection later is a schema-for-schema swap, not a
// rebuild. See docs/parked-decisions.md if that migration adds constraints
// this file didn't anticipate.
//
// Image fields (clientLogo, coverImage, gallery[].src) are typed as plain
// strings, matching what a future content collection would store (an asset
// path), rather than astro:assets' ImageMetadata. The one example entry
// below has no real photography yet, so every image field is an empty
// string and the page falls back to PlaceholderBlock — the site's existing
// "photography not shot yet" component — rather than a broken <img>.

export interface CaseStudy {
  slug: string
  /**
   * Keeps the entry off search engines: renders `noindex, nofollow` in the
   * page's own <head>, and its path is excluded from the sitemap in
   * astro.config.mjs (submitting a URL you've marked noindex is a
   * contradiction Search Console reports as an error).
   *
   * Set on the template entry below, whose copy is placeholder text in
   * square brackets — indexed, it would put "[Client name] — [Case study
   * title...]" in front of anyone searching for FES. The route stays live
   * and reachable by URL, which is the point: it's the reference the real
   * entries get built against. Real case studies omit this field.
   */
  draft?: boolean
  clientName: string
  clientLogo: string
  title: string
  tagline: string
  coverImage: string
  industryTags: string[]
  systemsUsed: { name: string; slug: string }[] // links back to /systems/[slug]
  challenge: string
  scope: string
  duration: string
  approach: { step: string; title: string; description: string }[]
  metrics?: { value: string; label: string }[] // optional — some clients don't allow public numbers
  gallery: { src: string; alt: string }[]
  testimonial?: { quote: string; author: string; role: string }
  credits: { team: string[]; servicesUsed: string[] }
  prevProject?: { slug: string; title: string }
  nextProject?: { slug: string; title: string }
  relatedProjects: { slug: string; title: string; coverImage: string }[]
}

// One example entry, populated with placeholder copy written as an
// instruction for what belongs in each field — not lorem ipsum — per the
// case-study template brief. Swap for real content collection entries once
// this migrates off a hardcoded array.
export const caseStudies: CaseStudy[] = [
  {
    slug: 'example-case-study',
    draft: true,
    clientName: '[Client name]',
    clientLogo: '',
    title: '[Case study title — the outcome or campaign name, not just the client name]',
    tagline: '[One line describing what FES did and for whom, e.g. "Repositioning a fintech challenger ahead of its Series B"]',
    coverImage: '',
    industryTags: ['[Industry, e.g. Fintech]', '[Sub-sector, e.g. Payments]'],
    systemsUsed: [{ name: 'Influence & Reputation System', slug: 'influence-reputation' }],
    challenge:
      '[One to two sentences on the problem the client had before FES — what wasn\'t working, and why it mattered to their business.]',
    scope:
      '[What FES actually did — the services and Systems applied, written as a short direct sentence rather than a bullet dump.]',
    duration: '[e.g. "6 months" or "Ongoing since 2024"]',
    approach: [
      {
        step: '— 01',
        title: '[Step 1 title, e.g. "Reputation Strategy"]',
        description: '[One to two sentences on what happened in this step and why it came first.]',
      },
      {
        step: '— 02',
        title: '[Step 2 title]',
        description: '[One to two sentences on what happened in this step.]',
      },
      {
        step: '— 03',
        title: '[Step 3 title]',
        description: '[One to two sentences on what happened in this step.]',
      },
      {
        step: '— 04',
        title: '[Step 4 title]',
        description: '[One to two sentences on what happened in this step.]',
      },
    ],
    metrics: [
      { value: '[+XX%]', label: '[What this measures, e.g. "increase in earned media reach"]' },
      { value: '[N]', label: '[e.g. "press placements secured"]' },
      { value: '[€X.XM]', label: '[e.g. "in tracked pipeline influenced"]' },
      { value: '[+XX]', label: '[e.g. "qualified leads from campaign"]' },
    ],
    gallery: [
      { src: '', alt: '[Hero/lead image from the campaign — wide format]' },
      { src: '', alt: '[Supporting shot — product, event, or creative in context]' },
      { src: '', alt: '[Supporting shot — behind the scenes or detail crop]' },
    ],
    testimonial: {
      quote:
        '[A client quote specific to this project — what changed for them, in their own words. Omit the whole block if no quote was approved for publication.]',
      author: '[Full name]',
      role: '[Title @ Client company]',
    },
    credits: {
      team: ['[Team member name — role]', '[Team member name — role]', '[Team member name — role]'],
      servicesUsed: ['[Service, e.g. Media Relations]', '[Service, e.g. Executive Positioning]', '[Service, e.g. Content Production]'],
    },
    prevProject: { slug: 'blip-tedx', title: 'Blip x TEDx' },
    nextProject: { slug: 'coverflex', title: 'Coverflex' },
    relatedProjects: [
      { slug: 'dashlane', title: 'Dashlane', coverImage: '' },
      { slug: '10x-forward', title: '10x Forward', coverImage: '' },
      { slug: 'startup-portugal', title: 'Startup Portugal', coverImage: '' },
    ],
  },
]

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((c) => c.slug === slug)
}
