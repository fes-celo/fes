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
  {
    slug: 'shamir-portugal',
    clientName: 'Shamir Portugal',
    // Dropped the docx's trailing "Portugal" from this line — the client
    // name above already carries it, and repeating it read as a typo in the
    // rail's two-line title. See parked-decisions.md §27.
    title: 'Strategic PR',
    intro: [
      'Shamir Optical is a global company specialising in the development and production of advanced lenses for the optical industry.',
      'FES Agency implemented its Influence & Reputation System to represent Shamir in the Portuguese media, building an ongoing communication presence around the brand, its expertise and key moments.',
    ],
    systems: ['Influence & Reputation System'],
    seoDescription: 'PR and content to bring Shamir Portugal closer to its audiences — media relations, expertise content and brand milestones.',
    blocks: [
      {
        type: 'media',
        items: [{ file: 'cover', alt: 'Shamir Portugal — cover photo', aspect: '3 / 2' }],
      },
      {
        type: 'text',
        items: [
          {
            label: 'Media Relations',
            body:
              'Ongoing media relations keep Shamir connected to the Portuguese media, identifying opportunities for the brand to share news, products and relevant industry topics.',
          },
          {
            label: 'Content & Expertise',
            body:
              'Communication also brings Shamir’s knowledge and expertise into the conversation, creating content and media opportunities around vision, innovation and the optical industry.',
          },
          {
            label: 'Brand Milestones',
            body:
              'Awards, launches and other relevant company moments are used to create new communication opportunities and maintain a consistent presence for Shamir in Portugal.',
          },
        ],
      },
    ],
  },
  {
    slug: 'anchorage-digital',
    clientName: 'Anchorage Digital',
    title: 'Portugal',
    intro: [
      'Anchorage Digital is a digital asset platform for institutions and the first crypto unicorn with Portuguese DNA, founded by Diogo Mónica and Nathan McCauley.',
      'FES Agency implemented its Influence & Reputation System to build Anchorage Digital’s presence in Portugal, turning a complex industry into relevant stories for the Portuguese media.',
    ],
    systems: ['Influence & Reputation System'],
    seoDescription: 'Media relations that turned a complex crypto story into national Portuguese media coverage for Anchorage Digital.',
    blocks: [
      {
        type: 'media',
        items: [{ file: 'cover', alt: 'Anchorage Digital — cover photo', aspect: '3 / 2' }],
      },
      {
        type: 'text',
        items: [
          {
            label: 'Media Relations',
            body:
              'The challenge was clear: how to communicate the complex crypto world to a wider audience? Media relations focused on making Anchorage Digital’s activity and the digital asset space more accessible, while bringing the company into some of Portugal’s leading media outlets.',
          },
          {
            label: 'Company Milestones',
            body:
              'Major company announcements created regular opportunities to keep Anchorage Digital in the media conversation. From partnerships with companies such as Visa to the creation of the first federally chartered crypto bank in the US, key milestones were used to tell the company’s story and reinforce its position in a fast moving industry.',
          },
          {
            label: 'Profile Building',
            body:
              'Anchorage Digital’s Portuguese connection and the expertise of its leadership also created opportunities to go beyond company announcements, positioning its people as relevant voices on crypto, digital assets and the evolution of the sector.',
          },
        ],
      },
    ],
  },
  {
    slug: 'subvisual',
    clientName: 'Subvisual',
    title: 'Alchemy Conf',
    intro: [
      'Subvisual is a software company and venture studio from Portugal, working at the intersection of technology, products and Web3.',
      'FES Agency implemented its Digital Communication System to manage its social presence and support the promotion of Alchemy Conf.',
    ],
    systems: ['Digital Communication System'],
    seoDescription: 'Social media management and event promotion for Subvisual, a Portuguese software company and venture studio.',
    blocks: [
      {
        type: 'media',
        items: [{ file: 'cover', alt: 'Subvisual — cover photo', aspect: '3 / 2' }],
      },
      {
        type: 'text',
        items: [
          {
            label: 'Social Media',
            body:
              'Social media management covered both established and emerging platforms, including Bluesky and Farcaster, adapting communication to the communities where Subvisual operates.',
          },
          {
            label: 'Alchemy Conf',
            body:
              'Digital communication was also used to promote Alchemy Conf, connecting the event with relevant audiences and driving traffic to its website.',
          },
          {
            label: 'Performance',
            body: 'The campaign generated more than 3,000 sessions to the Alchemy Conf event page.',
          },
        ],
      },
    ],
  },
  {
    slug: 'data-makers-fest',
    clientName: 'Data Makers Fest',
    title: 'Reddit Ads & Event Comms',
    intro: [
      'Data Makers Fest is a three day event in Porto bringing together the data science, AI, machine learning and data engineering community.',
      'FES Agency implemented two complementary systems, combining digital communication and PR to build awareness around the event, engage its community and extend its reach before, during and after Data Makers Fest.',
    ],
    systems: ['Digital Communication System', 'Influence & Reputation System'],
    seoDescription: 'Digital communication and PR for Data Makers Fest — media relations, social media and a Reddit Ads campaign.',
    blocks: [
      {
        type: 'media',
        items: [{ file: 'cover', alt: 'Data Makers Fest — cover photo', aspect: '3 / 2' }],
      },
      {
        type: 'text',
        items: [
          {
            label: 'Public Relations',
            body:
              'PR support covered the full event cycle, with media relations before, during and after Data Makers Fest to generate awareness, create media opportunities and extend the conversation beyond the event itself.',
          },
          {
            label: 'Social Media',
            body:
              'Organic social media coverage brought Data Makers Fest to its digital community in real time, sharing key moments, speakers and what was happening throughout the event.',
          },
          {
            label: 'Reddit Ads Campaign',
            body:
              'A Reddit Ads campaign targeted data communities across Portugal, Spain and the Netherlands, reaching audiences already interested in the topics at the heart of Data Makers Fest.',
          },
          {
            label: 'Performance',
            body:
              'The campaign generated 10,168 clicks at a €0.23 CPC, driving traffic to the event and contributing to 11 attributed purchases.',
          },
        ],
      },
    ],
  },
  {
    slug: 'blip-media-relations',
    clientName: 'Blip',
    title: 'Tech Leadership',
    intro: [
      'Blip is a Portuguese technology company based in Porto, developing software products for the online gaming industry.',
      'FES Agency implemented its Influence & Reputation System to keep Blip connected to the Portuguese media and reinforce its presence as one of the country’s established tech companies.',
    ],
    systems: ['Influence & Reputation System'],
    seoDescription: 'PR support across Portugal’s tech and business media, positioning Blip and its people as tech leaders.',
    blocks: [
      {
        type: 'media',
        items: [{ file: 'cover', alt: 'Blip — cover photo', aspect: '3 / 2' }],
      },
      {
        type: 'text',
        items: [
          {
            label: 'Media Relations',
            body:
              'Ongoing media relations create opportunities around Blip’s company news, projects and activity, maintaining a regular presence in the Portuguese media.',
          },
          {
            label: 'People & Culture',
            body:
              'Blip’s people, culture and approach to work provide another side of the company’s story, opening opportunities around talent, employer branding and the way its teams work.',
          },
          {
            label: 'Tech Expertise',
            body:
              'The company’s technological expertise also creates opportunities to bring Blip and its people into relevant conversations around technology and the evolution of the sector.',
          },
        ],
      },
    ],
  },
  {
    slug: 'blip-activation',
    // No source copy exists yet for this one — Blip.docx only covers PR
    // (folded into the `blip-media-relations` case study above). Marcelo
    // asked for the card to ship now with placeholder copy and this page to
    // stay noindexed until the real activation write-up (mupis, paid media)
    // lands. See parked-decisions.md §27.
    draft: true,
    clientName: 'Blip',
    title: 'Brand Activation',
    intro: [
      'Blip is a Portuguese technology company based in Porto, developing software products for the online gaming industry.',
      'FES Agency ran a brand activation campaign for Blip, including outdoor advertising (mupis) and paid media.',
    ],
    systems: ['Creative Projects Blueprint'],
    seoDescription: 'A brand activation campaign for Blip — outdoor advertising, paid media and more.',
    blocks: [
      {
        type: 'media',
        items: [{ file: 'cover', alt: 'Blip — cover photo', aspect: '3 / 2' }],
      },
      {
        type: 'text',
        variant: 'full',
        items: [
          {
            label: 'Activation Campaign',
            body: 'TODO(marcelo): replace with the real campaign copy — outdoor (mupis), paid media placements and any results to report.',
          },
        ],
      },
    ],
  },
]

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((c) => c.slug === slug)
}
