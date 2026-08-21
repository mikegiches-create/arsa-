import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Props {
  children: React.ReactNode
  requiredRole?: 'admin' | 'user'
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d6a4f] mx-auto" />
          <p className="text-[#111827] mt-4 font-semibold">Loading…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  // Backend uses 'ADMIN'/'USER', frontend routes use 'admin'/'user'
  if (requiredRole && user?.role.toLowerCase() !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
