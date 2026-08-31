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
  { label: 'Entrepreneur Spotlight', href: '/resources/entrepreneur-spotlight/' },
  { label: 'Tech Refresh', href: '/tech-refresh/' },
  { label: 'Careers', href: '/careers/' },
  { label: 'Contact', href: '/contact/' },
]

// TODO: real profile URLs aren't documented anywhere in the project yet —
// these are placeholders until FES Agency's actual social links are
// confirmed.
export const socialItems = [
  { label: 'Facebook', href: '#' },
  { label: 'Linkedin', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'Behance', href: '#' },
]
