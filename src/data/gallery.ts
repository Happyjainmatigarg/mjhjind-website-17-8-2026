export interface GalleryItem {
  title: string
  category: string
  image: string
  caption: string
}

export const galleryCategories: string[] = [
  'Campus',
  'Facilities',
  'Doctors & Team',
  'Events & Camps',
  'Patients & Community',
]

export const gallery: GalleryItem[] = [
  {
    title: 'Hospital Front',
    category: 'Campus',
    image: 'campus',
    caption: 'The Meenakshi Jain Hospital building on Circular Road, Jind.',
  },
  {
    title: 'Reception & Help Desk',
    category: 'Facilities',
    image: 'reception',
    caption: 'Our front desk team is ready to assist you at all times.',
  },
  {
    title: 'Intensive Care Unit',
    category: 'Facilities',
    image: 'icu',
    caption: 'A fully equipped ICU with round-the-clock monitoring.',
  },
  {
    title: 'Operation Theatre',
    category: 'Facilities',
    image: 'ot',
    caption: 'Modern operation theatre with strict hygiene protocols.',
  },
  {
    title: 'Diagnostics Lab',
    category: 'Facilities',
    image: 'lab',
    caption: 'In-house pathology and imaging for same-day reports.',
  },
  {
    title: 'Maternity Wing',
    category: 'Facilities',
    image: 'maternity',
    caption: 'A dedicated, comfortable maternity unit for safe deliveries.',
  },
  {
    title: 'Pharmacy',
    category: 'Facilities',
    image: 'pharmacy',
    caption: 'Genuine medicines available on the premises, 24×7 for emergencies.',
  },
  {
    title: 'Dr. Meenakshi Jain',
    category: 'Doctors & Team',
    image: 'doctor-w1',
    caption: 'Founder & Senior Consultant, General Medicine.',
  },
  {
    title: 'Our Care Team',
    category: 'Doctors & Team',
    image: 'doctor-w2',
    caption: 'Nurses and support staff who care for every patient like family.',
  },
  {
    title: 'Free Health Camp',
    category: 'Events & Camps',
    image: 'camp1',
    caption: 'Community health checkup camp organized in Jind.',
  },
  {
    title: 'Eye Checkup Camp',
    category: 'Events & Camps',
    image: 'camp2',
    caption: 'Cataract and vision screening at our free eye camp.',
  },
  {
    title: 'Health Awareness Talk',
    category: 'Events & Camps',
    image: 'event1',
    caption: 'Doctors sharing practical health tips with the community.',
  },
  {
    title: 'World Health Day',
    category: 'Events & Camps',
    image: 'event2',
    caption: 'Awareness drive on World Health Day.',
  },
  {
    title: 'Staff Training',
    category: 'Events & Camps',
    image: 'event3',
    caption: 'Regular training sessions keep our team updated.',
  },
]
