import { useState, useEffect } from 'react'
import { settingsApi } from '../../services/api'
import { PageLoader, ErrorBanner, Btn } from '../../components/admin/ui'
import { useApi } from '../../hooks/useApi'

const KEYS = [
  { key: 'site_name',        label: 'Site Name',         type: 'text',  group: 'General' },
  { key: 'site_description', label: 'Site Description',  type: 'text',  group: 'General' },
  { key: 'logo_url',         label: 'Logo URL',           type: 'url',   group: 'General' },
  { key: 'contact_email',    label: 'Contact Email',      type: 'email', group: 'Contact' },
  { key: 'contact_phone',    label: 'Contact Phone',      type: 'text',  group: 'Contact' },
]

const GROUPS = [...new Set(KEYS.map(k => k.group))]

export default function Settings() {
  const { data, loading, error, refetch } = useApi(() => settingsApi.list(), [])
  const [local, setLocal]   = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [saveErr, setSaveErr] = useState('')

  useEffect(() => {
    if (data?.data) setLocal(data.data)
  }, [data])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setSaveErr(''); setSaved(false)
    try {
      await settingsApi.updateMultiple(local)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      refetch()
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  if (loading) return <PageLoader />
  if (error)   return <ErrorBanner message={error} onRetry={refetch} />

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl text-[#111827]">Settings</h2>
        <p className="text-gray-500 mt-1 text-sm">Configure your platform settings</p>
      </div>

      {saveErr && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg font-medium">{saveErr}</div>}
      {saved   && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg font-medium">✓ Settings saved successfully</div>}

      <form onSubmit={handleSave} className="space-y-6">
        {GROUPS.map(group => (
          <div key={group} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-[#111827] text-sm uppercase tracking-wide">{group}</h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              {KEYS.filter(k => k.group === group).map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-[#111827] mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={local[key] ?? ''}
                    onChange={e => setLocal(l => ({ ...l, [key]: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Raw key/value editor for any extra settings */}
        {Object.keys(local).filter(k => !KEYS.find(d => d.key === k)).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-[#111827] text-sm uppercase tracking-wide">Other</h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              {Object.entries(local)
                .filter(([k]) => !KEYS.find(d => d.key === k))
                .map(([k, v]) => (
                  <div key={k}>
                    <label className="block text-xs font-mono text-gray-400 mb-1">{k}</label>
                    <input
                      value={v}
                      onChange={e => setLocal(l => ({ ...l, [k]: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20"
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

        <Btn type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save All Settings'}
        </Btn>
      </form>
    </div>
  )
}
