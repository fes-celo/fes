// Client logos shown in the "Trusted by" / "Some of our favourite clients"
// marquee. Lives here rather than in each page because the homepage and the
// Agency page render the same set through the same LogoMarquee component.
import logoInfraspeak from '../assets/logos/infraspeak.png'
import logoStartupPortugal from '../assets/logos/startup-portugal.png'
import logoSonae from '../assets/logos/sonae.png'
import logoNatixis from '../assets/logos/natixis.png'
import logoSubvisual from '../assets/logos/subvisual.png'
import logoSogrape from '../assets/logos/sogrape.svg'

export const clientLogos = [
  { src: logoInfraspeak, name: 'Infraspeak' },
  { src: logoStartupPortugal, name: 'Startup Portugal' },
  { src: logoSonae, name: 'Sonae' },
  { src: logoNatixis, name: 'Natixis' },
  { src: logoSubvisual, name: 'Subvisual' },
  { src: logoSogrape, name: 'Sograpé' },
]
