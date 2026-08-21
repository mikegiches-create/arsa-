import { useState, useEffect } from 'react'
import { FEATURED_LOCATIONS } from '../data/constants'
import { locationsApi } from '../../services/api'
import { imgFallback } from '../../utils/imgFallback'
import locationFallback from '../../assets/IMG-20250408-WA0009.jpg'

interface DisplayLocation {
  id: string
  name: string
  properties: number
  image: string
}

export default function FeaturedLocations() {
  const [locations, setLocations] = useState<DisplayLocation[]>(
    FEATURED_LOCATIONS.map((l, i) => ({
      id: String(i),
      name: l.city,
      properties: l.properties,
      image: l.image,
    }))
  )

  useEffect(() => {
    locationsApi.list(1, 8)
      .then(res => {
        if (res.data && res.data.length > 0) {
          setLocations(
            res.data.map(l => ({
              id: l.id,
              name: l.name,
              properties: l.propertyCount ?? 0,
              image: l.image || '',
            }))
          )
        }
      })
      .catch(() => {}) // keep static fallback
  }, [])

  const scrollToProperties = () => {
    document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="locations" className="py-24 px-6 md:px-16 bg-white">
      {/* Header */}
      <div className="text-center mb-16">
        <p className="text-[#2d6a4f] text-xs tracking-[0.25em] uppercase mb-4 font-medium">
          Explore Markets
        </p>
        <h2 className="font-display text-4xl md:text-5xl text-[#111827]">
          Featured<br />
          <em>Locations</em>
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {locations.map((loc) => (
          <button
            key={loc.id}
            onClick={scrollToProperties}
            className="group text-left rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:ring-offset-2"
          >
            <div className="relative overflow-hidden aspect-square bg-gray-100">
              <img
                src={loc.image || locationFallback}
                alt={loc.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={imgFallback}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/80 via-[#111827]/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-display text-xl text-white leading-tight">{loc.name}</h3>
                <p className="text-white/75 text-sm mt-0.5 font-medium">
                  {loc.properties} {loc.properties === 1 ? 'property' : 'properties'}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center mt-10">
        <button
          onClick={scrollToProperties}
          className="inline-block bg-[#2d6a4f] text-white text-xs tracking-widest uppercase font-semibold px-8 py-3 rounded hover:bg-[#1b4332] transition-colors active:scale-95"
        >
          Explore All Cities
        </button>
      </div>
    </section>
  )
}
