export interface DoctorAvailability {
  days: string[]
  morning: string
  evening: string
}

export interface Doctor {
  slug: string
  name: string
  title: string
  email: string
  specialty: string
  department: string
  qualification: string
  registrationNumber: string
  registrationCouncil: string
  experience: number
  gender: string
  bio: string
  languages: string[]
  availability: DoctorAvailability
  opdFees: number
  availableToday: boolean
  featured: boolean
  highlights: string[]
  education: string[]
}

export const departments: string[] = [
  'General Medicine',
  'Cardiology',
  'Orthopedics',
  'Pediatrics',
  'Gynecology',
  'Emergency Medicine',
  'ENT',
  'Ophthalmology',
  'Dermatology',
  'Dental',
  'General Surgery',
  'Neurology',
  'Pulmonology',
  'Psychiatry',
]

export const doctors: Doctor[] = [
  {
    slug: 'dr-meenakshi-jain',
    name: 'Dr. Meenakshi Jain',
    title: 'Founder & Senior Consultant',
    email: 'dr.meenakshi.jain@mjhospital.in',
    specialty: 'General Medicine',
    department: 'General Medicine',
    qualification: 'MBBS, MD (Medicine)',
    registrationNumber: 'HMC-10234',
    registrationCouncil: 'Haryana Medical Council',
    experience: 26,
    gender: 'Female',
    bio: 'Dr. Meenakshi Jain is the founder of Meenakshi Jain Hospital and a senior physician with over two decades of experience in internal medicine. She has cared for tens of thousands of families across Jind district and is known for her thorough, patient-first approach.',
    languages: ['Hindi', 'English', 'Punjabi'],
    availability: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      morning: '9:00 AM – 2:00 PM',
      evening: '4:00 PM – 8:00 PM',
    },
    opdFees: 400,
    availableToday: true,
    featured: true,
    highlights: [
      '26+ years in internal medicine',
      'Expert in diabetes and hypertension management',
      'Pioneer of community health camps in Jind',
    ],
    education: ['MBBS — Pt. B.D. Sharma PGIMS Rohtak', 'MD (General Medicine) — Post Graduate Institute of Medical Sciences, Rohtak'],
  },
  {
    slug: 'dr-rahul-gupta',
    name: 'Dr. Rahul Gupta',
    title: 'Consultant Cardiologist',
    email: 'dr.rahul.gupta@mjhospital.in',
    specialty: 'Cardiology',
    department: 'Cardiology',
    qualification: 'MBBS, MD (Medicine), DM (Cardiology)',
    registrationNumber: 'HMC-10872',
    registrationCouncil: 'Haryana Medical Council',
    experience: 15,
    gender: 'Male',
    bio: 'Dr. Rahul Gupta is a consultant cardiologist who has been instrumental in establishing the cardiac care unit at Meenakshi Jain Hospital. He specializes in the diagnosis and management of heart disease, including hypertension, coronary artery disease and heart failure.',
    languages: ['Hindi', 'English'],
    availability: {
      days: ['Mon', 'Wed', 'Fri'],
      morning: '9:00 AM – 1:00 PM',
      evening: '5:00 PM – 7:00 PM',
    },
    opdFees: 500,
    availableToday: true,
    featured: true,
    highlights: [
      'DM in Cardiology',
      'Leads the ECG, 2D ECHO and TMT lab',
      'Cardiac rehabilitation and prevention programs',
    ],
    education: ['MBBS — AIIMS New Delhi', 'MD (Medicine) — AIIMS New Delhi', 'DM (Cardiology) — PGIMER Chandigarh'],
  },
  {
    slug: 'dr-sunita-verma',
    name: 'Dr. Sunita Verma',
    title: 'Senior Gynecologist & Obstetrician',
    email: 'dr.sunita.verma@mjhospital.in',
    specialty: 'Gynecology',
    department: 'Gynecology',
    qualification: 'MBBS, MS (Obstetrics & Gynecology)',
    registrationNumber: 'HMC-11506',
    registrationCouncil: 'Haryana Medical Council',
    experience: 18,
    gender: 'Female',
    bio: 'Dr. Sunita Verma heads the maternity and gynecology wing. She has safely delivered thousands of babies and provides complete care for women — from adolescence and pregnancy to menopause.',
    languages: ['Hindi', 'English', 'Punjabi'],
    availability: {
      days: ['Mon', 'Tue', 'Thu', 'Sat'],
      morning: '9:00 AM – 2:00 PM',
      evening: '5:00 PM – 8:00 PM',
    },
    opdFees: 400,
    availableToday: true,
    featured: true,
    highlights: [
      '18+ years in obstetrics and gynecology',
      'High-risk pregnancy management',
      'Laparoscopic gynecological surgery',
    ],
    education: ['MBBS — Maharishi Dayanand University Rohtak', 'MS (Obstetrics & Gynecology) — PGIMS Rohtak'],
  },
  {
    slug: 'dr-aman-singh',
    name: 'Dr. Aman Singh',
    title: 'Orthopedic & Joint Replacement Surgeon',
    email: 'dr.aman.singh@mjhospital.in',
    specialty: 'Orthopedics',
    department: 'Orthopedics',
    qualification: 'MBBS, MS (Orthopedics)',
    registrationNumber: 'HMC-12144',
    registrationCouncil: 'Haryana Medical Council',
    experience: 12,
    gender: 'Male',
    bio: 'Dr. Aman Singh is an orthopedic surgeon specializing in trauma, sports injuries and joint replacement. He has performed hundreds of successful procedures, helping patients of all ages regain mobility.',
    languages: ['Hindi', 'English'],
    availability: {
      days: ['Tue', 'Thu', 'Sat'],
      morning: '10:00 AM – 2:00 PM',
      evening: '5:00 PM – 7:00 PM',
    },
    opdFees: 500,
    availableToday: false,
    featured: true,
    highlights: [
      'Knee and hip replacement surgery',
      'Arthroscopic sports injury treatment',
      'Fracture and trauma care',
    ],
    education: ['MBBS — Pt. B.D. Sharma PGIMS Rohtak', 'MS (Orthopedics) — PGIMER Chandigarh'],
  },
  {
    slug: 'dr-neha-bansal',
    name: 'Dr. Neha Bansal',
    title: 'Consultant Pediatrician',
    email: 'dr.neha.bansal@mjhospital.in',
    specialty: 'Pediatrics',
    department: 'Pediatrics',
    qualification: 'MBBS, MD (Pediatrics)',
    registrationNumber: 'HMC-11890',
    registrationCouncil: 'Haryana Medical Council',
    experience: 10,
    gender: 'Female',
    bio: 'Dr. Neha Bansal provides complete care for newborns, children and adolescents. She is known for her gentle approach and works closely with parents on nutrition, growth, immunization and child development.',
    languages: ['Hindi', 'English'],
    availability: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      morning: '10:00 AM – 1:00 PM',
      evening: '5:00 PM – 8:00 PM',
    },
    opdFees: 300,
    availableToday: true,
    featured: false,
    highlights: [
      'Newborn and infant care',
      'Childhood immunization programs',
      'Asthma and allergy management',
    ],
    education: ['MBBS — GGS Medical College Faridkot', 'MD (Pediatrics) — PGIMS Rohtak'],
  },
  {
    slug: 'dr-vikas-rana',
    name: 'Dr. Vikas Rana',
    title: 'Emergency Medicine Specialist',
    email: 'dr.vikas.rana@mjhospital.in',
    specialty: 'Emergency Medicine',
    department: 'Emergency Medicine',
    qualification: 'MBBS, MD (Emergency Medicine)',
    registrationNumber: 'HMC-12611',
    registrationCouncil: 'Haryana Medical Council',
    experience: 9,
    gender: 'Male',
    bio: 'Dr. Vikas Rana leads our 24×7 emergency and trauma unit. He manages critical and life-threatening cases with speed and composure, ensuring patients receive timely life support, resuscitation and stabilization.',
    languages: ['Hindi', 'English', 'Punjabi'],
    availability: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      morning: '24 × 7 emergency',
      evening: '24 × 7 emergency',
    },
    opdFees: 400,
    availableToday: true,
    featured: false,
    highlights: [
      '24×7 trauma and emergency care',
      'Advanced cardiac life support (ACLS)',
      'Critical care and ICU management',
    ],
    education: ['MBBS — BPS Government Medical College Sonepat', 'MD (Emergency Medicine) — AIIMS New Delhi'],
  },
  {
    slug: 'dr-rajesh-khatri',
    name: 'Dr. Rajesh Khatri',
    title: 'ENT & Head-Neck Surgeon',
    email: 'dr.rajesh.khatri@mjhospital.in',
    specialty: 'ENT',
    department: 'ENT',
    qualification: 'MBBS, MS (ENT)',
    registrationNumber: 'HMC-11320',
    registrationCouncil: 'Haryana Medical Council',
    experience: 14,
    gender: 'Male',
    bio: 'Dr. Rajesh Khatri is an ENT specialist treating ear, nose and throat problems including sinusitis, hearing loss, tonsillitis and voice disorders. He performs both medical and surgical management.',
    languages: ['Hindi', 'English'],
    availability: {
      days: ['Mon', 'Wed', 'Fri'],
      morning: '10:00 AM – 1:00 PM',
      evening: '4:00 PM – 7:00 PM',
    },
    opdFees: 350,
    availableToday: false,
    featured: false,
    highlights: [
      'Endoscopic sinus surgery',
      'Hearing assessment and management',
      'Pediatric ENT care',
    ],
    education: ['MBBS — Pt. B.D. Sharma PGIMS Rohtak', 'MS (ENT) — PGIMS Rohtak'],
  },
  {
    slug: 'dr-pooja-agnihotri',
    name: 'Dr. Pooja Agnihotri',
    title: 'Consultant Dermatologist',
    email: 'dr.pooja.agnihotri@mjhospital.in',
    specialty: 'Dermatology',
    department: 'Dermatology',
    qualification: 'MBBS, MD (Dermatology)',
    registrationNumber: 'HMC-12985',
    registrationCouncil: 'Haryana Medical Council',
    experience: 8,
    gender: 'Female',
    bio: 'Dr. Pooja Agnihotri treats skin, hair and nail conditions, and also offers cosmetic dermatology services. Her clinic is well equipped for phototherapy, dermoscopy and minor dermatological procedures.',
    languages: ['Hindi', 'English'],
    availability: {
      days: ['Tue', 'Thu', 'Sat'],
      morning: '10:00 AM – 1:00 PM',
      evening: '5:00 PM – 8:00 PM',
    },
    opdFees: 300,
    availableToday: true,
    featured: false,
    highlights: [
      'Acne, eczema and psoriasis care',
      'Laser and cosmetic procedures',
      'Pediatric dermatology',
    ],
    education: ['MBBS — Maharishi Dayanand University Rohtak', 'MD (Dermatology) — PGIMER Chandigarh'],
  },
]
