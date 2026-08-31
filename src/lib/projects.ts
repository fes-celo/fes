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
import weWantYouIcon from '../assets/projects/we-want-you-icon.png'
import blipTedx from '../assets/projects/blip-tedx.png'
import blipTedxIcon from '../assets/projects/blip-tedx-icon.png'
import tenXForward from '../assets/projects/10x-forward.png'
import tenXForwardIcon from '../assets/projects/10x-forward-icon.svg'
import coverflex from '../assets/projects/coverflex.png'
import coverflexIcon from '../assets/projects/coverflex-icon.png'
import dashlane from '../assets/projects/dashlane.png'
import dashlaneIcon from '../assets/projects/dashlane-icon.png'
import startupPortugalProject from '../assets/projects/startup-portugal.png'
import startupPortugalProjectIcon from '../assets/projects/startup-portugal-icon.png'

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
export const projectCategories = [
  'All',
  'Fintech',
  'Public',
  'Startups',
  'Enterprise',
  'Community',
  'Events',
  'Impact',
]

export const projects: Project[] = [
  {
    href: '/projects/we-want-you/',
    title: 'We Want You',
    description: 'A concept creation, dedicated website and campaigns.',
    thumbnail: weWantYou,
    icon: weWantYouIcon,
    iconBg: '#450E61',
    tag: 'Campaign',
    category: ['Fintech', 'Enterprise'],
  },
  {
    href: '/projects/blip-tedx/',
    title: 'Blip x TEDx',
    description: 'We help startups, tech companies and disruptive businesses',
    thumbnail: blipTedx,
    icon: blipTedxIcon,
    iconBg: '#323F48',
    tag: 'Video-series',
    category: ['Startups', 'Events'],
  },
  {
    href: '/projects/10x-forward/',
    title: '10x Forward',
    description: 'We help startups, tech companies and disruptive businesses',
    thumbnail: tenXForward,
    icon: tenXForwardIcon,
    iconBg: 'var(--color-neutral-50)',
    tag: 'Case study',
    category: ['Startups', 'Public', 'Community'],
  },
  {
    href: '/projects/coverflex/',
    title: 'Coverflex',
    description: 'We help startups, tech companies and disruptive businesses',
    thumbnail: coverflex,
    icon: coverflexIcon,
    iconBg: 'var(--color-neutral-50)',
    tag: 'Brand film',
    category: ['Fintech', 'Enterprise', 'Events'],
  },
  {
    href: '/projects/dashlane/',
    title: 'Dashlane',
    description: 'A concept creation, dedicated website and campaigns.',
    thumbnail: dashlane,
    icon: dashlaneIcon,
    iconBg: '#09363F',
    tag: 'Web design',
    category: ['Enterprise', 'Fintech'],
  },
  {
    href: '/projects/startup-portugal/',
    title: 'Startup Portugal',
    description: 'We help startups, tech companies and disruptive businesses',
    thumbnail: startupPortugalProject,
    icon: startupPortugalProjectIcon,
    iconBg: '#E8DB37',
    tag: 'Social',
    category: ['Public', 'Startups', 'Community'],
  },
]
