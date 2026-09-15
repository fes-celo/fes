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
import blipTedx from '../assets/projects/blip-tedx.png'
import blipTedxIcon from '../assets/projects/Blip-icon.png'
import tenXForward from '../assets/projects/10x-forward.png'
import tenXForwardIcon from '../assets/projects/10x-forward-icon.svg'
import coverflexIcon from '../assets/projects/coverflex-icon.png'
import shamirPortugal from '../assets/projects/Shamir-portugal.png'
import dashlane from '../assets/projects/dashlane.png'
import dashlaneIcon from '../assets/projects/dashlane-icon.png'
import startupPortugalProject from '../assets/projects/startup-portugal.png'
import startupPortugalProjectIcon from '../assets/projects/Startup Portugal-icon.png'

export interface Project {
  href: string
  title: string
  description: string
  icon: ImageMetadata
  iconBg?: string
  thumbnail: ImageMetadata
  tag?: string
  category: string[]
}

// First entry is the filter's implicit "show everything" option — its
// display label ("All Projects") is special-cased in ProjectsFilter, not
// stored here.
export const projectCategories = ['All', 'Startups & Scaleups', 'Enterprise', 'Public & Institutions']

export const projects: Project[] = [
  {
    href: '/projects/we-want-you/',
    title: 'Natixis | We Want you',
    description: 'An employer branding campaign designed to attract talent.',
    thumbnail: weWantYou,
    icon: weWantYouIcon,
    iconBg: '#450E61',
    tag: 'Branding',
    category: ['Enterprise'],
  },
  {
    href: '/projects/blip-media-relations/',
    title: 'Blip | Media Relations',
    description: "PR support across Portugal's tech and business media.",
    thumbnail: blipTedx,
    icon: blipTedxIcon,
    iconBg: '#323F48',
    tag: 'Influence & Reputation System',
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
    href: '/projects/shamir-portugal/',
    title: 'Shamir Portugal',
    description: 'PR and content to bring the brand closer to its audiences.',
    thumbnail: shamirPortugal,
    icon: coverflexIcon,
    iconBg: 'var(--color-neutral-50)',
    tag: 'Influence & Reputation System',
    category: ['Enterprise'],
  },
  {
    href: '/projects/dashlane/',
    title: 'Dashlane',
    description: 'A concept creation, dedicated website and campaigns.',
    thumbnail: dashlane,
    icon: dashlaneIcon,
    iconBg: '#09363F',
    tag: 'Web design',
    category: ['Enterprise'],
  },
  {
    href: '/projects/sim-conference/',
    title: 'SIM Conference | Social Media Boost',
    description: "Content and social media for Portugal's startup community.",
    thumbnail: startupPortugalProject,
    icon: startupPortugalProjectIcon,
    iconBg: '#E8DB37',
    tag: 'Digital Communication System',
    category: ['Startups & Scaleups'],
  },
]
