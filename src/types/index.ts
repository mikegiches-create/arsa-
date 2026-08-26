export type UserRole = 'admin' | 'user'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (userData: Partial<User>) => void
}

export interface Property {
  id: string
  title: string
  location: string
  price: number
  beds: number
  baths: number
  sqft: string
  type: string
  tag: string
  img: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  count: number
  icon: string
  createdAt: string
  updatedAt: string
}

export interface Location {
  id: string
  city: string
  properties: number
  image: string
  createdAt: string
  updatedAt: string
}

export interface Testimonial {
  id: string
  name: string
  title: string
  quote: string
  avatar: string
  rating: number
  createdAt: string
  updatedAt: string
}

export interface BlogPost {
  id: string
  title: string
  category: string
  excerpt: string
  content: string
  image: string
  date: string
  author: string
  createdAt: string
  updatedAt: string
}

export interface Inquiry {
  id: string
  name: string
  email: string
  message: string
  status: 'new' | 'responded' | 'resolved'
  createdAt: string
  respondedAt?: string
}

export interface SiteSettings {
  id: string
  logo: string
  primaryColor: string
  secondaryColor: string
  companyName: string
  tagline: string
  email: string
  phone: string
  address: string
  socialMedia: {
    facebook?: string
    instagram?: string
    linkedin?: string
    twitter?: string
  }
  updatedAt: string
}
