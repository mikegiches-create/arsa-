import { useState } from 'react'
import { locationsApi, Location } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import {
  PageLoader, ErrorBanner, EmptyState, Modal, ConfirmModal,
  PageHeader, Table, Btn, Field, inputCls, Pagination,
} from '../../components/admin/ui'

const EMPTY: Partial<Location> = { name: '', slug: '', description: '', image: '' }

export default function Locations() {
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<Location | null>(null)
  const [deleting, setDeleting] = useState<Location | null>(null)
  const [form, setForm]         = useState<Partial<Location>>(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [formErr, setFormErr]   = useState('')

  const { data, loading, error, refetch } = useApi(
    () => locationsApi.list(page, 15, search), [page, search]
  )

  const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setFormErr(''); setShowForm(true) }
  const openEdit = (l: Location) => { setEditing(l); setForm({ ...l }); setFormErr(''); setShowForm(true) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setFormErr('')
    try {
      editing ? await locationsApi.update(editing.id, form) : await locationsApi.create(form)
      setShowForm(false); refetch()
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try { await locationsApi.delete(deleting.id); setDeleting(null); refetch() } catch {}
  }

  const set = (k: keyof Location, v: any) => setForm(f => ({ ...f, [k]: v }))
  const total = data?.pagination.total ?? 0
  const totalPages = data?.pagination.totalPages ?? 1

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        subtitle={`${total} locations`}
        action={<Btn onClick={openAdd}>+ Add Location</Btn>}
      />

      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1) }}
        placeholder="Search locations…"
        className="w-full sm:max-w-xs px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20"
      />

      {loading && <PageLoader />}
      {error   && <ErrorBanner message={error} onRetry={refetch} />}

      {!loading && !error && (
        <>
          {/* Card grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.data ?? []).map(l => (
              <div key={l.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-36 bg-gray-100">
                  {l.image
                    ? <img src={l.image} alt={l.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl">◎</div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <p className="font-semibold">{l.name}</p>
                    <p className="text-xs text-white/70">{l.propertyCount ?? 0} properties</p>
                  </div>
                </div>
                <div className="p-3 flex gap-2">
                  <Btn size="sm" variant="outline" onClick={() => openEdit(l)} className="flex-1">Edit</Btn>
                  <Btn size="sm" variant="danger"  onClick={() => setDeleting(l)} className="flex-1">Delete</Btn>
                </div>
              </div>
            ))}
          </div>

          {(data?.data ?? []).length === 0 && (
            <EmptyState icon="◎" title="No locations yet" action={<Btn onClick={openAdd}>+ Add Location</Btn>} />
          )}

          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Location' : 'Add Location'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            {formErr && <div className="bg-red-50 text-red-700 text-sm px-4 py-2.5 rounded-lg font-medium">{formErr}</div>}
            <Field label="Name">
              <input
                className={inputCls}
                value={form.name ?? ''}
                onChange={e => set('name', e.target.value)}
                onBlur={e => !editing && !form.slug && set('slug', slugify(e.target.value))}
                required
              />
            </Field>
            <Field label="Slug">
              <input className={inputCls} value={form.slug ?? ''} onChange={e => set('slug', slugify(e.target.value))} required />
            </Field>
            <Field label="Image URL">
              <input className={inputCls} value={form.image ?? ''} onChange={e => set('image', e.target.value)} placeholder="https://…" />
            </Field>
            <Field label="Description">
              <textarea className={inputCls} rows={2} value={form.description ?? ''} onChange={e => set('description', e.target.value)} />
            </Field>
            <div className="flex gap-3 pt-2">
              <Btn type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</Btn>
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmModal
          title="Delete Location"
          message={`Delete "${deleting.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
