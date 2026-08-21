import { useState } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Newsletter() {
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('sending')
    setErrMsg('')
    try {
      const res  = await fetch(`${BASE_URL}/newsletter/subscribe`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Subscription failed')
      setStatus('sent')
      setEmail('')
    } catch (err) {
      setStatus('error')
      setErrMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <section className="py-20 px-6 md:px-16 bg-gradient-to-r from-[#2d6a4f] to-[#1b4332]">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-display text-4xl md:text-5xl text-white mb-3">
          Stay Updated
        </h2>
        <p className="text-white/85 text-lg mb-8">
          Get the latest property listings and real estate insights delivered to your inbox.
        </p>

        {status === 'sent' ? (
          <div className="bg-white/15 border border-white/30 rounded-xl p-6 text-white">
            <p className="text-2xl mb-2">✓</p>
            <p className="text-lg font-semibold">You're subscribed!</p>
            <p className="text-sm text-white/80 mt-1">
              Check your inbox for a welcome email. Expect curated updates — never spam.
            </p>
            <button
              onClick={() => { setStatus('idle'); setEmail('') }}
              className="mt-4 text-xs text-white/60 hover:text-white underline"
            >
              Subscribe another address
            </button>
          </div>
        ) : (
          <>
            {status === 'error' && (
              <div className="bg-red-500/20 border border-red-400/40 text-white text-sm rounded-lg px-4 py-3 mb-4">
                {errMsg}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder="Enter your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 px-5 py-3 rounded-lg text-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-[#40916c] placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={status === 'sending'}
                className="bg-white text-[#2d6a4f] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors active:scale-95 disabled:opacity-60 whitespace-nowrap text-sm"
              >
                {status === 'sending' ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2d6a4f]" />
                    Subscribing…
                  </span>
                ) : 'Subscribe'}
              </button>
            </form>
          </>
        )}

        <p className="text-white/60 text-xs mt-5">
          We respect your privacy. Unsubscribe anytime via the link in any email.
        </p>
      </div>
    </section>
  )
}
