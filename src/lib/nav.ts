// Nav is four items per the confirmed brief (Agency · Systems · Projects ·
// Contact) — this drops Resources from earlier plan/brief versions, which
// still has 72 redirect-map rows pointing at /resources/. Flagged upstream;
// Resources + Tech Refresh get a footer-only home until that's resolved.
export const navItems = [
  { label: 'Agency', href: '/agency/' },
  { label: 'Systems', href: '/systems/' },
  { label: 'Projects', href: '/projects/' },
  { label: 'Contact', href: '/contact/' },
]

// Figma's footer frame (node 770:875) breaks the old single "Resources"
// link into its actual sub-sections (Newsletter, Entrepreneur Spotlight)
// instead — replacing the flat Resources/Tech Refresh/Careers set above.
// Newsletter and Entrepreneur Spotlight routes don't exist yet; pointed at
// /resources/ sub-paths as the most likely eventual home.
export const footerItems = [
  { label: 'Newsletter', href: '/resources/newsletter/' },
  { label: 'Tech Refresh', href: '/tech-refresh/' },
  { label: 'Careers', href: '/careers/' },
  { label: 'Contact', href: '/contact/' },
]

export const socialItems = [
  { label: 'Facebook', href: 'https://www.facebook.com/wearefesagency' },
  { label: 'Linkedin', href: 'https://www.linkedin.com/company/wearefesagency' },
  { label: 'Instagram', href: 'https://instagram.com/wearefesagency' },
  { label: 'Behance', href: 'https://www.behance.net/wearefesagency' },
]

// Human labels for the URL segments that appear as intermediate crumbs in
// the BreadcrumbList structured data (see SEO.astro). The LAST crumb of any
// page is the page's own title, so only segments that have pages beneath
// them need an entry here; a path with an unlabelled intermediate segment
// gets no breadcrumb markup rather than a wrong one.
export const breadcrumbLabels: Record<string, string> = {
  systems: 'Systems',
  'creative-projects-blueprint': 'Creative Projects Blueprint',
  projects: 'Projects',
}
