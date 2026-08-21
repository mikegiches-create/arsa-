import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { NAVIGATION_MENU } from '../data/constants'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  // Shrink header slightly on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const handleNavClick = (href: string) => {
    setMenuOpen(false)
    if (href.startsWith('#')) {
      // smooth scroll to section
      const el = document.querySelector(href)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* ── NAV ── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-16 transition-all duration-300 ${
          scrolled ? 'h-16 bg-white shadow-md border-b border-gray-200' : 'h-20 bg-white/95 backdrop-blur-sm border-b border-gray-200'
        }`}
      >
        {/* Logo */}
        <a
          href="/"
          className="font-display text-xl tracking-widest text-[#111827] font-bold shrink-0"
        >
          ARSA<span className="text-[#2d6a4f]">·</span>REALESTATE
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 lg:gap-10">
          <Link
            to="/properties"
            className="nav-link text-[#111827] hover:text-[#2d6a4f] transition-colors font-semibold text-sm"
          >
            Properties
          </Link>
          {NAVIGATION_MENU.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => {
                if (item.href.startsWith('#')) {
                  e.preventDefault()
                  handleNavClick(item.href)
                }
              }}
              className="nav-link text-[#111827] hover:text-[#2d6a4f] transition-colors font-semibold text-sm"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Link
            to="/login"
            className="text-[#111827] hover:text-[#2d6a4f] transition-colors font-semibold text-sm px-3 py-2"
          >
            Sign In
          </Link>
          <Link
            to="/login"
            className="bg-[#2d6a4f] text-white text-xs tracking-widest uppercase font-semibold px-5 py-2.5 rounded hover:bg-[#1b4332] transition-colors duration-300"
          >
            Register
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-[#111827] rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <>
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </>
            ) : (
              <>
                <line x1="3" y1="7"  x2="21" y2="7" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="17" x2="21" y2="17" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* ── Mobile Menu Overlay ── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-white flex flex-col pt-20"
          role="dialog"
          aria-modal="true"
        >
          <nav className="flex flex-col items-center justify-center flex-1 gap-6 pb-10">
            <Link
              to="/properties"
              onClick={() => setMenuOpen(false)}
              className="font-display text-3xl text-[#111827] hover:text-[#2d6a4f] transition-colors"
            >
              Properties
            </Link>
            {NAVIGATION_MENU.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  if (item.href.startsWith('#')) e.preventDefault()
                  handleNavClick(item.href)
                }}
                className="font-display text-3xl text-[#111827] hover:text-[#2d6a4f] transition-colors"
              >
                {item.label}
              </a>
            ))}

            <div className="flex flex-col gap-3 w-full max-w-xs mt-6">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="text-center py-3 border-2 border-[#2d6a4f] text-[#2d6a4f] rounded-lg font-semibold hover:bg-[#2d6a4f]/10 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="text-center py-3 bg-[#2d6a4f] text-white rounded-lg font-semibold hover:bg-[#1b4332] transition-colors"
              >
                Register
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
