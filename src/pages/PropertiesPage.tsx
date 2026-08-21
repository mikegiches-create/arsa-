import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { propertiesApi, categoriesApi, locationsApi, Property, Category, Location } from '../services/api'
import { imgFallback } from '../utils/imgFallback'
import fallbackImg from '../assets/DG-West-Sitting-room.webp'
import Header from '../components/sections/Header'
import Footer from '../components/sections/Footer'

// ── Enquiry modal ─────────────────────────────────────────────────────────────
function PropertyModal({ prop, onClose }: { prop: Property; onClose: () => void }) {
  const [imgIdx, setImgIdx] = useState(0)
  const images = [
    ...(prop.thumbnail ? [prop.thumbnail] : []),
    ...(Array.isArray(prop.images) ? (prop.images as string[]).filter(u => u !== prop.thumbnail) : []),
  ]

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Image carousel */}
        <div className="relative aspect-[16/9] bg-gray-100 shrink-0">
          <img
            src={images[imgIdx] || fallbackImg}
            alt={prop.title}
            className="w-full h-full object-cover"
            onError={imgFallback}
          />
          {/* close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center font-bold text-[#111827] hover:bg-white shadow-md transition-colors"
          >✕</button>
          {/* badge */}
          <span className="absolute top-3 left-3 bg-[#2d6a4f] text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
            {prop.status}
          </span>
          {/* nav arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 rounded-full flex items-center justify-center font-bold text-[#111827] hover:bg-white shadow transition-colors"
              >‹</button>
              <button
                onClick={() => setImgIdx(i => (i + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 rounded-full flex items-center justify-center font-bold text-[#111827] hover:bg-white shadow transition-colors"
              >›</button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? 'bg-white w-4' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Details */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-[#111827]">{prop.title}</h2>
              <p className="text-gray-500 text-sm mt-0.5">📍 {prop.address}, {prop.city}, {prop.country}</p>
            </div>
            <p className="font-display text-2xl text-[#2d6a4f] shrink-0">KES {Number(prop.price).toLocaleString()}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Bedrooms',  value: prop.bedrooms },
              { label: 'Bathrooms', value: prop.bathrooms },
              { label: 'Sq Ft',     value: Number(prop.squareFeet).toLocaleString() },
            ].map(s => (
              <div key={s.label} className="bg-[#f8faf9] rounded-xl p-3 text-center">
                <p className="font-display text-xl text-[#2d6a4f]">{s.value}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-2">
            {[
              prop.type,
              prop.category?.name,
              prop.location?.name,
              prop.yearBuilt ? `Built ${prop.yearBuilt}` : null,
            ].filter(Boolean).map(v => (
              <span key={v} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">{v}</span>
            ))}
          </div>

          {prop.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{prop.description}</p>
          )}

          {/* Agent */}
          {prop.agent && (
            <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
              <div className="w-10 h-10 rounded-full bg-[#2d6a4f] flex items-center justify-center text-white font-bold shrink-0">
                {prop.agent.firstName[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111827]">
                  {prop.agent.firstName} {prop.agent.lastName}
                </p>
                <p className="text-xs text-gray-500">{prop.agent.phone}</p>
              </div>
              <a
                href="#contact"
                onClick={() => {
                  onClose()
                  setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }), 200)
                }}
                className="ml-auto bg-[#2d6a4f] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#1b4332] transition-colors"
              >
                Enquire
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [properties, setProperties] = useState<Property[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [locations,  setLocations]  = useState<Location[]>([])
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState<Property | null>(null)

  // Filter state synced with URL params
  const page       = parseInt(searchParams.get('page')  || '1')
  const search     = searchParams.get('search')     || ''
  const categoryId = searchParams.get('category')   || ''
  const locationId = searchParams.get('location')   || ''
  const type       = searchParams.get('type')        || ''
  const status     = searchParams.get('status')      || 'AVAILABLE'
  const minPrice   = searchParams.get('minPrice')    || ''
  const maxPrice   = searchParams.get('maxPrice')    || ''
  const sortBy     = searchParams.get('sortBy')      || 'createdAt'
  const sortOrder  = searchParams.get('sortOrder')   || 'desc'

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value); else next.delete(key)
    if (key !== 'page') next.set('page', '1')
    setSearchParams(next)
  }

  const loadProperties = useCallback(async () => {
    setLoading(true)
    try {
      const res = await propertiesApi.list({
        page, limit: 12,
        search:     search     || undefined,
        categoryId: categoryId || undefined,
        locationId: locationId || undefined,
        type:       type       || undefined,
        status:     status     || undefined,
        minPrice:   minPrice   ? parseFloat(minPrice)   : undefined,
        maxPrice:   maxPrice   ? parseFloat(maxPrice)   : undefined,
        sortBy, sortOrder,
      })
      setProperties(res.data)
      setTotal(res.pagination.total)
      setTotalPages(res.pagination.totalPages)
    } catch {}
    finally { setLoading(false) }
  }, [page, search, categoryId, locationId, type, status, minPrice, maxPrice, sortBy, sortOrder])

  useEffect(() => { loadProperties() }, [loadProperties])

  // Load filter options once
  useEffect(() => {
    categoriesApi.list(1, 100).then(r => setCategories(r.data)).catch(() => {})
    locationsApi.list(1, 100).then(r => setLocations(r.data)).catch(() => {})
  }, [])

  const clearFilters = () => {
    setSearchParams(new URLSearchParams({ page: '1' }))
  }

  const hasFilters = search || categoryId || locationId || type || minPrice || maxPrice

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero bar */}
      <div className="mt-20 bg-[#0f1923] py-12 px-6 md:px-16">
        <p className="text-[#40916c] text-xs tracking-[0.25em] uppercase mb-3 font-medium">Our Portfolio</p>
        <h1 className="font-display text-4xl md:text-5xl text-white">
          All Properties
        </h1>
        <p className="text-white/60 mt-2 text-sm">
          {total > 0 ? `${total} properties found` : 'Searching…'}
        </p>
      </div>

      <div className="px-6 md:px-16 py-10 max-w-8xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Sidebar filters ── */}
          <aside className="lg:w-64 shrink-0 space-y-5">
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5 sticky top-24">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#111827] text-sm">Filters</h3>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-[#2d6a4f] font-semibold hover:underline">
                    Clear all
                  </button>
                )}
              </div>

              {/* Search */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Search</label>
                <input
                  type="text"
                  value={search}
                  onChange={e => setParam('search', e.target.value)}
                  placeholder="Title, city, address…"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2d6a4f]"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={e => setParam('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2d6a4f]"
                >
                  <option value="">All</option>
                  {['AVAILABLE','SOLD','RENTED','PENDING'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Property Type</label>
                <select
                  value={type}
                  onChange={e => setParam('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2d6a4f]"
                >
                  <option value="">All Types</option>
                  {['APARTMENT','HOUSE','VILLA','TOWNHOUSE','COMMERCIAL','LAND','OTHER'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              {categories.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
                  <select
                    value={categoryId}
                    onChange={e => setParam('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2d6a4f]"
                  >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {/* Location */}
              {locations.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Location</label>
                  <select
                    value={locationId}
                    onChange={e => setParam('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2d6a4f]"
                  >
                    <option value="">All Locations</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              )}

              {/* Price range */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Price Range (KES)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    value={minPrice}
                    onChange={e => setParam('minPrice', e.target.value)}
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2d6a4f]"
                  />
                  <input
                    type="number"
                    min={0}
                    value={maxPrice}
                    onChange={e => setParam('maxPrice', e.target.value)}
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2d6a4f]"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sort By</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={e => {
                    const [col, order] = e.target.value.split('-')
                    const next = new URLSearchParams(searchParams)
                    next.set('sortBy', col); next.set('sortOrder', order); next.set('page', '1')
                    setSearchParams(next)
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2d6a4f]"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="views-desc">Most Viewed</option>
                </select>
              </div>
            </div>
          </aside>

          {/* ── Results ── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-gray-100 animate-pulse">
                    <div className="aspect-[4/3] bg-gray-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-24 bg-gray-50 rounded-2xl border border-gray-200">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-lg font-semibold text-gray-600 mb-2">No properties found</p>
                <p className="text-sm text-gray-400 mb-6">Try adjusting your search or filters</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2.5 bg-[#2d6a4f] text-white rounded-lg font-semibold text-sm hover:bg-[#1b4332] transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {properties.map(p => (
                    <article
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className="group cursor-pointer bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                        <img
                          src={p.thumbnail || fallbackImg}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={imgFallback}
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/60 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          <span className="bg-[#2d6a4f] text-white text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
                            {p.status}
                          </span>
                          {p.featured && (
                            <span className="bg-amber-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
                              Featured
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-3 left-4 right-4">
                          <p className="font-display text-lg text-white leading-tight line-clamp-1">{p.title}</p>
                          <p className="text-white/75 text-xs mt-0.5">📍 {p.city}, {p.country}</p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-display text-xl text-[#2d6a4f] font-semibold">
                            KES {Number(p.price).toLocaleString()}
                          </p>
                          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded font-medium">
                            {p.type}
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-500 font-medium">
                          <span>🛏 {p.bedrooms} bd</span>
                          <span>🚿 {p.bathrooms} ba</span>
                          <span>📐 {Number(p.squareFeet).toLocaleString()} ft²</span>
                        </div>
                        {p.agent && (
                          <p className="text-xs text-gray-400 mt-2 truncate">
                            Agent: {p.agent.firstName} {p.agent.lastName}
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => setParam('page', String(page - 1))}
                      disabled={page <= 1}
                      className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >← Prev</button>

                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      const p = totalPages <= 7 ? i + 1 : i + Math.max(1, page - 3)
                      if (p > totalPages) return null
                      return (
                        <button
                          key={p}
                          onClick={() => setParam('page', String(p))}
                          className={`w-9 h-9 text-sm font-semibold rounded-lg transition-colors ${
                            p === page
                              ? 'bg-[#2d6a4f] text-white'
                              : 'border border-gray-300 hover:bg-gray-50 text-[#111827]'
                          }`}
                        >{p}</button>
                      )
                    })}

                    <button
                      onClick={() => setParam('page', String(page + 1))}
                      disabled={page >= totalPages}
                      className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {selected && <PropertyModal prop={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
