import { useState, useEffect } from 'react'
import { FEATURED_AGENTS } from '../data/constants'
import { agentsApi } from '../../services/api'
import { imgFallback, avatarFallback } from '../../utils/imgFallback'
import agentFallback from '../../assets/WhatsApp-Image-2023-05-22-at-12.17.27-768x1024.jpeg'

interface DisplayAgent {
  id: string
  name: string
  title: string
  properties: number
  image: string
  phone: string
  rating: string
}

export default function Agents() {
  const [agents, setAgents] = useState<DisplayAgent[]>(
    FEATURED_AGENTS.map(a => ({
      id: String(a.id),
      name: a.name,
      title: a.title,
      properties: a.properties,
      image: a.image,
      phone: a.phone,
      rating: '4.9',
    }))
  )

  useEffect(() => {
    agentsApi.list(1, 6)
      .then(res => {
        if (res.data && res.data.length > 0) {
          setAgents(
            res.data.map(a => ({
              id: a.id,
              name: `${a.firstName} ${a.lastName}`,
              title: a.license ? `Licensed Agent · ${a.license}` : 'Real Estate Agent',
              properties: a.propertyCount ?? 0,
              image: a.avatar || '',
              phone: a.phone,
              rating: '4.9',
            }))
          )
        }
      })
      .catch(() => {}) // keep static fallback
  }, [])

  return (
    <section id="agents" className="py-24 px-6 md:px-16 bg-[#f8faf9]">
      {/* Header */}
      <div className="text-center mb-16">
        <p className="text-[#2d6a4f] text-xs tracking-[0.25em] uppercase mb-4 font-medium">
          Our Team
        </p>
        <h2 className="font-display text-4xl md:text-5xl text-[#111827]">
          Featured<br />
          <em>Agents</em>
        </h2>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
          >
            {/* Photo */}
            <div className="relative h-56 overflow-hidden bg-gray-100">
              <img
                src={agent.image || agentFallback}
                alt={agent.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                onError={avatarFallback(agent.name)}
                loading="lazy"
              />
            </div>

            {/* Info */}
            <div className="p-6">
              <h3 className="font-display text-xl text-[#111827] mb-0.5">{agent.name}</h3>
              <p className="text-[#2d6a4f] text-sm font-semibold mb-4">{agent.title}</p>

              <div className="flex justify-between mb-5 pb-5 border-b border-gray-100">
                <div>
                  <div className="text-xl font-display text-[#2d6a4f]">{agent.properties}</div>
                  <div className="text-gray-500 text-xs font-medium">Properties</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-display text-[#2d6a4f]">{agent.rating}★</div>
                  <div className="text-gray-500 text-xs font-medium">Rating</div>
                </div>
              </div>

              {/* Contact button — tel: is intentional for phones, fallback scrolls to contact */}
              <a
                href={agent.phone ? `tel:${agent.phone}` : '#contact'}
                onClick={!agent.phone ? (e) => {
                  e.preventDefault()
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
                } : undefined}
                className="block w-full text-center bg-[#2d6a4f] text-white text-xs tracking-widest uppercase font-semibold py-2.5 rounded hover:bg-[#1b4332] transition-colors active:scale-95"
              >
                Contact Agent
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center mt-10">
        <a
          href="#contact"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="inline-block bg-[#2d6a4f] text-white text-xs tracking-widest uppercase font-semibold px-8 py-3 rounded hover:bg-[#1b4332] transition-colors active:scale-95"
        >
          Meet Our Full Team
        </a>
      </div>
    </section>
  )
}
