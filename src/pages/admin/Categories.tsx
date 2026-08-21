import { useState } from 'react'
import { categoriesApi, Category } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import {
  PageLoader, ErrorBanner, EmptyState, Modal, ConfirmModal,
  PageHeader, Table, Btn, Field, inputCls, Pagination,
} from '../../components/admin/ui'

const EMPTY: Partial<Category> = { name: '', slug: '', description: '', icon: '' }

export default function Categories() {
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [form, setForm]         = useState<Partial<Category>>(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [formErr, setFormErr]   = useState('')

  const { data, loading, error, refetch } = useApi(
    () => categoriesApi.list(page, 15, search), [page, search]
  )

  const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setFormErr(''); setShowForm(true) }
  const openEdit = (c: Category) => { setEditing(c); setForm({ ...c }); setFormErr(''); setShowForm(true) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setFormErr('')
    try {
      editing ? await categoriesApi.update(editing.id, form) : await categoriesApi.create(form)
      setShowForm(false); refetch()
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try { await categoriesApi.delete(deleting.id); setDeleting(null); refetch() } catch {}
  }

  const set = (k: keyof Category, v: any) => setForm(f => ({ ...f, [k]: v }))
  const total = data?.pagination.total ?? 0
  const totalPages = data?.pagination.totalPages ?? 1

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        subtitle={`${total} categories`}
        action={<Btn onClick={openAdd}>+ Add Category</Btn>}
      />

      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1) }}
        placeholder="Search categories…"
        className="w-full sm:max-w-xs px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20"
      />

      {loading && <PageLoader />}
      {error   && <ErrorBanner message={error} onRetry={refetch} />}

      {!loading && !error && (
        <>
          <Table headers={['Icon', 'Name', 'Slug', 'Properties', 'Actions']}>
            {(data?.data ?? []).map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 text-2xl">{c.icon ?? '📂'}</td>
                <td className="px-5 py-3.5 text-sm font-semibold text-[#111827]">{c.name}</td>
                <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">{c.slug}</td>
                <td className="px-5 py-3.5 text-sm font-bold text-[#2d6a4f]">{c.propertyCount ?? 0}</td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-2">
                    <Btn size="sm" variant="outline" onClick={() => openEdit(c)}>Edit</Btn>
                    <Btn size="sm" variant="danger"  onClick={() => setDeleting(c)}>Del</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </Table>

          {(data?.data ?? []).length === 0 && (
            <EmptyState icon="📂" title="No categories yet" action={<Btn onClick={openAdd}>+ Add Category</Btn>} />
          )}

          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Category' : 'Add Category'} onClose={() => setShowForm(false)}>
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
            <Field label="Icon (emoji)">
              <input className={inputCls} value={form.icon ?? ''} onChange={e => set('icon', e.target.value)} placeholder="🏢" maxLength={4} />
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
          title="Delete Category"
          message={`Delete "${deleting.name}"? Properties in this category may be affected.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
