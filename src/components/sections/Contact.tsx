import { useState } from 'react'
import { messagesApi } from '../../services/api'

export default function Contact() {
  const [form, setForm]       = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [status, setStatus]   = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errMsg, setErrMsg]   = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setErrMsg('')
    try {
      await messagesApi.create({
        name:       form.name,
        email:      form.email,
        phone:      form.phone || undefined,
        subject:    form.subject || 'General Enquiry',
        body:       form.message,
      })
      setStatus('sent')
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      setStatus('error')
      setErrMsg(err instanceof Error ? err.message : 'Failed to send. Please try again.')
    }
  }

  return (
    <section id="contact" className="py-24 px-6 md:px-16 bg-white">
      <div className="grid md:grid-cols-2 gap-16">
        {/* Contact Info */}
        <div>
          <p className="text-[#2d6a4f] text-xs tracking-[0.25em] uppercase mb-4 font-medium">
            Get in Touch
          </p>
          <h2 className="font-display text-4xl md:text-5xl mb-8 green-line text-[#111827]">
            Contact<br />
            <em>Us</em>
          </h2>
          <p className="text-[#333] leading-relaxed mb-10 max-w-md font-medium">
            Ready to find your dream property? Our team is here to help with personalized service and
            unmatched expertise.
          </p>

          <div className="space-y-6">
            {[
              { label: 'Phone',       value: '+254 795 308 101',              icon: '📞', href: 'tel:+254795308101' },
              { label: 'Email',       value: 'inquiries@arsarealestate.com',  icon: '📧', href: 'mailto:inquiries@arsarealestate.com' },
              { label: 'New York',    value: '740 Park Avenue, Suite 12A',    icon: '📍', href: '#' },
              { label: 'Los Angeles', value: '9200 Wilshire Blvd, Penthouse', icon: '📍', href: '#' },
            ].map((c) => (
              <div key={c.label} className="flex gap-4 items-start">
                <span className="text-2xl mt-0.5">{c.icon}</span>
                <div>
                  <p className="text-[#2d6a4f] text-xs tracking-widest uppercase font-semibold">{c.label}</p>
                  {c.href !== '#' ? (
                    <a href={c.href} className="text-[#333] font-medium mt-1 block hover:text-[#2d6a4f] transition-colors">
                      {c.value}
                    </a>
                  ) : (
                    <p className="text-[#333] font-medium mt-1">{c.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Social */}
          <div className="mt-10">
            <p className="text-[#111827] text-xs tracking-widest uppercase font-semibold mb-4">Follow Us</p>
            <div className="flex gap-3">
              {[
                { name: 'Facebook',  href: 'https://facebook.com',  icon: '𝐟' },
                { name: 'Instagram', href: 'https://instagram.com', icon: '◎' },
                { name: 'LinkedIn',  href: 'https://linkedin.com',  icon: 'in' },
                { name: 'Twitter',   href: 'https://twitter.com',   icon: '𝕏' },
              ].map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="w-10 h-10 rounded-full bg-[#f8faf9] flex items-center justify-center text-[#2d6a4f] hover:bg-[#2d6a4f] hover:text-white transition-colors font-bold text-sm"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div>
          {status === 'sent' ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 bg-[#f8faf9] rounded-xl">
              <div className="w-16 h-16 rounded-full bg-[#d8f3dc] flex items-center justify-center mb-5 mx-auto">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#2d6a4f" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-display text-2xl mb-3 text-[#111827]">Message Received</h3>
              <p className="text-[#333] text-sm max-w-xs font-medium mb-6">
                Thank you! Our team will contact you within 24 hours.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="text-sm text-[#2d6a4f] font-semibold hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {status === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg font-medium">
                  {errMsg}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#333] text-xs tracking-widest uppercase mb-2 font-medium">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={set('name')}
                    placeholder="Your name"
                    className="w-full bg-white border border-gray-200 text-[#111827] px-4 py-3 text-sm rounded-lg focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 transition-colors placeholder-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-[#333] text-xs tracking-widest uppercase mb-2 font-medium">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder="+1 555 000 0000"
                    className="w-full bg-white border border-gray-200 text-[#111827] px-4 py-3 text-sm rounded-lg focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 transition-colors placeholder-gray-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#333] text-xs tracking-widest uppercase mb-2 font-medium">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={set('email')}
                  placeholder="your@email.com"
                  className="w-full bg-white border border-gray-200 text-[#111827] px-4 py-3 text-sm rounded-lg focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 transition-colors placeholder-gray-300"
                />
              </div>

              <div>
                <label className="block text-[#333] text-xs tracking-widest uppercase mb-2 font-medium">
                  Subject
                </label>
                <select
                  value={form.subject}
                  onChange={set('subject')}
                  className="w-full bg-white border border-gray-200 text-[#111827] px-4 py-3 text-sm rounded-lg focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 transition-colors"
                >
                  <option value="">Select a subject</option>
                  <option>Property Enquiry</option>
                  <option>Schedule a Viewing</option>
                  <option>Investment Advice</option>
                  <option>General Enquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-[#333] text-xs tracking-widest uppercase mb-2 font-medium">
                  Message *
                </label>
                <textarea
                  rows={5}
                  required
                  value={form.message}
                  onChange={set('message')}
                  placeholder="Tell us about your property needs…"
                  className="w-full bg-white border border-gray-200 text-[#111827] px-4 py-3 text-sm rounded-lg focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 transition-colors resize-none placeholder-gray-300"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full bg-[#2d6a4f] text-white text-xs tracking-[0.2em] uppercase font-semibold py-4 rounded-lg hover:bg-[#1b4332] transition-colors active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'sending' ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Sending…
                  </span>
                ) : 'Send Message'}
              </button>

              <p className="text-[#333] text-xs text-center tracking-wider font-medium">
                All inquiries treated with strict confidence
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
