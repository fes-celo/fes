// Nav is four items (Systems · Projects · Agency · Contact) — this drops
// Resources from earlier plan/brief versions, which still has 72
// redirect-map rows pointing at /resources/. Flagged upstream; Resources +
// Tech Refresh get a footer-only home until that's resolved.
export const navItems = [
  { label: 'Systems', href: '/systems/' },
  { label: 'Projects', href: '/projects/' },
  { label: 'Agency', href: '/agency/' },
  { label: 'Contact', href: '/contact/' },
]

// Figma's footer frame (node 770:875) breaks the old single "Resources"
// link into its actual sub-sections (Newsletter, Entrepreneur Spotlight)
// instead — replacing the flat Resources/Tech Refresh/Careers set above.
// Newsletter is the Brevo-hosted signup form (sibforms.com), opened in a new
// tab — the signup, its consent and the list all live in Brevo, and the
// Privacy Policy's Newsletter section describes it (parked-decisions §55).
// Entrepreneur Spotlight has no route yet.
export const footerItems: { label: string; href: string; external?: boolean }[] = [
  {
    label: 'Newsletter',
    href: 'https://5b92cb13.sibforms.com/serve/MUIFAAZ_TCVC95Q0CuPWclmdx16q-g0LhAFrHc0TsQoUvhU_zW4Cak2Jrmf06KV-N1TIxFA9Zc9FRGIREV6u_iNfE0WfdksPKOBXdvVjhgShLtTACyVusulQ0B6r6ynhsM3SEkmBcsNK-Xl35IGVXvyn71NaWRGjLLdWT9j9D1GKEDc8TlG108zAn7SnwRNx2GVH2hfTn6_Pnr2MVg==',
    external: true,
  },
  { label: 'Tech Refresh', href: '/tech-refresh/' },
  { label: 'Careers', href: '/careers/' },
  { label: 'Contact', href: '/contact/' },
]

export const socialItems = [
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

// Every navItems href is a section root ('/systems/', '/agency/', …), so
// `startsWith` marks "Systems" active for its sub-pages too
// (/systems/creative-projects-blueprint/branding/) rather than only the
// exact index. None of navItems is '/', so this never falsely matches the
// homepage.
export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href)
}
