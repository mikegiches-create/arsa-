import { useState } from 'react'
import { testimonialsApi, Testimonial } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import {
  PageLoader, ErrorBanner, EmptyState, Modal, ConfirmModal,
  PageHeader, Btn, Field, inputCls, Pagination,
} from '../../components/admin/ui'

const EMPTY = { content: '', rating: 5 }

export default function Testimonials() {
  const [page, setPage]         = useState(1)
  const [featFilter, setFeat]   = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<Testimonial | null>(null)
  const [deleting, setDeleting] = useState<Testimonial | null>(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [formErr, setFormErr]   = useState('')

  const { data, loading, error, refetch } = useApi(
    () => testimonialsApi.list(page, 12, featFilter || undefined), [page, featFilter]
  )

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setFormErr(''); setShowForm(true) }
  const openEdit = (t: Testimonial) => {
    setEditing(t); setForm({ content: t.content, rating: t.rating }); setFormErr(''); setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setFormErr('')
    try {
      if (editing) {
        await testimonialsApi.update(editing.id, form)
      } else {
        await testimonialsApi.create(form)
      }
      setShowForm(false); refetch()
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  const toggleFeatured = async (t: Testimonial) => {
    try { await testimonialsApi.toggleFeatured(t.id); refetch() } catch {}
  }

  const handleDelete = async () => {
    if (!deleting) return
    try { await testimonialsApi.delete(deleting.id); setDeleting(null); refetch() } catch {}
  }

  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)
  const total = data?.pagination.total ?? 0
  const totalPages = data?.pagination.totalPages ?? 1

  return (
    <div className="space-y-6">
      <PageHeader
        title="Testimonials"
        subtitle={`${total} reviews`}
        action={<Btn onClick={openAdd}>+ Add Review</Btn>}
      />

      <div className="flex gap-3 items-center">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={featFilter}
            onChange={e => { setFeat(e.target.checked); setPage(1) }}
            className="accent-[#2d6a4f]"
          />
          Featured only
        </label>
      </div>

      {loading && <PageLoader />}
      {error   && <ErrorBanner message={error} onRetry={refetch} />}

      {!loading && !error && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.data ?? []).map(t => (
              <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {t.author?.avatar
                      ? <img src={t.author.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                      : <div className="w-9 h-9 rounded-full bg-[#2d6a4f] flex items-center justify-center text-white text-sm font-bold">{t.author?.firstName?.[0] ?? '?'}</div>
                    }
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">
                        {t.author?.firstName} {t.author?.lastName}
                      </p>
                      <p className="text-xs text-amber-500">{stars(t.rating)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFeatured(t)}
                    title="Toggle featured"
                    className={`text-lg transition-opacity ${t.featured ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
                  >
                    ★
                  </button>
                </div>

                <p className="text-sm text-gray-600 line-clamp-4 flex-1">"{t.content}"</p>

                <div className="flex gap-2 pt-1 border-t border-gray-100">
                  <Btn size="sm" variant="outline" onClick={() => openEdit(t)} className="flex-1">Edit</Btn>
                  <Btn size="sm" variant="danger"  onClick={() => setDeleting(t)} className="flex-1">Del</Btn>
                </div>
              </div>
            ))}
          </div>

          {(data?.data ?? []).length === 0 && (
            <EmptyState icon="★" title="No testimonials yet" action={<Btn onClick={openAdd}>+ Add Review</Btn>} />
          )}

          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Review' : 'Add Review'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            {formErr && <div className="bg-red-50 text-red-700 text-sm px-4 py-2.5 rounded-lg font-medium">{formErr}</div>}
            <Field label="Content">
              <textarea
                className={inputCls}
                rows={4}
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                required
              />
            </Field>
            <Field label="Rating (1–5)">
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, rating: n }))}
                    className={`text-2xl transition-opacity ${n <= form.rating ? 'opacity-100' : 'opacity-30'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </Field>
            <div className="flex gap-3 pt-2">
              <Btn type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Submit'}</Btn>
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmModal
          title="Delete Review"
          message="Delete this testimonial permanently?"
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
