// Case study detail pages (/projects/[slug]/). Static/hardcoded for now —
// not an Astro Content Collection yet — but shaped as an explicit interface
// so migrating to a collection later is a schema-for-schema swap, not a
// rebuild. See docs/parked-decisions.md if that migration adds constraints
// this file didn't anticipate.
//
// The page is two columns: a LEFT rail that stays fixed on screen for the
// whole scroll (logo, title, intro, systems) and a RIGHT column that
// scrolls past it. Everything in the left rail is a flat field on
// CaseStudy; everything in the right column is an ordered list of `blocks`,
// so a case study is composed rather than slotted into fixed sections.
//
// Images are referenced by BASENAME ONLY (`file: '01'`), not by path or
// import: [slug].astro resolves them against
// src/assets/case-studies/<slug>/ via import.meta.glob, matching any image
// extension. A basename with no file behind it yet renders the site's
// PlaceholderBlock naming the path it wants, so the page is layout-complete
// before the photography lands. See that folder's README.

/** One picture in a `media` block. */
export interface CaseStudyMedia {
  /**
   * Filename WITHOUT extension, inside src/assets/case-studies/<slug>/.
   * '01' matches 01.webp, 01.jpg, 01.png or 01.avif — whichever is there.
   */
  file: string
  alt: string
  /**
   * CSS `aspect-ratio` for the well the picture is cropped into
   * (object-cover). Defaults to 3/2 for a full-width picture and 3/4 for a
   * side-by-side pair.
   */
  aspect?: string
}

/** One labelled passage of copy in a `text` block. */
export interface CaseStudyPassage {
  /** Small grey kicker above the copy — omit for an unlabelled passage. */
  label?: string
  body: string
}

export type CaseStudyBlock =
  /**
   * Pictures. One item spans the full column; two sit side by side. More
   * than two wraps into the same two-up grid.
   */
  | { type: 'media'; items: CaseStudyMedia[] }
  /**
   * Copy. 'columns' (the default) lays passages two-up at --text-body;
   * 'full' runs a single passage across the whole column at --text-lead,
   * for a beat that should carry more weight than its neighbours.
   */
  | { type: 'text'; variant?: 'columns' | 'full'; items: CaseStudyPassage[] }

export interface CaseStudy {
  slug: string
  /**
   * Keeps the entry off search engines: renders `noindex, nofollow` in the
   * page's own <head>. A path marked draft must also be excluded from the
   * sitemap in astro.config.mjs — submitting a URL you've marked noindex is
   * a contradiction Search Console reports as an error. Real, finished case
   * studies omit this field.
   */
  draft?: boolean
  /** Left rail, line 1 of the title. */
  clientName: string
  /** Left rail, line 2 of the title. */
  title: string
  /**
   * Client logo above the title in the left rail, resolved from the same
   * case-study asset folder as the media blocks. Omit for no logo — the
   * title then sits at the top of the rail on its own.
   */
  logo?: { file: string; alt: string }
  /** Left rail intro, one string per paragraph. */
  intro: string[]
  /** Left rail footer — joined with " + ". */
  systems: string[]
  /** Meta description; falls back to the first intro paragraph. */
  seoDescription?: string
  blocks: CaseStudyBlock[]
}

export const caseStudies: CaseStudy[] = [
  {
    slug: 'we-want-you',
    clientName: 'Natixis',
    title: 'We Want You',
    // Natixis has a logo on disk (src/assets/logos/Logo_Natixis.png) but the
    // design runs this rail without one. Copy it into
    // src/assets/case-studies/we-want-you/ and add
    // `logo: { file: 'logo', alt: 'Natixis' }` to turn the slot on.
    intro: [
      'Natixis is a French investment bank that opened its doors in Portugal and wanted to attract new employees.',
      'To do this, FES Agency implemented different communication activities',
    ],
    systems: ['Branding Blueprint', 'Digital Communication System'],
    seoDescription:
      'An employer branding campaign built to attract talent to Natixis in Portugal — concept, visual identity, website, events and paid media.',
    blocks: [
      {
        type: 'media',
        items: [
          { file: 'natixis_wewantou-homepage', alt: 'The “We Want You” campaign homepage hero', aspect: '3 / 2' },
        ],
      },
      {
        // 1080×1350 — the same ratio as the post-1/post-2 pair below, so
        // this one runs side by side too.
        type: 'media',
        items: [
          {
            file: 'natixis_wewantou-logo-alternativo-1',
            alt: '“We Want You” wordmark on a dark background',
            aspect: '1080 / 1350',
          },
          {
            file: 'natixis_wewantou-logo-alternativo-2',
            alt: '“We Want You” wordmark on a magenta background',
            aspect: '1080 / 1350',
          },
        ],
      },
      {
        type: 'text',
        items: [
          {
            label: 'Concept & Naming Proposal',
            body:
              'The campaign was built around the impactful “We Want You” concept, aiming for a direct call to action. The focus was on individual identity and career opportunities within Natixis, creating a personal and engaging recruitment message.',
          },
          {
            label: 'Visual Identity',
            body:
              'The visual identity was carefully crafted to disrupt the previous graphic language and introduce a more modern, vibrant approach with Natixis’s original colors (purple, blue, and green). The typography was chosen to be neutral yet distinctive, aligning with platforms familiar to the younger audience, such as Snapchat and TikTok.',
          },
        ],
      },
      {
        type: 'media',
        items: [{ file: 'natixis_wewantou-mobile', alt: 'The “We Want You” careers site on mobile', aspect: '3 / 2' }],
      },
      {
        type: 'media',
        items: [
          {
            file: 'natixis_wewantou-site-3',
            alt: 'An overview of the “We Want You” careers site’s pages',
            aspect: '3 / 2',
          },
        ],
      },
      {
        type: 'text',
        variant: 'full',
        items: [
          {
            label: 'Website',
            body:
              'The website acted as the central hub for the campaign, offering potential applicants a streamlined experience to explore career opportunities. It featured a structured navigation to guide users through different areas like IT and banking, and introduced the “unlock your future” concept, reinforcing personalization and engagement. The website also supported SEO optimization and analytics to track performance.',
          },
        ],
      },
      {
        // The only pair on the page at their native aspect ratio (1080×1350):
        // every other pairing here was cropping non-matching ratios into a
        // shared box, so it's singles from here on except this one.
        type: 'media',
        items: [
          { file: 'natixis_wewantou-post-1', alt: 'A “We Want You” Instagram post promoting paid internships', aspect: '1080 / 1350' },
          { file: 'natixis_wewantou-post-2', alt: 'A “We Want You” Instagram post on choosing Natixis', aspect: '1080 / 1350' },
        ],
      },
      {
        type: 'media',
        items: [
          {
            file: 'natixis_wewantou-site-7',
            alt: 'Natixis’s office — the urban garden and mural-painted lounge',
            aspect: '3 / 2',
          },
        ],
      },
      {
        type: 'media',
        items: [
          {
            file: 'natixis_wewantou-site-1',
            alt: 'The careers site’s “How can I help?” department picker',
            aspect: '3 / 2',
          },
        ],
      },
      {
        type: 'media',
        items: [
          {
            file: 'natixis_wewantou-site-6',
            alt: 'The careers site’s “Are you the right fit?” page, with Natixis’s Top Employer accreditation',
            aspect: '3 / 2',
          },
        ],
      },
      {
        type: 'media',
        items: [
          {
            file: 'natixis_wewantou-stories',
            alt: 'Instagram Stories creative for the “We Want You” campaign',
            aspect: '3 / 2',
          },
        ],
      },
      {
        type: 'media',
        items: [
          {
            file: 'natixis_wewantou-stories-1',
            alt: 'The campaign’s tagline system: “To unlock your future,” “To make an impact” and more',
            aspect: '3 / 2',
          },
        ],
      },
      {
        type: 'text',
        items: [
          {
            label: 'Events',
            body:
              'One of the main events proposed was a hackathon, which aimed to engage students and professionals in the fintech space, focusing on creating sustainable banking solutions. Additionally, a series of university activations took place across Porto, Braga, and Aveiro, where students participated in the “Spin & Win Tour,” an engaging activity where they could win Natixis-branded goodies while learning about internship opportunities.',
          },
          {
            label: 'Paid Media Campaign',
            body:
              'A targeted paid media campaign was implemented to boost the reach of Natixis’s recruitment efforts. This included digital advertising and social media marketing, designed to raise awareness and attract talent to the company.',
          },
        ],
      },
    ],
  },
]

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((c) => c.slug === slug)
}
