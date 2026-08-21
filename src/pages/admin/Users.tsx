import { useState } from 'react'
import { usersApi, BackendUser } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import {
  PageLoader, ErrorBanner, EmptyState, ConfirmModal,
  PageHeader, Table, Btn, StatusBadge, Pagination,
} from '../../components/admin/ui'

export default function Users() {
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<BackendUser | null>(null)

  const { data, loading, error, refetch } = useApi(
    () => usersApi.list(page, 15, search), [page, search]
  )

  const handleDelete = async () => {
    if (!deleting) return
    try { await usersApi.delete(deleting.id); setDeleting(null); refetch() } catch {}
  }

  const total = data?.pagination.total ?? 0
  const totalPages = data?.pagination.totalPages ?? 1

  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle={`${total} registered users`} />

      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1) }}
        placeholder="Search by name or email…"
        className="w-full sm:max-w-sm px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20"
      />

      {loading && <PageLoader />}
      {error   && <ErrorBanner message={error} onRetry={refetch} />}

      {!loading && !error && (
        <>
          <Table headers={['User', 'Email', 'Role', 'Status', 'Joined', 'Actions']}>
            {(data?.data ?? []).map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#2d6a4f] flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {u.firstName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-sm font-semibold text-[#111827]">
                      {u.firstName} {u.lastName}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-500">{u.email}</td>
                <td className="px-5 py-3.5"><StatusBadge status={u.role} /></td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-400">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5">
                  {u.role !== 'ADMIN' && (
                    <Btn size="sm" variant="danger" onClick={() => setDeleting(u)}>Del</Btn>
                  )}
                </td>
              </tr>
            ))}
          </Table>

          {(data?.data ?? []).length === 0 && (
            <EmptyState icon="◑" title="No users found" />
          )}

          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      {deleting && (
        <ConfirmModal
          title="Delete User"
          message={`Delete user "${deleting.email}"? This is irreversible.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
