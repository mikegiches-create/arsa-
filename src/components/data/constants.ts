import loc1   from '../../assets/IMG-20250408-WA0005.jpg'
import loc2   from '../../assets/IMG-20250408-WA0006.jpg'
import loc3   from '../../assets/IMG-20250408-WA0007.jpg'
import loc4   from '../../assets/IMG-20250408-WA0008.jpg'

import agent1 from '../../assets/WhatsApp-Image-2023-05-22-at-12.17.27-768x1024.jpeg'
import agent2 from '../../assets/WhatsApp-Image-2023-05-22-at-12.17.30-1-768x1024.jpeg'
import agent3 from '../../assets/WhatsApp-Image-2023-05-22-at-12.17.32-768x1024.jpeg'

export const PROPERTY_FILTERS = ['All', 'Houses', 'Apartments', 'Land', 'Commercial', 'Luxury Homes']

export const PROPERTY_CATEGORIES = [
  { name: 'Houses',       count: 234, icon: '🏠' },
  { name: 'Apartments',   count: 567, icon: '🏢' },
  { name: 'Land',         count: 89,  icon: '🌳' },
  { name: 'Commercial',   count: 45,  icon: '🏬' },
  { name: 'Luxury Homes', count: 23,  icon: '👑' },
]

export const HOW_IT_WORKS = [
  {
    num: '01',
    title: 'Search Properties',
    body: 'Browse our extensive collection of properties using advanced filters to find exactly what you need.',
    icon: '🔍',
  },
  {
    num: '02',
    title: 'Schedule Tour',
    body: 'Contact us to arrange a viewing and explore the property with our expert agents.',
    icon: '📅',
  },
  {
    num: '03',
    title: 'Make an Offer',
    body: 'When you find the perfect property, our team assists with negotiations and documentation.',
    icon: '📝',
  },
  {
    num: '04',
    title: 'Secure Your Home',
    body: 'Finalize the transaction with our legal and financial guidance for a smooth closing.',
    icon: '🔐',
  },
]

export const WHY_CHOOSE_US = [
  {
    num: '01',
    title: 'Acquisition Advisory',
    body: 'We source properties before they reach any market — drawing on years of relationships with estate holders, family offices, and private trusts.',
    icon: '🏛',
  },
  {
    num: '02',
    title: 'Portfolio Management',
    body: 'For multi-property owners, we provide ongoing oversight: maintenance coordination, rental yield optimization, and strategic timing of sales.',
    icon: '📊',
  },
  {
    num: '03',
    title: 'Private Sales',
    body: 'The finest properties are sold quietly. We represent sellers seeking complete discretion and buyers who value confidentiality above all.',
    icon: '🔒',
  },
  {
    num: '04',
    title: 'Interior Curation',
    body: 'Our design partners bring each property to its highest expression, whether for personal occupancy or to command the most compelling sale presentation.',
    icon: '🎨',
  },
  {
    num: '05',
    title: 'Legal & Structuring',
    body: 'Complex acquisitions demand sophisticated counsel. We coordinate with leading property attorneys and wealth advisors on every significant transaction.',
    icon: '⚖️',
  },
  {
    num: '06',
    title: 'Relocation Services',
    body: 'Moving at the highest level requires more than a moving company. We manage every element of transition: schools, clubs, household staff, and social introductions.',
    icon: '✈️',
  },
]

export const FEATURED_LOCATIONS = [
  { city: 'Los Angeles',   properties: 456, image: loc1 },
  { city: 'Miami',         properties: 389, image: loc2 },
  { city: 'New York',      properties: 523, image: loc3 },
  { city: 'San Francisco', properties: 234, image: loc4 },
]

export const FEATURED_AGENTS = [
  { id: 1, name: 'Sarah Johnson',   title: 'Senior Agent',      properties: 456, image: agent1, phone: '+1 (212) 555-0101' },
  { id: 2, name: 'Michael Chen',    title: 'Luxury Specialist',  properties: 234, image: agent2, phone: '+1 (212) 555-0102' },
  { id: 3, name: 'Emma Rodriguez',  title: 'Investment Expert',  properties: 178, image: agent3, phone: '+1 (212) 555-0103' },
]

export const STATISTICS = [
  { label: 'Properties Sold', value: '4,250+' },
  { label: 'Happy Clients',   value: '12,500+' },
  { label: 'Cities Covered',  value: '50+' },
  { label: 'Years in Business', value: '22' },
]

export const FAQ_ITEMS = [
  {
    q: 'How do I start looking for properties?',
    a: 'Simply browse our listings using our advanced search filters or contact one of our agents for personalized assistance.',
  },
  {
    q: 'What are your commission rates?',
    a: 'Our commission rates are competitive and negotiable based on the property and transaction type. Contact us for a personalized quote.',
  },
  {
    q: 'Do you offer financing assistance?',
    a: 'We work with leading financial institutions and can connect you with mortgage specialists for favorable rates and terms.',
  },
  {
    q: 'How long does the buying process take?',
    a: 'Typically 30-45 days from offer to closing, though this can vary based on inspection, appraisal, and financing timelines.',
  },
  {
    q: 'Can I sell my property through ARSA REALESTATE?',
    a: 'Absolutely! We have a proven track record of successful sales and provide comprehensive marketing and negotiation services.',
  },
  {
    q: 'Do you handle international transactions?',
    a: 'Yes, we specialize in international property transactions and have expertise in cross-border real estate deals.',
  },
]

export const NAVIGATION_MENU = [
  { label: 'About',        href: '#about' },
  { label: 'Services',     href: '#services' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Contact',      href: '#contact' },
]

export const FOOTER_LINKS = {
  company: [
    { label: 'About Us', href: '#about' },
    { label: 'Careers',  href: '#careers' },
    { label: 'News',     href: '#news' },
  ],
  support: [
    { label: 'Help Center', href: '#help' },
    { label: 'Contact',     href: '#contact' },
    { label: 'FAQ',         href: '#faq' },
  ],
  legal: [
    { label: 'Privacy Policy',    href: '#privacy' },
    { label: 'Terms & Conditions', href: '#terms' },
    { label: 'Cookie Policy',     href: '#cookies' },
  ],
}

export const SOCIAL_MEDIA = [
  { name: 'Facebook',  icon: '📘', url: '#' },
  { name: 'Instagram', icon: '📷', url: '#' },
  { name: 'LinkedIn',  icon: '💼', url: '#' },
  { name: 'Twitter',   icon: '𝕏',  url: '#' },
]
