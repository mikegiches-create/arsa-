import { useState, useRef } from 'react'
import {
  propertiesApi, categoriesApi, locationsApi, agentsApi, uploadApi,
  Property, Category, Location, Agent,
} from '../../services/api'
import { useApi } from '../../hooks/useApi'
import {
  PageLoader, ErrorBanner, EmptyState, Modal, ConfirmModal,
  StatusBadge, PageHeader, Table, Btn, Field, inputCls, Pagination,
} from '../../components/admin/ui'
import ImageUpload from '../../components/admin/ImageUpload'
import { imgFallback } from '../../utils/imgFallback'

const TYPES    = ['APARTMENT','HOUSE','VILLA','TOWNHOUSE','COMMERCIAL','LAND','OTHER']
const STATUSES = ['AVAILABLE','SOLD','RENTED','PENDING','ARCHIVED']

const EMPTY: Partial<Property> = {
  title: '', description: '', price: 0, type: 'APARTMENT', status: 'AVAILABLE',
  address: '', city: '', state: '', zipCode: '', country: '',
  bedrooms: 1, bathrooms: 1, squareFeet: 0, thumbnail: '', images: [],
  categoryId: '', locationId: '', agentId: '', featured: false,
}

// ── Small gallery upload button used inside the form ──────────────────────────
function GalleryUploadBtn({ onUploaded }: { onUploaded: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setBusy(true)
    try {
      const res = await uploadApi.upload(file)
      onUploaded(res.url)
    } catch {}
    finally { setBusy(false) }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#2d6a4f]/10 text-[#2d6a4f] rounded-lg text-xs font-semibold hover:bg-[#2d6a4f]/20 transition-colors disabled:opacity-50"
      >
        {busy ? (
          <><span className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#2d6a4f]" /> Uploading…</>
        ) : (
          <>⬆ Upload from device</>
        )}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handle} />
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Properties() {
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<Property | null>(null)
  const [deleting, setDeleting] = useState<Property | null>(null)
  const [form, setForm]         = useState<Partial<Property>>(EMPTY)
  const [gallery, setGallery]   = useState<string[]>([])
  const [newUrl, setNewUrl]     = useState('')
  const [saving, setSaving]     = useState(false)
  const [formErr, setFormErr]   = useState('')

  const { data, loading, error, refetch } = useApi(
    () => propertiesApi.list({ page, limit: 10, search }), [page, search]
  )
  const { data: cats }     = useApi(() => categoriesApi.list(1, 100), [])
  const { data: locs }     = useApi(() => locationsApi.list(1, 100), [])
  const { data: agentRes } = useApi(() => agentsApi.list(1, 100), [])

  const categories: Category[] = cats?.data     ?? []
  const locations:  Location[] = locs?.data     ?? []
  const agents:     Agent[]    = agentRes?.data ?? []

  const openAdd = () => {
    setEditing(null)
    setForm({
      ...EMPTY,
      categoryId: categories[0]?.id ?? '',
      locationId: locations[0]?.id  ?? '',
      agentId:    agents[0]?.id     ?? '',
    })
    setGallery([])
    setFormErr('')
    setShowForm(true)
  }

  const openEdit = (p: Property) => {
    setEditing(p)
    setForm({ ...p })
    setGallery(Array.isArray(p.images) ? (p.images as string[]) : [])
    setFormErr('')
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setFormErr('')
    try {
      const payload = { ...form, images: gallery }
      editing
        ? await propertiesApi.update(editing.id, payload)
        : await propertiesApi.create(payload)
      setShowForm(false)
      refetch()
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try { await propertiesApi.delete(deleting.id); setDeleting(null); refetch() } catch {}
  }

  const set = (k: keyof Property, v: any) => setForm(f => ({ ...f, [k]: v }))

  const addToGallery = (url: string) => {
    if (url.trim() && !gallery.includes(url.trim())) {
      setGallery(g => [...g, url.trim()])
    }
    setNewUrl('')
  }

  const total      = data?.pagination.total ?? 0
  const totalPages = data?.pagination.totalPages ?? 1

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        subtitle={`${total} listings`}
        action={<Btn onClick={openAdd}>+ Add Property</Btn>}
      />

      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1) }}
        placeholder="Search properties…"
        className="w-full sm:max-w-sm px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20"
      />

      {loading && <PageLoader />}
      {error   && <ErrorBanner message={error} onRetry={refetch} />}

      {!loading && !error && (
        <>
          <Table headers={['Property', 'Price', 'Type', 'Status', 'Beds/Baths', 'Actions']}>
            {(data?.data ?? []).map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" onError={imgFallback} />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl shrink-0">⌂</div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-[#111827] max-w-[180px] truncate">{p.title}</p>
                      <p className="text-xs text-gray-500">{p.city}, {p.country}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm font-bold text-[#2d6a4f] whitespace-nowrap">
                  KES {Number(p.price).toLocaleString()}
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{p.type}</td>
                <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{p.bedrooms}bd / {p.bathrooms}ba</td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-2">
                    <Btn size="sm" variant="outline" onClick={() => openEdit(p)}>Edit</Btn>
                    <Btn size="sm" variant="danger"  onClick={() => setDeleting(p)}>Del</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </Table>

          {(data?.data ?? []).length === 0 && (
            <EmptyState icon="⌂" title="No properties found" action={<Btn onClick={openAdd}>+ Add Property</Btn>} />
          )}

          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <Modal
          title={editing ? 'Edit Property' : 'Add Property'}
          onClose={() => setShowForm(false)}
          size="lg"
        >
          <form onSubmit={handleSave} className="space-y-5">
            {formErr && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-2.5 rounded-lg font-medium">{formErr}</div>
            )}

            {/* Thumbnail */}
            <ImageUpload
              label="Thumbnail Image"
              value={form.thumbnail ?? ''}
              onChange={url => set('thumbnail', url)}
              shape="square"
              hint="Main listing image — shown in cards and search results"
            />

            {/* Gallery */}
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">
                Gallery Images
                <span className="ml-2 text-xs font-normal text-gray-400">({gallery.length} added)</span>
              </label>

              {gallery.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {gallery.map((url, i) => (
                    <div key={i} className="relative group w-20 h-20 shrink-0">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" onError={imgFallback} />
                      <button
                        type="button"
                        onClick={() => setGallery(g => g.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border border-dashed border-gray-200 rounded-xl p-4 space-y-3">
                <GalleryUploadBtn onUploaded={addToGallery} />
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-gray-400">or</span>
                  <input
                    type="url"
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToGallery(newUrl))}
                    placeholder="Paste image URL and press Enter…"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#2d6a4f]"
                  />
                  <Btn size="sm" type="button" variant="outline" onClick={() => addToGallery(newUrl)} disabled={!newUrl}>Add</Btn>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Title" className="sm:col-span-2">
                <input className={inputCls} value={form.title ?? ''} onChange={e => set('title', e.target.value)} required />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <textarea className={inputCls} rows={3} value={form.description ?? ''} onChange={e => set('description', e.target.value)} required />
              </Field>
              <Field label="Price (KES)">
                <input type="number" min={0} className={inputCls} value={form.price ?? 0} onChange={e => set('price', parseFloat(e.target.value))} required />
              </Field>
              <Field label="Type">
                <select className={inputCls} value={form.type ?? ''} onChange={e => set('type', e.target.value)}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className={inputCls} value={form.status ?? ''} onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Year Built">
                <input type="number" className={inputCls} value={form.yearBuilt ?? ''} onChange={e => set('yearBuilt', parseInt(e.target.value))} placeholder="e.g. 2020" />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <input className={inputCls} value={form.address ?? ''} onChange={e => set('address', e.target.value)} required />
              </Field>
              <Field label="City">
                <input className={inputCls} value={form.city ?? ''} onChange={e => set('city', e.target.value)} required />
              </Field>
              <Field label="State">
                <input className={inputCls} value={form.state ?? ''} onChange={e => set('state', e.target.value)} required />
              </Field>
              <Field label="Zip Code">
                <input className={inputCls} value={form.zipCode ?? ''} onChange={e => set('zipCode', e.target.value)} required />
              </Field>
              <Field label="Country">
                <input className={inputCls} value={form.country ?? ''} onChange={e => set('country', e.target.value)} required />
              </Field>
              <Field label="Bedrooms">
                <input type="number" min={0} className={inputCls} value={form.bedrooms ?? 1} onChange={e => set('bedrooms', parseInt(e.target.value))} required />
              </Field>
              <Field label="Bathrooms">
                <input type="number" min={0} className={inputCls} value={form.bathrooms ?? 1} onChange={e => set('bathrooms', parseInt(e.target.value))} required />
              </Field>
              <Field label="Square Feet">
                <input type="number" min={0} className={inputCls} value={form.squareFeet ?? 0} onChange={e => set('squareFeet', parseInt(e.target.value))} required />
              </Field>
              <Field label="Featured">
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input type="checkbox" checked={!!form.featured} onChange={e => set('featured', e.target.checked)} className="w-4 h-4 accent-[#2d6a4f]" />
                  <span className="text-sm text-gray-600">Mark as featured</span>
                </label>
              </Field>
              <Field label="Category">
                <select className={inputCls} value={form.categoryId ?? ''} onChange={e => set('categoryId', e.target.value)} required>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Location">
                <select className={inputCls} value={form.locationId ?? ''} onChange={e => set('locationId', e.target.value)} required>
                  <option value="">Select location</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </Field>
              <Field label="Agent" className="sm:col-span-2">
                <select className={inputCls} value={form.agentId ?? ''} onChange={e => set('agentId', e.target.value)} required>
                  <option value="">Select agent</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}
                </select>
              </Field>
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <Btn type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Property' : 'Create Property'}
              </Btn>
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmModal
          title="Delete Property"
          message={`Delete "${deleting.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
