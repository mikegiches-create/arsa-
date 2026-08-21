import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, AuthUser } from '../services/api'

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [token, setToken]     = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem('authToken')
    if (!stored) { setIsLoading(false); return }

    setToken(stored)
    authApi.me()
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
        setToken(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    const { user: userData, accessToken, refreshToken } = res.data

    localStorage.setItem('authToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    setToken(accessToken)
    setUser(userData)
  }

  const logout = () => {
    authApi.logout().catch(() => {})
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token && !!user,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
