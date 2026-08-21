import { useState } from 'react'
import { STATISTICS } from '../data/constants'
import { imgFallback } from '../../utils/imgFallback'
import heroBg from '../../assets/DG-West-Reception-scaled.webp'

export default function Hero() {
  const [searchType, setSearchType]         = useState<'buy' | 'rent'>('buy')
  const [searchLocation, setSearchLocation] = useState('')
  const [searchPrice, setSearchPrice]       = useState('')
  const [searchPropType, setSearchPropType] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Build query params and scroll to properties section
    const params = new URLSearchParams()
    if (searchLocation) params.set('search', searchLocation)
    if (searchPrice)    params.set('price', searchPrice)
    if (searchPropType) params.set('type', searchPropType)
    params.set('mode', searchType)

    // Dispatch a custom event so FeaturedProperties can pick up filters
    window.dispatchEvent(new CustomEvent('heroSearch', { detail: Object.fromEntries(params) }))

    // Smooth scroll to properties section
    const el = document.getElementById('properties')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-end pb-20 sm:pb-24 overflow-hidden mt-20">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Luxury estate exterior"
          className="w-full h-full object-cover"
          onError={imgFallback}
          loading="eager"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(17,24,39,0.55) 50%, rgba(17,24,39,0.92) 100%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 md:px-16 max-w-5xl w-full">
        <p className="text-[#40916c] text-xs tracking-[0.25em] uppercase mb-5 font-medium">
          Curated Luxury · Exceptional Properties
        </p>
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] mb-6 text-white">
          Where Ambition<br />
          <em className="text-[#40916c] not-italic">Finds Its Home</em>
        </h1>
        <p className="text-white/90 text-base md:text-lg leading-relaxed max-w-xl mb-8">
          ARSA REALESTATE represents the world's finest residential properties matched to discerning
          clients through unparalleled expertise and absolute discretion.
        </p>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="bg-white rounded-xl shadow-xl p-4 sm:p-6 max-w-3xl"
        >
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* Buy / Rent */}
            <div>
              <label className="block text-[#111827] text-[10px] tracking-widest uppercase font-semibold mb-2">
                Type
              </label>
              <div className="flex gap-1">
                {(['buy', 'rent'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSearchType(t)}
                    className={`flex-1 py-2 rounded text-xs font-semibold transition-colors ${
                      searchType === t
                        ? 'bg-[#2d6a4f] text-white'
                        : 'bg-gray-100 text-[#111827] hover:bg-gray-200'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-[#111827] text-[10px] tracking-widest uppercase font-semibold mb-2">
                Location
              </label>
              <input
                type="text"
                placeholder="City or address"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-[#111827] text-[10px] tracking-widest uppercase font-semibold mb-2">
                Price
              </label>
              <select
                value={searchPrice}
                onChange={(e) => setSearchPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#2d6a4f]"
              >
                <option value="">Any Price</option>
                <option value="0-500000">Under KES 500k</option>
                <option value="500000-1000000">KES 500k – 1M</option>
                <option value="1000000-5000000">KES 1M – 5M</option>
                <option value="5000000-999999999">KES 5M+</option>
              </select>
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-[#111827] text-[10px] tracking-widest uppercase font-semibold mb-2">
                Property
              </label>
              <select
                value={searchPropType}
                onChange={(e) => setSearchPropType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#2d6a4f]"
              >
                <option value="">All Types</option>
                <option value="HOUSE">House</option>
                <option value="APARTMENT">Apartment</option>
                <option value="VILLA">Villa</option>
                <option value="LAND">Land</option>
                <option value="COMMERCIAL">Commercial</option>
              </select>
            </div>

            {/* Submit */}
            <div className="flex flex-col justify-end">
              <button
                type="submit"
                className="bg-[#2d6a4f] text-white py-2 rounded font-semibold text-sm hover:bg-[#1b4332] transition-colors active:scale-95"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-7">
          <a
            href="#properties"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="inline-block bg-[#2d6a4f] text-white text-xs tracking-[0.2em] uppercase font-semibold px-8 py-4 rounded hover:bg-[#1b4332] transition-colors active:scale-95"
          >
            Explore Properties
          </a>
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="inline-block border border-white/50 text-white text-xs tracking-[0.2em] uppercase px-8 py-4 rounded hover:border-[#40916c] hover:text-[#40916c] transition-colors active:scale-95"
          >
            Our Story
          </a>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="absolute bottom-0 right-0 hidden lg:flex bg-white/95 backdrop-blur-sm shadow-lg">
        {STATISTICS.map((s, i) => (
          <div key={i} className="px-8 py-5 border-l border-gray-100 text-right">
            <div className="font-display text-2xl text-[#2d6a4f]">{s.value}</div>
            <div className="text-[#333333] text-xs tracking-widest uppercase mt-1 font-medium">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
