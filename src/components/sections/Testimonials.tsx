import { useState, useEffect } from 'react'
import { testimonials as staticTestimonials } from '../data/testimonials'
import { testimonialsApi } from '../../services/api'
import { avatarFallback } from '../../utils/imgFallback'
import avatarFallbackImg from '../../assets/WhatsApp-Image-2023-05-22-at-12.17.32-1-768x1024.jpeg'

interface DisplayTestimonial {
  id: string
  name: string
  title: string
  quote: string
  avatar: string
  rating: number
}

export default function Testimonials() {
  const [items, setItems] = useState<DisplayTestimonial[]>(
    staticTestimonials.map((t, i) => ({
      id: String(i),
      name: t.name,
      title: t.title,
      quote: t.quote,
      avatar: t.avatar,
      rating: 5,
    }))
  )

  useEffect(() => {
    testimonialsApi.list(1, 6, true)
      .then(res => {
        if (res.data && res.data.length > 0) {
          setItems(
            res.data.map(t => ({
              id: t.id,
              name: t.author
                ? `${t.author.firstName} ${t.author.lastName}`
                : 'Anonymous',
              title: 'Verified Client',
              quote: t.content,
              avatar: t.author?.avatar || '',
              rating: t.rating,
            }))
          )
        }
      })
      .catch(() => {}) // keep static fallback
  }, [])

  const stars = (n: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < n ? 'text-amber-400' : 'text-gray-200'}>★</span>
    ))

  return (
    <section id="testimonials" className="py-24 px-6 md:px-16 bg-[#f8faf9]">
      {/* Header */}
      <div className="text-center mb-16">
        <p className="text-[#2d6a4f] text-xs tracking-[0.25em] uppercase mb-4 font-medium">
          Client Stories
        </p>
        <h2 className="font-display text-4xl md:text-5xl text-[#111827]">
          Voices of<br />
          <em>Our Clients</em>
        </h2>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {items.map((t) => (
          <div
            key={t.id}
            className="bg-white border border-gray-100 rounded-xl p-7 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col"
          >
            {/* Stars */}
            <div className="flex gap-0.5 text-lg mb-4">{stars(t.rating)}</div>

            {/* Quote */}
            <p className="text-[#333] leading-relaxed text-sm italic font-display font-medium flex-1 mb-6">
              "{t.quote}"
            </p>

            {/* Author */}
            <div className="flex items-center gap-3 border-t border-gray-100 pt-5">
              <img
                src={t.avatar || avatarFallbackImg}
                alt={t.name}
                className="w-11 h-11 rounded-full object-cover shrink-0"
                onError={avatarFallback(t.name)}
                loading="lazy"
              />
              <div>
                <p className="text-sm font-semibold text-[#111827]">{t.name}</p>
                <p className="text-xs text-[#2d6a4f] mt-0.5">{t.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
