export interface Faq {
  question: string
  answer: string
  category: string
}

export const faqCategories: string[] = [
  'Appointments',
  'OPD & Timings',
  'Admission & Billing',
  'Insurance & Cashless',
  'Health Camps',
  'General',
]

export const faqs: Faq[] = [
  {
    question: 'How do I book an appointment?',
    answer: 'You can book online through our website in under two minutes, or call our OPD desk during working hours. Online bookings are confirmed by our team by phone or WhatsApp.',
    category: 'Appointments',
  },
  {
    question: 'Can I book a teleconsultation instead of visiting the hospital?',
    answer: 'Yes. Many of our doctors offer teleconsultation over phone or video. Select "Teleconsult" as the visit mode while booking, and our team will arrange a call at your chosen time.',
    category: 'Appointments',
  },
  {
    question: 'What are the OPD timings?',
    answer: 'OPD is only during morning hours i.e. 9 AM to 2 PM. Emergency, ICU and other hospital services are available 24×7.',
    category: 'OPD & Timings',
  },
  {
    question: 'Is OPD closed on Sundays?',
    answer: 'OPD is only during morning hours i.e. 9 AM to 2 PM during services. Rest services like ICU, Emergency etc are available 24 X 7.',
    category: 'OPD & Timings',
  },
  {
    question: 'Do I need a referral to see a specialist?',
    answer: 'No referral is needed. You can book directly with any of our specialists. If the doctor feels another department is more suitable, they will guide you to the right consultant.',
    category: 'Appointments',
  },
  {
    question: 'How do I get admitted to the hospital?',
    answer: 'Visit our admission desk with your identity card and doctor’s prescription. Our staff will guide you through the admission process, ward allotment and billing formalities.',
    category: 'Admission & Billing',
  },
  {
    question: 'What modes of payment do you accept?',
    answer: 'We accept cash, UPI, debit and credit cards. Detailed itemized bills are provided, and a cost estimate is shared before admission.',
    category: 'Admission & Billing',
  },
  {
    question: 'Do you offer cashless treatment with insurance?',
    answer: 'Yes. We are empanelled with several insurance companies and TPAs. Our billing team will help you with pre-authorization and documentation for cashless claims.',
    category: 'Insurance & Cashless',
  },
  {
    question: 'Are health camps really free?',
    answer: 'Yes, our community health camps are completely free, including checkups, basic tests and consultations. Registrations for upcoming camps are open on this website.',
    category: 'Health Camps',
  },
  {
    question: 'Do I need to register for a health camp in advance?',
    answer: 'Walk-ins are welcome, but online pre-registration helps us manage queues and ensure you are not turned away. Senior citizens and children get priority at our camps.',
    category: 'Health Camps',
  },
  {
    question: 'Can I get my test reports online?',
    answer: 'Most diagnostic reports are ready the same day and can be collected from the diagnostics desk. Please carry your report number when collecting them.',
    category: 'General',
  },
  {
    question: 'What should I do in case of a medical emergency?',
    answer: 'Call our 24×7 emergency line immediately or dial the national ambulance number 108/102. Do not drive yourself to the hospital — our ambulance can reach you and start care en route.',
    category: 'General',
  },
]
