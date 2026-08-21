import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { properties as staticProperties } from '../data/properties'
import { PROPERTY_FILTERS } from '../data/constants'
import { propertiesApi } from '../../services/api'
import { imgFallback } from '../../utils/imgFallback'
import fallbackImg from '../../assets/DG-West-Sitting-room.webp'

interface DisplayProperty {
  id: string | number
  title: string
  location: string
  price: string
  beds: number
  baths: number
  sqft: string
  type: string
  tag: string
  img: string
  status?: string
}

// Map backend property → display shape
function mapApiProperty(p: any): DisplayProperty {
  return {
    id:       p.id,
    title:    p.title,
    location: `${p.city}, ${p.country}`,
    price:    `KES ${Number(p.price).toLocaleString()}`,
    beds:     p.bedrooms,
    baths:    p.bathrooms,
    sqft:     Number(p.squareFeet).toLocaleString(),
    type:     p.type,
    tag:      p.featured ? 'Featured' : p.status ?? 'Available',
    img:      p.thumbnail || '',
    status:   p.status,
  }
}

// Static properties already have the right shape
const staticMapped: DisplayProperty[] = staticProperties.map(p => ({
  id:       String(p.id),
  title:    p.title,
  location: (p as any).location ?? '',
  price:    String(p.price),
  beds:     p.beds,
  baths:    p.baths,
  sqft:     String(p.sqft),
  type:     p.type,
  tag:      p.tag,
  img:      p.img,
}))

export default function FeaturedProperties() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [properties, setProperties]     = useState<DisplayProperty[]>(staticMapped)
  const [loading, setLoading]           = useState(true)
  const [selectedProp, setSelectedProp] = useState<DisplayProperty | null>(null)

  // Load from API, fall back to static on error
  const loadProperties = useCallback(async () => {
    try {
      const res = await propertiesApi.list({ limit: 12 })
      if (res.data && res.data.length > 0) {
        setProperties(res.data.map(mapApiProperty))
      }
    } catch {
      // backend not running — keep static fallback
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProperties() }, [loadProperties])

  // Listen for heroSearch events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.search) setActiveFilter('All')
      // Could extend: apply type filter from detail.type
    }
    window.addEventListener('heroSearch', handler)
    return () => window.removeEventListener('heroSearch', handler)
  }, [])

  const filtered =
    activeFilter === 'All'
      ? properties
      : properties.filter(
          (p) =>
            p.type.toLowerCase() === activeFilter.toLowerCase() ||
            p.tag.toLowerCase()  === activeFilter.toLowerCase() ||
            p.type === activeFilter
        )

  const tagColor: Record<string, string> = {
    Featured:  'bg-[#2d6a4f]',
    New:       'bg-blue-600',
    Exclusive: 'bg-amber-600',
    AVAILABLE: 'bg-[#2d6a4f]',
    SOLD:      'bg-gray-500',
    RENTED:    'bg-blue-600',
    PENDING:   'bg-amber-500',
  }

  return (
    <section id="properties" className="py-24 px-6 md:px-16 bg-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
        <div>
          <p className="text-[#2d6a4f] text-xs tracking-[0.25em] uppercase mb-4 font-medium">
            Our Portfolio
          </p>
          <h2 className="font-display text-4xl md:text-5xl green-line text-[#111827]">
            Signature<br />
            <em>Residences</em>
          </h2>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {PROPERTY_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`text-xs tracking-[0.15em] uppercase px-4 py-2 rounded border transition-all font-medium ${
                activeFilter === f
                  ? 'border-[#2d6a4f] bg-[#2d6a4f] text-white'
                  : 'border-gray-300 text-[#333] hover:border-[#2d6a4f] hover:text-[#2d6a4f]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-gray-100 animate-pulse">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-5 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <article
              key={p.id}
              onClick={() => setSelectedProp(p)}
              className="property-card group cursor-pointer rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 bg-white"
            >
              {/* Image */}
              <div className="relative overflow-hidden aspect-[4/3] bg-gray-100">
                <img
                  src={p.img || fallbackImg}
                  alt={p.title}
                  className="property-img w-full h-full object-cover transition-transform duration-700"
                  onError={imgFallback}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/70 via-transparent to-transparent" />
                <span
                  className={`absolute top-4 left-4 text-white text-[10px] tracking-[0.2em] uppercase font-semibold px-3 py-1 rounded ${
                    tagColor[p.tag] ?? 'bg-[#2d6a4f]'
                  }`}
                >
                  {p.tag}
                </span>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="font-display text-xl text-white leading-tight">{p.title}</p>
                  <p className="text-white/80 text-xs tracking-wider mt-0.5">{p.location}</p>
                </div>
              </div>

              {/* Details */}
              <div className="bg-white px-5 py-4 flex items-center justify-between">
                <div className="font-display text-lg text-[#2d6a4f] font-semibold">{p.price}</div>
                <div className="flex gap-4 text-[#333] text-xs tracking-wider font-medium">
                  <span>{p.beds} bd</span>
                  <span>{p.baths} ba</span>
                  <span>{p.sqft} ft²</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No properties found for this filter.</p>
          <button
            onClick={() => setActiveFilter('All')}
            className="mt-4 text-[#2d6a4f] font-semibold hover:underline"
          >
            Show all
          </button>
        </div>
      )}

      {/* View All */}
      <div className="text-center mt-12">
        <Link
          to="/properties"
          className="inline-block bg-[#2d6a4f] text-white text-xs tracking-widest uppercase font-semibold px-8 py-3 rounded hover:bg-[#1b4332] transition-colors active:scale-95"
        >
          View All Properties
        </Link>
      </div>

      {/* ── Property Detail Modal ── */}
      {selectedProp && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedProp(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="relative aspect-[16/9] shrink-0">
              <img
                src={selectedProp.img || fallbackImg}
                alt={selectedProp.title}
                className="w-full h-full object-cover"
                onError={imgFallback}
              />
              <button
                onClick={() => setSelectedProp(null)}
                className="absolute top-4 right-4 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center text-[#111827] hover:bg-white font-bold shadow-md"
              >
                ✕
              </button>
              <span className="absolute top-4 left-4 bg-[#2d6a4f] text-white text-xs font-semibold px-3 py-1 rounded uppercase tracking-wider">
                {selectedProp.tag}
              </span>
            </div>

            {/* Details */}
            <div className="p-6 overflow-y-auto">
              <h2 className="font-display text-2xl text-[#111827] mb-1">{selectedProp.title}</h2>
              <p className="text-gray-500 text-sm mb-4">{selectedProp.location}</p>

              <div className="grid grid-cols-3 gap-4 bg-[#f8faf9] rounded-xl p-4 mb-5">
                <div className="text-center">
                  <p className="text-2xl font-display text-[#2d6a4f]">{selectedProp.beds}</p>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Bedrooms</p>
                </div>
                <div className="text-center border-x border-gray-200">
                  <p className="text-2xl font-display text-[#2d6a4f]">{selectedProp.baths}</p>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Bathrooms</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-display text-[#2d6a4f]">{selectedProp.sqft}</p>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">Sq Ft</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="font-display text-3xl text-[#2d6a4f]">{selectedProp.price}</p>
                <a
                  href="#contact"
                  onClick={() => {
                    setSelectedProp(null)
                    setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }), 100)
                  }}
                  className="bg-[#2d6a4f] text-white text-xs tracking-widest uppercase font-semibold px-6 py-3 rounded hover:bg-[#1b4332] transition-colors"
                >
                  Enquire Now
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
