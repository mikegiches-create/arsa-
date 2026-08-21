import { useState } from 'react'
import { messagesApi, Message } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import {
  PageLoader, ErrorBanner, EmptyState, Modal, ConfirmModal,
  PageHeader, Table, Btn, StatusBadge, Pagination,
} from '../../components/admin/ui'

const STATUSES = ['', 'UNREAD', 'READ', 'REPLIED', 'ARCHIVED']

export default function Messages() {
  const [page, setPage]         = useState(1)
  const [filter, setFilter]     = useState('')
  const [viewing, setViewing]   = useState<Message | null>(null)
  const [deleting, setDeleting] = useState<Message | null>(null)

  const { data, loading, error, refetch } = useApi(
    () => messagesApi.list(page, 15, filter), [page, filter]
  )

  const handleView = async (m: Message) => {
    setViewing(m)
    if (m.status === 'UNREAD') {
      try { await messagesApi.updateStatus(m.id, 'READ'); refetch() } catch {}
    }
  }

  const handleStatus = async (m: Message, status: string) => {
    try { await messagesApi.updateStatus(m.id, status); refetch() } catch {}
  }

  const handleDelete = async () => {
    if (!deleting) return
    try { await messagesApi.delete(deleting.id); setDeleting(null); refetch() } catch {}
  }

  const total = data?.pagination.total ?? 0
  const totalPages = data?.pagination.totalPages ?? 1

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" subtitle={`${total} messages`} />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(1) }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === s
                ? 'bg-[#2d6a4f] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading && <PageLoader />}
      {error   && <ErrorBanner message={error} onRetry={refetch} />}

      {!loading && !error && (
        <>
          <Table headers={['From', 'Subject', 'Property', 'Status', 'Date', 'Actions']}>
            {(data?.data ?? []).map(m => (
              <tr
                key={m.id}
                className={`hover:bg-gray-50 transition-colors cursor-pointer ${m.status === 'UNREAD' ? 'font-semibold' : ''}`}
                onClick={() => handleView(m)}
              >
                <td className="px-5 py-3.5">
                  <p className="text-sm text-[#111827]">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.email}</p>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-700 max-w-[200px] truncate">{m.subject}</td>
                <td className="px-5 py-3.5 text-xs text-gray-400">{m.property?.title ?? '—'}</td>
                <td className="px-5 py-3.5"><StatusBadge status={m.status} /></td>
                <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(m.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-2">
                    <select
                      value={m.status}
                      onChange={e => handleStatus(m, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#2d6a4f]"
                    >
                      {['UNREAD','READ','REPLIED','ARCHIVED'].map(s => <option key={s}>{s}</option>)}
                    </select>
                    <Btn size="sm" variant="danger" onClick={() => setDeleting(m)}>Del</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </Table>

          {(data?.data ?? []).length === 0 && (
            <EmptyState icon="✉" title="No messages found" />
          )}

          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}

      {/* View message modal */}
      {viewing && (
        <Modal title="Message" onClose={() => setViewing(null)}>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase mb-1">From</p>
                <p className="font-semibold text-[#111827]">{viewing.name}</p>
                <p className="text-gray-500">{viewing.email}</p>
                {viewing.phone && <p className="text-gray-500">{viewing.phone}</p>}
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Details</p>
                <p className="text-gray-500">Status: <StatusBadge status={viewing.status} /></p>
                <p className="text-gray-500 mt-1">{new Date(viewing.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Subject</p>
              <p className="font-semibold text-[#111827]">{viewing.subject}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Message</p>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                {viewing.body}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              {['READ','REPLIED','ARCHIVED'].map(s => (
                <Btn
                  key={s}
                  size="sm"
                  variant={viewing.status === s ? 'primary' : 'outline'}
                  onClick={async () => {
                    await handleStatus(viewing, s)
                    setViewing({ ...viewing, status: s as Message['status'] })
                  }}
                >
                  {s}
                </Btn>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmModal
          title="Delete Message"
          message={`Delete message from "${deleting.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
