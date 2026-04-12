// Types and Interfaces

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  title?: string
  location?: string
  bio?: string
  skills?: string[]
  rating?: number
  reviews?: number
  hourlyRate?: string
}

export interface Intent {
  id: number | string
  title: string
  description: string
  category: string
  status: 'looking' | 'in_progress' | 'completed'
  visibility?: 'public' | 'private'
  skills: string[]
  budget: string
  timeline: string
  members?: User[]
  createdBy?: User
  createdAt?: string
  updatedAt?: string
}

export interface Skill {
  id: number | string
  name: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  endorsements?: number
}

export interface Message {
  id: number | string
  conversationId: number | string
  authorId: string
  author: User
  content: string
  timestamp: string
  edited?: boolean
  deleted?: boolean
}

export interface Conversation {
  id: number | string
  participants: User[]
  lastMessage?: string
  updatedAt: string
  unreadCount?: number
}

export interface Application {
  id: number | string
  intentId: number | string
  userId: string
  user: User
  coverLetter: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export interface Review {
  id: number | string
  recipientId: string
  authorId: string
  author: User
  rating: number
  comment: string
  createdAt: string
}

export interface FormErrors {
  [key: string]: string
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Constants

export const INTENT_CATEGORIES = [
  'Development',
  'Design',
  'Marketing',
  'Data',
  'Content',
  'Product',
  'Sales',
  'Other',
] as const

export const INTENT_STATUS = {
  looking: 'Looking for Skills',
  in_progress: 'In Progress',
  completed: 'Completed',
} as const

export const SKILL_LEVELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
} as const

export const APPLICATION_STATUS = {
  pending: 'Pending Review',
  accepted: 'Accepted',
  rejected: 'Rejected',
} as const

export const ROUTES = {
  HOME: '/',
  LOGIN: '/',
  REGISTER: '/',
  DASHBOARD: '/dashboard',
  CREATE: '/create',
  SKILLS: '/skills',
  CHAT: '/chat',
  PROFILE: '/profile',
  INTENT: (id: string) => `/intent/${id}`,
  SETTINGS: '/settings',
} as const

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const PAGINATION_LIMITS = {
  INTENTS: 10,
  SKILLS: 12,
  MESSAGES: 50,
  CONVERSATIONS: 20,
} as const

export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

// Color palette
export const COLORS = {
  primary: '#E5EEE4', // Sage Light
  secondary: '#D4E6D3', // Sage Default
  dark: '#1F2937', // Sage Dark
  white: '#FFFFFF',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    900: '#111827',
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const

// Validation rules
export const VALIDATION = {
  EMAIL_PATTERN: /^\S+@\S+\.\S+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  TITLE_MIN_LENGTH: 5,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 5000,
  BIO_MAX_LENGTH: 500,
  FILE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'],
} as const

// Animation durations (in ms)
export const ANIMATIONS = {
  FAST: 150,
  BASE: 200,
  SLOW: 300,
} as const

// Key names for localStorage
export const STORAGE_KEYS = {
  USER: 'intent_user',
  AUTH_TOKEN: 'intent_auth_token',
  THEME: 'intent_theme',
  PREFERENCES: 'intent_preferences',
} as const
