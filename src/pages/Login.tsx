import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (role: 'admin' | 'user') => {
    setLoading(true)
    setError('')
    const creds = role === 'admin'
      ? { email: 'admin@arsarealestate.com', password: 'Admin@123' }
      : { email: 'buyer1@example.com',       password: 'User@123' }
    try {
      await login(creds.email, creds.password)
      navigate(role === 'admin' ? '/admin/dashboard' : '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-white mb-2">
            ARSA<span className="text-[#40916c]">·</span>REALESTATE
          </h1>
          <p className="text-white/70">Admin Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="font-display text-2xl text-[#111827] mb-6">Sign In</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@arsarealestate.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-[#111827] focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-[#111827] focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2d6a4f] text-white font-semibold py-2.5 rounded-lg hover:bg-[#1b4332] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3 font-medium uppercase tracking-wide">
              Quick Demo
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => quickLogin('admin')}
                disabled={loading}
                className="py-2 border-2 border-[#2d6a4f] text-[#2d6a4f] text-sm font-semibold rounded-lg hover:bg-[#2d6a4f]/10 transition-colors disabled:opacity-50"
              >
                Admin
              </button>
              <button
                onClick={() => quickLogin('user')}
                disabled={loading}
                className="py-2 border-2 border-[#2d6a4f] text-[#2d6a4f] text-sm font-semibold rounded-lg hover:bg-[#2d6a4f]/10 transition-colors disabled:opacity-50"
              >
                User
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <Link to="/" className="text-sm text-[#2d6a4f] hover:text-[#1b4332] font-semibold">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
