export interface Testimonial {
  name: string
  location: string
  rating: number
  quote: string
  treatment: string
}

export const testimonials: Testimonial[] = [
  {
    name: 'Ramesh Kumar',
    location: 'Jind',
    rating: 5,
    quote: 'My father was brought here in an emergency at 2 AM. The staff was alert, the doctor reached in minutes, and the ICU care was excellent. Grateful to the whole team.',
    treatment: 'Emergency & ICU',
  },
  {
    name: 'Suman Devi',
    location: 'Safidon',
    rating: 5,
    quote: 'I delivered my second child here and the experience was very reassuring. The nurses and Dr. Verma took wonderful care of me and my baby.',
    treatment: 'Maternity Care',
  },
  {
    name: 'Harish Chhabra',
    location: 'Julana',
    rating: 4,
    quote: 'Got my knee replacement done by Dr. Aman Singh. The surgery went well and the physiotherapy team supported me through every step of recovery.',
    treatment: 'Knee Replacement',
  },
  {
    name: 'Anita Rani',
    location: 'Narwana',
    rating: 5,
    quote: 'The doctors here explain everything patiently. I feel my family’s health is in safe hands. The free camps they run are a great help for our village.',
    treatment: 'General Medicine',
  },
  {
    name: 'Kuldeep Singh',
    location: 'Jind',
    rating: 5,
    quote: 'Very reasonable charges and no unnecessary tests. My sugar levels are finally under control after following the diet plan they gave me.',
    treatment: 'Diabetes Care',
  },
]
