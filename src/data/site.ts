export interface HospitalInfo {
  name: string
  shortName: string
  tagline: string
  foundedYear: number
  email: string
  domains: { primary: string; secondary: string }
  phones: { emergency: string; ambulance: string; appointment: string; reception: string }
  address: { line1: string; line2: string; city: string; state: string; pincode: string }
  hours: { opd: string }
  social: { facebook: string; instagram: string; youtube: string; whatsapp: string }
  mapsDirections: string
  mapsEmbed: string
}

export const hospital: HospitalInfo = {
  name: 'Meenakshi Jain Hospital',
  shortName: 'MJ Hospital',
  tagline: 'Compassionate Care, Trusted by Jind',
  foundedYear: 1998,
  email: 'mjhospital2003@gmail.com',
  domains: { primary: 'mjhospital.in', secondary: 'www.mjhospital.in' },
  phones: {
    emergency: '8278170381',
    ambulance: '8278170381',
    appointment: '8278170381',
    reception: '8278170381',
  },
  address: {
    line1: 'Circular Road',
    line2: 'Near Old Bus Stand',
    city: 'Jind',
    state: 'Haryana',
    pincode: '126102',
  },
  hours: { opd: '9:00 AM – 2:00 PM' },
  social: {
    facebook: 'https://www.facebook.com/share/1FLNJvwyw4/',
    instagram: 'https://www.instagram.com/meenakshi_jain_hospital',
    youtube: 'https://www.youtube.com/@mjhospitaljind',
    whatsapp: 'https://wa.me/918278170381',
  },
  mapsDirections: 'https://www.google.com/maps/dir/?api=1&destination=Meenakshi+Jain+Hospital+Circular+Road+Jind',
  mapsEmbed: 'https://www.google.com/maps?q=Meenakshi+Jain+Hospital+Circular+Road+Jind&output=embed',
}

export interface EmergencyNumber {
  label: string
  number: string
  note?: string
}

export const emergencyNumbers: EmergencyNumber[] = [
  { label: 'Emergency', number: '8278170381', note: '24 × 7' },
  { label: 'Ambulance', number: '8278170381', note: '24 × 7' },
  { label: 'Reception', number: '8278170381', note: 'OPD hours' },
]

export interface SiteSection {
  title: string
  href: string
}

export const siteSections: SiteSection[] = [
  { title: 'Home', href: '/' },
  { title: 'About Us', href: '/about' },
  { title: 'Services', href: '/services' },
  { title: 'Doctors', href: '/doctors' },
  { title: 'Health Camps', href: '/camps' },
  { title: 'Health Blog', href: '/blog' },
  { title: 'Gallery', href: '/gallery' },
  { title: 'FAQ', href: '/faq' },
  { title: 'Contact', href: '/contact' },
  { title: 'Book Appointment', href: '/book' },
]
