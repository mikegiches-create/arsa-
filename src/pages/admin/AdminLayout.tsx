import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { label: 'Dashboard',    icon: '◈',  href: '/admin/dashboard' },
  { label: 'Properties',   icon: '⌂',  href: '/admin/properties' },
  { label: 'Categories',   icon: '⊞',  href: '/admin/categories' },
  { label: 'Locations',    icon: '◎',  href: '/admin/locations' },
  { label: 'Agents',       icon: '◉',  href: '/admin/agents' },
  { label: 'Users',        icon: '◑',  href: '/admin/users' },
  { label: 'Testimonials', icon: '★',  href: '/admin/testimonials' },
  { label: 'Messages',     icon: '✉',  href: '/admin/messages' },
  { label: 'Newsletter',   icon: '📧', href: '/admin/newsletter' },
  { label: 'Settings',     icon: '⚙',  href: '/admin/settings' },
]

export default function AdminLayout() {
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/login') }

  const currentPage = NAV.find(n => location.pathname.startsWith(n.href))?.label ?? 'Admin'

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        <Link to="/admin/dashboard" className="font-display tracking-widest text-white truncate">
          {collapsed ? 'A' : <><span className="text-lg">ARSA</span><span className="text-[#40916c]">·</span><span className="text-sm text-white/70">ADMIN</span></>}
        </Link>
        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="hidden lg:flex w-6 h-6 items-center justify-center rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors text-xs"
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {NAV.map(item => {
          const active = location.pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              to={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-[#2d6a4f] text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`}
            >
              <span className={`text-base shrink-0 ${active ? 'text-white' : 'text-white/50'}`}>
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-[#2d6a4f] flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.firstName?.[0]?.toUpperCase() ?? 'A'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-white/50 text-xs truncate">{user?.email}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={handleLogout}
            className="mt-3 w-full text-xs font-semibold text-white/60 hover:text-white py-1.5 rounded-lg hover:bg-white/10 transition-colors text-center"
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#f4f6f5] overflow-hidden">

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0f1923] transform transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden lg:flex flex-col bg-[#0f1923] transition-all duration-300 shrink-0 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <span className="text-lg">☰</span>
            </button>
            <div>
              <h1 className="font-display text-lg sm:text-xl text-[#111827] leading-tight">
                {currentPage}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#2d6a4f] transition-colors"
            >
              <span>↗</span> View Site
            </Link>
            <div className="h-5 w-px bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#2d6a4f] flex items-center justify-center text-white text-sm font-bold">
                {user?.firstName?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <span className="hidden sm:block text-sm font-semibold text-[#111827]">
                {user?.firstName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
