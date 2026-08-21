import { useState } from 'react'
import { agentsApi, Agent } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import {
  PageLoader, ErrorBanner, EmptyState, Modal, ConfirmModal,
  PageHeader, Btn, Field, inputCls, Pagination,
} from '../../components/admin/ui'
import ImageUpload from '../../components/admin/ImageUpload'
import { imgFallback } from '../../utils/imgFallback'

const EMPTY: Partial<Agent> = {
  firstName: '', lastName: '', email: '', phone: '', avatar: '', bio: '', license: '',
}

export default function Agents() {
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<Agent | null>(null)
  const [deleting, setDeleting] = useState<Agent | null>(null)
  const [form, setForm]         = useState<Partial<Agent>>(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [formErr, setFormErr]   = useState('')

  const { data, loading, error, refetch } = useApi(
    () => agentsApi.list(page, 12, search), [page, search]
  )

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setFormErr(''); setShowForm(true) }
  const openEdit = (a: Agent) => { setEditing(a); setForm({ ...a }); setFormErr(''); setShowForm(true) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setFormErr('')
    try {
      editing ? await agentsApi.update(editing.id, form) : await agentsApi.create(form)
      setShowForm(false); refetch()
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try { await agentsApi.delete(deleting.id); setDeleting(null); refetch() } catch {}
  }

  const set = (k: keyof Agent, v: any) => setForm(f => ({ ...f, [k]: v }))
  const total      = data?.pagination.total ?? 0
  const totalPages = data?.pagination.totalPages ?? 1

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents"
        subtitle={`${total} agents`}
        action={<Btn onClick={openAdd}>+ Add Agent</Btn>}
      />

      {/* Search */}
      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1) }}
        placeholder="Search agents…"
        className="w-full sm:max-w-xs px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20"
      />

      {loading && <PageLoader />}
      {error   && <ErrorBanner message={error} onRetry={refetch} />}

      {!loading && !error && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(data?.data ?? []).map(a => (
              <div key={a.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                {/* Card header with avatar */}
                <div className="h-32 bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] flex items-center justify-center relative">
                  {a.avatar ? (
                    <img
                      src={a.avatar}
                      alt={a.firstName}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white/30"
                      onError={imgFallback}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-display">
                      {a.firstName[0]}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-[#111827]">{a.firstName} {a.lastName}</h3>
                  <p className="text-xs text-gray-500 mb-0.5">{a.email}</p>
                  <p className="text-xs text-gray-400 mb-3">{a.phone}</p>
                  {a.license && (
                    <span className="inline-block text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium mb-3">
                      #{a.license}
                    </span>
                  )}
                  <div className="flex gap-2">
                    <Btn size="sm" variant="outline" onClick={() => openEdit(a)} className="flex-1">Edit</Btn>
                    <Btn size="sm" variant="danger"  onClick={() => setDeleting(a)} className="flex-1">Del</Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(data?.data ?? []).length === 0 && (
            <EmptyState icon="◉" title="No agents found" action={<Btn onClick={openAdd}>+ Add Agent</Btn>} />
          )}

          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <Modal title={editing ? 'Edit Agent' : 'Add Agent'} onClose={() => setShowForm(false)} size="lg">
          <form onSubmit={handleSave} className="space-y-5">
            {formErr && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-2.5 rounded-lg font-medium">
                {formErr}
              </div>
            )}

            {/* Avatar upload — full width at the top */}
            <ImageUpload
              label="Agent Photo"
              value={form.avatar ?? ''}
              onChange={url => set('avatar', url)}
              shape="circle"
              hint="Recommended: square image, at least 200×200 px"
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="First Name">
                <input
                  className={inputCls}
                  value={form.firstName ?? ''}
                  onChange={e => set('firstName', e.target.value)}
                  required
                />
              </Field>
              <Field label="Last Name">
                <input
                  className={inputCls}
                  value={form.lastName ?? ''}
                  onChange={e => set('lastName', e.target.value)}
                  required
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  className={inputCls}
                  value={form.email ?? ''}
                  onChange={e => set('email', e.target.value)}
                  required
                />
              </Field>
              <Field label="Phone">
                <input
                  className={inputCls}
                  value={form.phone ?? ''}
                  onChange={e => set('phone', e.target.value)}
                  required
                />
              </Field>
              <Field label="License #">
                <input
                  className={inputCls}
                  value={form.license ?? ''}
                  onChange={e => set('license', e.target.value)}
                />
              </Field>
              <Field label="Bio" className="sm:col-span-2">
                <textarea
                  className={inputCls}
                  rows={3}
                  value={form.bio ?? ''}
                  onChange={e => set('bio', e.target.value)}
                />
              </Field>
            </div>

            <div className="flex gap-3 pt-1">
              <Btn type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Agent' : 'Create Agent'}
              </Btn>
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete confirm ── */}
      {deleting && (
        <ConfirmModal
          title="Delete Agent"
          message={`Delete "${deleting.firstName} ${deleting.lastName}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
