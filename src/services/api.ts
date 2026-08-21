// In production on Render, VITE_API_URL is injected at build time.
// Locally it falls back to localhost:5000.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ─── helpers ──────────────────────────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem('authToken')
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.message || `Request failed: ${res.status}`)
  }
  return data
}

const get  = <T>(path: string) => request<T>(path)
const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) })
const put  = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PUT',  body: JSON.stringify(body) })
const patch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
const del  = <T>(path: string) => request<T>(path, { method: 'DELETE' })

// ─── response shapes ──────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}

// ─── auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'USER'
  avatar?: string
  phone?: string
}

export interface LoginResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

export const authApi = {
  login:  (email: string, password: string) =>
    post<ApiSuccess<LoginResponse>>('/auth/login', { email, password }),
  me:     () => get<ApiSuccess<AuthUser>>('/auth/me'),
  logout: () => post<ApiSuccess<{}>>('/auth/logout', {}),
}

// ─── properties ───────────────────────────────────────────────────────────────

export interface Property {
  id: string
  title: string
  description: string
  price: number
  type: string
  status: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  bedrooms: number
  bathrooms: number
  squareFeet: number
  yearBuilt?: number
  images: string[]
  thumbnail?: string
  featured: boolean
  views: number
  categoryId: string
  locationId: string
  agentId: string
  ownerId: string
  category?: { id: string; name: string; slug: string }
  location?: { id: string; name: string; slug: string }
  agent?: { id: string; firstName: string; lastName: string; email: string; phone: string }
  owner?: { id: string; email: string; firstName: string; lastName: string }
  createdAt: string
}

export interface PropertyFilters {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  locationId?: string
  status?: string
  type?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: string
  sortOrder?: string
}

export const propertiesApi = {
  list: (filters: PropertyFilters = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v))
    })
    return get<PaginatedResponse<Property>>(`/properties?${params}`)
  },
  featured: (limit = 6) => get<ApiSuccess<Property[]>>(`/properties/featured?limit=${limit}`),
  get:    (id: string)   => get<ApiSuccess<Property>>(`/properties/${id}`),
  create: (data: Partial<Property>) => post<ApiSuccess<Property>>('/properties', data),
  update: (id: string, data: Partial<Property>) => put<ApiSuccess<Property>>(`/properties/${id}`, data),
  delete: (id: string)   => del<ApiSuccess<{}>>(`/properties/${id}`),
}

// ─── categories ───────────────────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  propertyCount?: number
  createdAt: string
}

export const categoriesApi = {
  list:   (page = 1, limit = 50, search = '') => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search.trim()) params.set('search', search.trim())
    return get<PaginatedResponse<Category>>(`/categories?${params}`)
  },
  get:    (id: string) => get<ApiSuccess<Category>>(`/categories/${id}`),
  create: (data: Partial<Category>) => post<ApiSuccess<Category>>('/categories', data),
  update: (id: string, data: Partial<Category>) => put<ApiSuccess<Category>>(`/categories/${id}`, data),
  delete: (id: string) => del<ApiSuccess<{}>>(`/categories/${id}`),
}

// ─── locations ────────────────────────────────────────────────────────────────

export interface Location {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  propertyCount?: number
  createdAt: string
}

export const locationsApi = {
  list:   (page = 1, limit = 50, search = '') => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search.trim()) params.set('search', search.trim())
    return get<PaginatedResponse<Location>>(`/locations?${params}`)
  },
  get:    (id: string) => get<ApiSuccess<Location>>(`/locations/${id}`),
  create: (data: Partial<Location>) => post<ApiSuccess<Location>>('/locations', data),
  update: (id: string, data: Partial<Location>) => put<ApiSuccess<Location>>(`/locations/${id}`, data),
  delete: (id: string) => del<ApiSuccess<{}>>(`/locations/${id}`),
}

// ─── agents ───────────────────────────────────────────────────────────────────

export interface Agent {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  avatar?: string
  bio?: string
  license?: string
  propertyCount?: number
  createdAt: string
}

export const agentsApi = {
  list:   (page = 1, limit = 20, search = '') => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search.trim()) params.set('search', search.trim())
    return get<PaginatedResponse<Agent>>(`/agents?${params}`)
  },
  get:    (id: string) => get<ApiSuccess<Agent>>(`/agents/${id}`),
  create: (data: Partial<Agent>) => post<ApiSuccess<Agent>>('/agents', data),
  update: (id: string, data: Partial<Agent>) => put<ApiSuccess<Agent>>(`/agents/${id}`, data),
  delete: (id: string) => del<ApiSuccess<{}>>(`/agents/${id}`),
}

// ─── users ────────────────────────────────────────────────────────────────────

export interface BackendUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  role: 'ADMIN' | 'USER'
  isActive: boolean
  createdAt: string
}

export const usersApi = {
  list: (page = 1, limit = 20, search = '') => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search.trim()) params.set('search', search.trim())
    return get<PaginatedResponse<BackendUser>>(`/users?${params}`)
  },
  get:    (id: string) => get<ApiSuccess<BackendUser>>(`/users/${id}`),
  delete: (id: string) => del<ApiSuccess<{}>>(`/users/${id}`),
  profile: () => get<ApiSuccess<BackendUser>>('/users/profile'),
  updateProfile: (data: Partial<BackendUser>) => put<ApiSuccess<BackendUser>>('/users/profile', data),
}

// ─── messages ─────────────────────────────────────────────────────────────────

export interface Message {
  id: string
  name: string
  email: string
  phone?: string
  subject: string
  body: string
  userId?: string
  propertyId?: string
  status: 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED'
  user?: { id: string; email: string; firstName: string; lastName: string }
  property?: { id: string; title: string }
  createdAt: string
}

export const messagesApi = {
  list: (page = 1, limit = 20, status = '') => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (status) params.set('status', status)
    return get<PaginatedResponse<Message>>(`/messages?${params}`)
  },
  get:    (id: string) => get<ApiSuccess<Message>>(`/messages/${id}`),
  updateStatus: (id: string, status: string) =>
    patch<ApiSuccess<Message>>(`/messages/${id}/status`, { status }),
  delete: (id: string) => del<ApiSuccess<{}>>(`/messages/${id}`),
  unreadCount: () => get<ApiSuccess<{ count: number }>>('/messages/unread-count'),
  create: (data: Partial<Message>) => post<ApiSuccess<Message>>('/messages', data),
}

// ─── testimonials ─────────────────────────────────────────────────────────────

export interface Testimonial {
  id: string
  content: string
  rating: number
  authorId: string
  featured: boolean
  author?: { id: string; email: string; firstName: string; lastName: string; avatar?: string }
  createdAt: string
}

export const testimonialsApi = {
  list: (page = 1, limit = 20, featured?: boolean) =>
    get<PaginatedResponse<Testimonial>>(
      `/testimonials?page=${page}&limit=${limit}${featured ? '&featured=true' : ''}`
    ),
  get:    (id: string) => get<ApiSuccess<Testimonial>>(`/testimonials/${id}`),
  create: (data: { content: string; rating: number }) =>
    post<ApiSuccess<Testimonial>>('/testimonials', data),
  update: (id: string, data: Partial<Testimonial>) =>
    put<ApiSuccess<Testimonial>>(`/testimonials/${id}`, data),
  delete: (id: string) => del<ApiSuccess<{}>>(`/testimonials/${id}`),
  toggleFeatured: (id: string) =>
    patch<ApiSuccess<Testimonial>>(`/testimonials/${id}/featured`, {}),
}

// ─── settings ─────────────────────────────────────────────────────────────────

export const settingsApi = {
  list: () => get<ApiSuccess<Record<string, string>>>('/settings'),
  update: (key: string, value: string, description?: string) =>
    put<ApiSuccess<{}>>(`/settings/${key}`, { value, description }),
  updateMultiple: (settings: Record<string, string>) =>
    put<ApiSuccess<{}>>('/settings', settings),
}

// ─── appointments ─────────────────────────────────────────────────────────────

export interface Appointment {
  id: string
  title: string
  description?: string
  userId: string
  propertyId: string
  scheduledAt: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  user?: { id: string; email: string; firstName: string; lastName: string }
  property?: { id: string; title: string; address: string }
  createdAt: string
}

export const appointmentsApi = {
  list: (page = 1, limit = 20, status = '') =>
    get<PaginatedResponse<Appointment>>(`/appointments?page=${page}&limit=${limit}&status=${status}`),
  create: (data: Partial<Appointment>) => post<ApiSuccess<Appointment>>('/appointments', data),
  update: (id: string, data: Partial<Appointment>) =>
    put<ApiSuccess<Appointment>>(`/appointments/${id}`, data),
  delete: (id: string) => del<ApiSuccess<{}>>(`/appointments/${id}`),
}

// ─── upload ───────────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string
  filename: string
  originalName: string
  size: number
  mimetype: string
}

export const uploadApi = {
  /** Upload a single image file. Returns the public URL. */
  upload: async (file: File): Promise<UploadResult> => {
    const token = localStorage.getItem('authToken')
    const body  = new FormData()
    body.append('file', file)

    const res  = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.message ?? 'Upload failed')
    return data.data as UploadResult
  },
}
