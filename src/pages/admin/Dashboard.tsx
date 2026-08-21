import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  propertiesApi, agentsApi, usersApi, messagesApi,
  testimonialsApi, Property, Message,
} from '../../services/api'
import { PageLoader, ErrorBanner, StatusBadge } from '../../components/admin/ui'

interface Stats {
  properties: number
  agents: number
  users: number
  testimonials: number
  unreadMessages: number
}

export default function Dashboard() {
  const [stats, setStats]           = useState<Stats | null>(null)
  const [recentProps, setRecentProps] = useState<Property[]>([])
  const [recentMsgs, setRecentMsgs]   = useState<Message[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [props, agents, users, testi, msgs, unread] = await Promise.all([
          propertiesApi.list({ page: 1, limit: 5 }),
          agentsApi.list(1, 1),
          usersApi.list(1, 1),
          testimonialsApi.list(1, 1),
          messagesApi.list(1, 5),
          messagesApi.unreadCount(),
        ])
        setStats({
          properties:     props.pagination.total,
          agents:         agents.pagination.total,
          users:          users.pagination.total,
          testimonials:   testi.pagination.total,
          unreadMessages: unread.data.count,
        })
        setRecentProps(props.data)
        setRecentMsgs(msgs.data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <PageLoader />
  if (error)   return <ErrorBanner message={error} />

  const statCards = [
    { label: 'Properties',   value: stats!.properties,     icon: '⌂',  color: 'bg-blue-50   border-blue-200',   text: 'text-blue-600',   href: '/admin/properties' },
    { label: 'Agents',       value: stats!.agents,         icon: '◉',  color: 'bg-green-50  border-green-200',  text: 'text-green-600',  href: '/admin/agents' },
    { label: 'Users',        value: stats!.users,          icon: '◑',  color: 'bg-purple-50 border-purple-200', text: 'text-purple-600', href: '/admin/users' },
    { label: 'Testimonials', value: stats!.testimonials,   icon: '★',  color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-600', href: '/admin/testimonials' },
    { label: 'Unread Msgs',  value: stats!.unreadMessages, icon: '✉',  color: 'bg-red-50    border-red-200',    text: 'text-red-600',    href: '/admin/messages' },
  ]

  return (
    <div className="space-y-7">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl text-[#111827]">Dashboard</h2>
        <p className="text-gray-500 mt-1 text-sm">Live overview of your platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map(s => (
          <Link
            key={s.label}
            to={s.href}
            className={`${s.color} border rounded-xl p-4 hover:shadow-md transition-shadow group`}
          >
            <div className={`text-2xl mb-2 ${s.text}`}>{s.icon}</div>
            <p className="font-display text-2xl sm:text-3xl text-[#111827]">{s.value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent Properties */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-display text-lg text-[#111827]">Recent Properties</h3>
            <Link to="/admin/properties" className="text-xs font-semibold text-[#2d6a4f] hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentProps.length === 0 && (
              <p className="px-6 py-8 text-center text-gray-400 text-sm">No properties yet</p>
            )}
            {recentProps.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt={p.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl shrink-0">⌂</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.city}, {p.country}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#2d6a4f]">KES {p.price.toLocaleString()}</p>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-display text-lg text-[#111827]">Recent Messages</h3>
            <Link to="/admin/messages" className="text-xs font-semibold text-[#2d6a4f] hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentMsgs.length === 0 && (
              <p className="px-6 py-8 text-center text-gray-400 text-sm">No messages yet</p>
            )}
            {recentMsgs.map(m => (
              <div key={m.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[#111827] truncate">{m.name}</p>
                  <StatusBadge status={m.status} />
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{m.subject}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(m.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Add Property',  href: '/admin/properties', icon: '+⌂' },
          { label: 'Add Agent',     href: '/admin/agents',     icon: '+◉' },
          { label: 'Add Category',  href: '/admin/categories', icon: '+⊞' },
          { label: 'Add Location',  href: '/admin/locations',  icon: '+◎' },
        ].map(q => (
          <Link
            key={q.label}
            to={q.href}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-[#2d6a4f] hover:shadow-sm transition-all group"
          >
            <span className="text-[#2d6a4f] text-sm font-bold">{q.icon}</span>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-[#2d6a4f]">{q.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
