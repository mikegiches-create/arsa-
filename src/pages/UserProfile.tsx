import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { usersApi } from '../services/api'

export default function UserProfile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    email:     user?.email     || '',
    phone:     user?.phone     || '',
  })

  const fullName = user ? `${user.firstName} ${user.lastName}` : '—'

  const handleLogout = () => { logout(); navigate('/') }

  const handleSave = async () => {
    setSaving(true)
    try {
      await usersApi.updateProfile(formData)
      setEditMode(false)
    } catch {}
    finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 md:px-10 py-5 flex items-center justify-between gap-4">
        <div>
          <Link to="/" className="text-xs text-[#2d6a4f] font-semibold hover:underline mb-1 block">← Back to Home</Link>
          <h1 className="font-display text-2xl text-[#111827]">My Profile</h1>
        </div>
        <button
          onClick={handleLogout}
          className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
        >
          Logout
        </button>
      </div>

      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Avatar card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-[#2d6a4f] flex items-center justify-center text-white font-display text-3xl mx-auto mb-4">
              {user?.firstName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <h2 className="font-display text-xl text-[#111827] mb-0.5">{fullName}</h2>
            <p className="text-gray-500 text-sm mb-3">{user?.email}</p>
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
              {user?.role}
            </span>
          </div>

          {/* Account info */}
          <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg text-[#111827]">Account Information</h3>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-sm text-[#2d6a4f] font-semibold hover:underline"
                >
                  Edit
                </button>
              )}
            </div>

            {editMode ? (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'First Name', key: 'firstName' as const },
                    { label: 'Last Name',  key: 'lastName'  as const },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-[#111827] mb-1">{label}</label>
                      <input
                        type="text"
                        value={formData[key]}
                        onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2d6a4f] text-sm"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111827] mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2d6a4f] text-sm"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] text-sm font-semibold disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <dl className="space-y-3">
                {[
                  { label: 'First Name', value: user?.firstName },
                  { label: 'Last Name',  value: user?.lastName },
                  { label: 'Email',      value: user?.email },
                  { label: 'Phone',      value: user?.phone || '—' },
                  { label: 'Role',       value: user?.role },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-4">
                    <dt className="text-sm text-gray-500 w-28 shrink-0">{label}</dt>
                    <dd className="text-sm font-semibold text-[#111827]">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-display text-lg text-[#111827] mb-4">Preferences</h3>
          <div className="space-y-3">
            {[
              'Email notifications for new properties',
              'Email notifications for saved searches',
              'Marketing emails and offers',
            ].map((label, i) => (
              <label key={label} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked={i < 2} className="w-4 h-4 accent-[#2d6a4f]" />
                <span className="text-[#111827] text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
