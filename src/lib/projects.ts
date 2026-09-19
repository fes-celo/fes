// All Projects grid (/projects/) — separate from the homepage's
// featuredRow1/featuredRow2 (index.astro), which curate a fixed subset for
// the "Selected projects" section. This is the full list the ProjectsFilter
// taxonomy filters against.
//
// Category taxonomy and tag data aren't sourced from Figma (no per-project
// category/tag list was in the extracted content) — categories below are a
// reasonable placeholder assignment from each project's real subject matter
// so the filter has something real to filter, not an inferred source of
// truth. Tags are likewise placeholder labels (one per project, picked to
// vary rather than mean anything) so every card demonstrates the overlay
// pill until real per-project tag data exists — swap these for the real
// thing whenever it's available.
import type { ImageMetadata } from 'astro'
import weWantYou from '../assets/projects/we-want-you.png'
import weWantYouIcon from '../assets/projects/we-want-you-icon-icon.png'
import blipMediaRelations from '../assets/projects/Blip-media-relations.png'
import blipTedxIcon from '../assets/projects/Blip-icon.png'
import tenXForward from '../assets/projects/10x-forward.png'
import tenXForwardIcon from '../assets/projects/10x-forward-icon.svg'
import coverflexIcon from '../assets/projects/coverflex-icon.png'
import shamirPortugal from '../assets/projects/Shamir-portugal.png'
import startupPortugalProject from '../assets/projects/startup-portugal.png'
import startupPortugalProjectIcon from '../assets/projects/Startup Portugal-icon.png'
import startInsideOut from '../assets/projects/Start Inside Out.png'
import startCampusIcon from '../assets/projects/Start Campus-icon.png'

export interface Project {
  href: string
  title: string
  description: string
  /** Omitted for a project with no icon asset yet — ProjectCard drops the icon chip entirely. */
  icon?: ImageMetadata
  iconBg?: string
  /** Omitted for a project with no cover photo yet — ProjectCard renders its labelled placeholder instead. */
  thumbnail?: ImageMetadata
  tag?: string
  category: string[]
}

// First entry is the filter's implicit "show everything" option — its
// display label ("All Projects") is special-cased in ProjectsFilter, not
// stored here.
export const projectCategories = ['All', 'Startups & Scaleups', 'Enterprise', 'Public & Institutions']

export const projects: Project[] = [
  {
    href: '/projects/shamir-portugal/',
    title: 'Shamir Portugal | Strategic PR',
    description: 'PR and content to bring the brand closer to its audiences.',
    thumbnail: shamirPortugal,
    icon: coverflexIcon,
    iconBg: 'var(--color-neutral-50)',
    tag: 'Influence & Reputation System',
    category: ['Enterprise'],
  },
  {
    href: '/projects/start-campus/',
    title: 'Start Campus | Start Inside Out',
    description: 'A video series showing the people behind Start Campus.',
    thumbnail: startInsideOut,
    icon: startCampusIcon,
    iconBg: 'var(--color-neutral-50)',
    tag: 'Podcast & Video-Series',
    category: ['Enterprise'],
  },
  {
    href: '/projects/we-want-you/',
    title: 'Natixis In Portugal | We Want You',
    description: 'An employer branding campaign designed to attract talent.',
    thumbnail: weWantYou,
    icon: weWantYouIcon,
    iconBg: '#450E61',
    tag: 'Branding',
    category: ['Enterprise'],
  },
  {
    href: '/projects/startup-braga-10x-forward/',
    title: 'Startup Braga | 10x Forward',
    description: 'An interview series with voices from the startup world.',
    thumbnail: tenXForward,
    icon: tenXForwardIcon,
    iconBg: 'var(--color-neutral-50)',
    tag: 'Podcast & Video-Series',
    category: ['Startups & Scaleups'],
  },
  {
    href: '/projects/blip-media-relations/',
    title: 'Blip | Media Relations',
    description: "PR support across Portugal's tech and business media.",
    thumbnail: blipMediaRelations,
    icon: blipTedxIcon,
    iconBg: '#323F48',
    tag: 'Influence & Reputation System',
    category: ['Enterprise'],
  },
  {
    href: '/projects/sim-conference/',
    title: 'Startup Portugal | Social Media Boost',
    description: "Content and social media for Portugal's startup community.",
    thumbnail: startupPortugalProject,
    icon: startupPortugalProjectIcon,
    iconBg: '#E8DB37',
    tag: 'Digital Communication System',
    category: ['Startups & Scaleups'],
  },
  // The five entries below have no thumbnail/icon yet — ProjectCard renders
  // its labelled placeholder in place of a cover shot until real photography
  // lands, same pattern as the case-study media blocks (see caseStudies.ts).
  {
    href: '/projects/anchorage-digital/',
    title: 'Anchorage Digital | Portugal',
    description: 'Media relations that brought a global crypto platform into the Portuguese press.',
    tag: 'Influence & Reputation System',
    category: ['Enterprise'],
  },
  {
    href: '/projects/subvisual/',
    title: 'Subvisual | Alchemy Conf',
    description: 'Social media management and event promotion for a Web3 venture studio.',
    tag: 'Digital Communication System',
    category: ['Startups & Scaleups'],
  },
  {
    href: '/projects/data-makers-fest/',
    title: 'Data Makers Fest | Reddit Ads & Event Comms',
    description: 'PR and digital communication for a three-day data and AI conference in Porto.',
    tag: 'Digital Communication System',
    category: ['Startups & Scaleups'],
  },
  {
    href: '/projects/blip-activation/',
    title: 'Blip | Brand Activation',
    description: 'A brand activation campaign across outdoor advertising, paid media and more.',
    tag: 'Creative Projects Blueprint',
    category: ['Enterprise'],
  },
]
