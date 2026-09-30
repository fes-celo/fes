// Client logos shown in the "Trusted by" / "Some of our favourite clients"
// marquee. Lives here rather than in each page because the homepage and the
// Agency page render the same set through the same LogoMarquee component.
import logo351 from '../assets/logos/Logo_351-Community.png'
import logoBlip from '../assets/logos/Logo_Blip.png'
import logoCmp from '../assets/logos/Logo_CMP.png'
import logoDataMakers from '../assets/logos/Logo_Data-makers-fest.png'
import logoInfraspeak from '../assets/logos/Logo_Infraspeak.png'
import logoNatixis from '../assets/logos/Logo_Natixis.png'
import logoStcp from '../assets/logos/Logo_STCP.png'
import logoScaleUpPorto from '../assets/logos/Logo_ScaleUp Porto.png'
import logoShamir from '../assets/logos/Logo_Shamir.png'
import logoSogrape from '../assets/logos/Logo_sogrape.png'
import logoSonae from '../assets/logos/Logo_Sonae.png'
import logoStartCampus from '../assets/logos/Logo_Start Campus.png'
import logoStartupBraga from '../assets/logos/Logo_Startup Braga.png'
import logoStartupPortugal from '../assets/logos/Logo_Startup Portugal.png'
import logoSubvisual from '../assets/logos/Logo_Subvisual.png'
import logoXgeeks from '../assets/logos/Logo_xgeeks.png'

// `scale` is an optical correction, not a size: every logo is first fitted to
// the same 170×56 box, which leaves wide wordmarks thin and dense, heavy marks
// loud. Values were set by equalising each logo's inked area (transparent
// margins trimmed, weighted by how much of that area is ink), then judged by
// eye side by side — framed or very heavy marks (CMP, Blip, xgeeks) sit a
// little under the formula. Re-check the whole set when a logo is added.
export const clientLogos = [
  { src: logo351, name: '351 Community', scale: 0.9 },
  { src: logoBlip, name: 'Blip', scale: 0.8 },
  { src: logoCmp, name: 'CMP', scale: 0.95 },
  { src: logoDataMakers, name: 'Data Makers Fest', scale: 1.05 },
  { src: logoInfraspeak, name: 'Infraspeak', scale: 1.05 },
  { src: logoNatixis, name: 'Natixis', scale: 1.1 },
  { src: logoStcp, name: 'STCP', scale: 0.95 },
  { src: logoScaleUpPorto, name: 'ScaleUp Porto', scale: 1.05 },
  { src: logoShamir, name: 'Shamir', scale: 0.9 },
  { src: logoSogrape, name: 'Sogrape', scale: 1.08 },
  { src: logoSonae, name: 'Sonae', scale: 0.75 },
  { src: logoStartCampus, name: 'Start Campus', scale: 0.92 },
  { src: logoStartupBraga, name: 'Startup Braga', scale: 0.85 },
  { src: logoStartupPortugal, name: 'Startup Portugal', scale: 0.82 },
  { src: logoSubvisual, name: 'Subvisual' },
  { src: logoXgeeks, name: 'xgeeks', scale: 0.82 },
]
