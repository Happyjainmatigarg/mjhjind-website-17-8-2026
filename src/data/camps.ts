export interface HealthCamp {
  slug: string
  title: string
  type: string
  date: string
  time: string
  location: string
  description: string
  services: string[]
  eligibility: string
  whatToBring: string[]
  capacity: number
  registrations: number
  organizer: string
  status: 'upcoming' | 'past'
  image: string
  summary: string
}

export const campTypes: string[] = [
  'Free Checkup',
  'Eye Camp',
  'Diabetes Screening',
  'Heart Health Camp',
  'Women’s Health Camp',
  'Child Health Camp',
  'General Health Camp',
]

export const camps: HealthCamp[] = [
  {
    slug: 'free-eye-checkup-camp-safidon-road',
    title: 'Free Eye Checkup Camp',
    type: 'Eye Camp',
    date: '2026-08-23',
    time: '9:00 AM – 1:00 PM',
    location: 'Community Centre, Safidon Road, Jind',
    description: 'A free eye checkup camp for all age groups. Comprehensive eye examinations, cataract screening and free reading glasses for senior citizens.',
    services: ['Eye sight testing', 'Cataract screening', 'Glaucoma check', 'Free reading glasses for seniors', 'Diet and eye-care advice'],
    eligibility: 'Open to all residents of Jind. Senior citizens and school children get priority.',
    whatToBring: ['Previous prescription glasses (if any)', 'Health card / Aadhaar card', 'A family member for elderly patients'],
    capacity: 150,
    registrations: 96,
    organizer: 'Meenakshi Jain Hospital',
    status: 'upcoming',
    image: 'camp2',
    summary: 'Free eye checkups, cataract screening and free reading glasses for senior citizens.',
  },
  {
    slug: 'diabetes-screening-and-awareness-camp',
    title: 'Diabetes Screening & Awareness Camp',
    type: 'Diabetes Screening',
    date: '2026-09-06',
    time: '8:00 AM – 2:00 PM',
    location: 'Meenakshi Jain Hospital, Circular Road, Jind',
    description: 'Free blood sugar testing, HbA1c assessment and one-on-one counselling with our physicians. Ideal for adults over 30 with a family history of diabetes.',
    services: ['Random and fasting blood sugar test', 'HbA1c test', 'Foot and eye examination', 'Diet counselling', 'Free glucometer guidance'],
    eligibility: 'Adults above 30 years of age. Those with a family history of diabetes are encouraged to attend.',
    whatToBring: ['Fasting for at least 8 hours', 'Previous medical reports (if any)'],
    capacity: 120,
    registrations: 54,
    organizer: 'Meenakshi Jain Hospital',
    status: 'upcoming',
    image: 'camp1',
    summary: 'Free sugar testing, HbA1c and diabetes counselling by senior physicians.',
  },
  {
    slug: 'womens-health-and-cancer-awareness-camp',
    title: 'Women’s Health & Cancer Awareness Camp',
    type: 'Women’s Health Camp',
    date: '2026-09-20',
    time: '10:00 AM – 2:00 PM',
    location: 'Sewak Samaj Bhawan, Jind',
    description: 'A dedicated camp for women covering breast health, cervical cancer screening, anemia and reproductive health. All consultations are with female doctors.',
    services: ['Breast examination', 'Pap smear / HPV screening', 'Hemoglobin testing', 'Menstrual health counselling', 'Nutrition guidance'],
    eligibility: 'Open to all women aged 18 years and above. Free screening for women over 30.',
    whatToBring: ['Aadhaar card', 'Previous medical reports (if any)'],
    capacity: 100,
    registrations: 38,
    organizer: 'Meenakshi Jain Hospital',
    status: 'upcoming',
    image: 'women',
    summary: 'Breast health, cervical screening and complete care — all consultations with female doctors.',
  },
  {
    slug: 'free-heart-health-camp-julana',
    title: 'Free Heart Health Camp',
    type: 'Heart Health Camp',
    date: '2026-10-04',
    time: '9:00 AM – 1:00 PM',
    location: 'Civil Hospital Ground, Julana',
    description: 'ECG, blood pressure and cholesterol screening for early detection of heart disease. Cardiologist consultation available for high-risk cases.',
    services: ['Blood pressure check', 'ECG', 'Cholesterol and sugar test', 'Cardiologist consultation', 'Heart-health diet advice'],
    eligibility: 'Open to all. Adults with diabetes, hypertension, smoking history or family history of heart disease are strongly recommended.',
    whatToBring: ['List of current medicines', 'Previous ECG or reports (if any)', 'Fasting recommended for lipid profile'],
    capacity: 150,
    registrations: 12,
    organizer: 'Meenakshi Jain Hospital',
    status: 'upcoming',
    image: 'camp2',
    summary: 'ECG, BP, cholesterol screening and cardiologist consultation — completely free.',
  },
  {
    slug: 'child-immunization-and-growth-camp',
    title: 'Child Immunization & Growth Camp',
    type: 'Child Health Camp',
    date: '2026-06-07',
    time: '9:00 AM – 1:00 PM',
    location: 'Meenakshi Jain Hospital, Circular Road, Jind',
    description: 'Immunization drive and growth monitoring for children under five. Growth charts reviewed by pediatricians and parents counselled on nutrition.',
    services: ['Vaccination as per schedule', 'Growth and development assessment', 'Pediatrician consultation', 'Nutrition counselling', 'Anemia screening'],
    eligibility: 'Children aged 0–5 years. Please bring the child’s immunization card.',
    whatToBring: ['Child immunization card', 'Child’s Aadhaar / birth certificate'],
    capacity: 80,
    registrations: 65,
    organizer: 'Meenakshi Jain Hospital',
    status: 'past',
    image: 'camp1',
    summary: 'Free vaccines, growth monitoring and pediatrician advice for children under five.',
  },
  {
    slug: 'community-general-health-mela',
    title: 'Community General Health Mela',
    type: 'General Health Camp',
    date: '2026-05-17',
    time: '8:00 AM – 2:00 PM',
    location: 'Government School Ground, Narwana',
    description: 'A community health fair with free general checkups, medicine distribution, and awareness stalls on hygiene, nutrition and sanitation.',
    services: ['General physician checkup', 'Free medicine distribution', 'Blood sugar and BP check', 'Hygiene awareness stalls', 'Health card issuance'],
    eligibility: 'Open to all residents of the region, with priority for senior citizens and underprivileged families.',
    whatToBring: ['Identity card', 'Previous prescriptions (if any)'],
    capacity: 250,
    registrations: 210,
    organizer: 'Meenakshi Jain Hospital',
    status: 'past',
    image: 'camp2',
    summary: 'Free checkups, medicines and health awareness for the whole community.',
  },
]
