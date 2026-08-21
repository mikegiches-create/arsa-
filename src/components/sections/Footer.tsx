import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FOOTER_LINKS } from '../data/constants'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const SOCIAL = [
  { name: 'Facebook',  icon: '𝐟', href: 'https://facebook.com' },
  { name: 'Instagram', icon: '◎', href: 'https://instagram.com' },
  { name: 'LinkedIn',  icon: 'in', href: 'https://linkedin.com' },
  { name: 'Twitter',   icon: '𝕏', href: 'https://twitter.com' },
]

export default function Footer() {
  const [footerEmail, setFooterEmail] = useState('')
  const [footerSent, setFooterSent]   = useState(false)
  const year = new Date().getFullYear()

  const handleFooterSub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!footerEmail) return
    try {
      await fetch(`${BASE_URL}/newsletter/subscribe`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: footerEmail }),
      })
    } catch {}
    setFooterSent(true)
    setFooterEmail('')
    setTimeout(() => setFooterSent(false), 4000)
  }

  const scrollTo = (href: string) => (e: React.MouseEvent) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="bg-[#111827] text-white">
      <div className="px-6 md:px-16 py-16">
        <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <a href="/" className="font-display text-2xl tracking-widest mb-4 block">
              ARSA<span className="text-[#2d6a4f]">·</span>REALESTATE
            </a>
            <p className="text-white/60 text-sm leading-relaxed">
              Your trusted partner in luxury real estate solutions worldwide.
            </p>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-[#40916c] mb-4 text-xs tracking-widest uppercase">
              Company
            </h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={scrollTo(link.href)}
                    className="text-white/60 text-sm hover:text-[#40916c] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-[#40916c] mb-4 text-xs tracking-widest uppercase">
              Support
            </h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.support.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={scrollTo(link.href)}
                    className="text-white/60 text-sm hover:text-[#40916c] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-[#40916c] mb-4 text-xs tracking-widest uppercase">
              Legal
            </h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={scrollTo(link.href)}
                    className="text-white/60 text-sm hover:text-[#40916c] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/login" className="text-white/60 text-sm hover:text-[#40916c] transition-colors">
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-[#40916c] mb-4 text-xs tracking-widest uppercase">
              Newsletter
            </h4>
            <p className="text-white/60 text-sm mb-3">
              Exclusive listings straight to your inbox.
            </p>
            {footerSent ? (
              <p className="text-[#40916c] text-sm font-semibold">✓ Subscribed!</p>
            ) : (
              <form onSubmit={handleFooterSub} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Your email"
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#40916c] transition-colors"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-[#2d6a4f] hover:bg-[#40916c] text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
                >
                  Go
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <p className="text-white/50 text-sm">
            © {year} ARSA REALESTATE. All rights reserved.
          </p>
          <div className="flex gap-3">
            {SOCIAL.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#2d6a4f] transition-colors text-sm font-bold"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
