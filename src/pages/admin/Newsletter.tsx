import { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import {
  PageHeader, PageLoader, ErrorBanner, EmptyState,
  Table, Btn, Modal, Field, inputCls, Pagination,
} from '../../components/admin/ui'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function authHeader() {
  const token = localStorage.getItem('authToken')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

async function apiGet<T>(path: string): Promise<T> {
  const res  = await fetch(`${BASE_URL}${path}`, { headers: authHeader() })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || 'Request failed')
  return data
}

async function apiPost<T>(path: string, body: object): Promise<T> {
  const res  = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers: authHeader(), body: JSON.stringify(body) })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || 'Request failed')
  return data
}

interface Stats {
  total: number
  active: number
  unsubscribed: number
  blastsSent: number
}

interface Subscriber {
  id: string
  email: string
  is_active: number
  created_at: string
  unsubscribed_at?: string
}

interface Blast {
  id: string
  subject: string
  content: string
  recipientCount: number
  sentBy: string
  createdAt: string
}

export default function Newsletter() {
  const [tab, setTab]             = useState<'overview' | 'subscribers' | 'blasts'>('overview')
  const [stats, setStats]         = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Blast form
  const [showBlast, setShowBlast] = useState(false)
  const [blastForm, setBlastForm] = useState({ subject: '', content: '' })
  const [sending, setSending]     = useState(false)
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; errors?: string[] } | null>(null)
  const [sendErr, setSendErr]     = useState('')

  // SMTP test
  const [testing, setTesting]     = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  // Subscribers list
  const [subPage, setSubPage]     = useState(1)
  const { data: subData, loading: subLoading, error: subError, refetch: refetchSubs } = useApi(
    () => apiGet<any>(`/newsletter/subscribers?page=${subPage}&limit=20`),
    [subPage]
  )

  // Blasts list
  const [blastPage, setBlastPage] = useState(1)
  const { data: blastData, loading: blastLoading, error: blastError, refetch: refetchBlasts } = useApi(
    () => apiGet<any>(`/newsletter/blasts?page=${blastPage}&limit=10`),
    [blastPage]
  )

  // Load stats
  useEffect(() => {
    apiGet<any>('/newsletter/stats')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setStatsLoading(false))
  }, [showBlast])

  const handleTestEmail = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res: any = await apiGet('/newsletter/test-email')
      setTestResult({ ok: true, message: res.message + ` (sent to ${res.data?.to})` })
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : 'Test failed' })
    } finally {
      setTesting(false)
    }
  }

  const handleSendBlast = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true); setSendErr(''); setSendResult(null)
    try {
      const res: any = await apiPost('/newsletter/blast', blastForm)
      setSendResult({ sent: res.data.sent, failed: res.data.failed, errors: res.data.errors })
      setBlastForm({ subject: '', content: '' })
      refetchBlasts()
      // Reload stats
      apiGet<any>('/newsletter/stats').then(r => setStats(r.data)).catch(() => {})
      // Auto-close modal after 4 seconds if no errors
      if (!res.data.errors?.length) {
        setTimeout(() => {
          setShowBlast(false)
          setSendResult(null)
        }, 4000)
      }
    } catch (err) {
      setSendErr(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const TABS = [
    { key: 'overview',    label: 'Overview' },
    { key: 'subscribers', label: `Subscribers${stats ? ` (${stats.active})` : ''}` },
    { key: 'blasts',      label: 'Past Blasts' },
  ] as const

  return (
    <div className="space-y-6">
      <PageHeader
        title="Newsletter"
        subtitle="Manage subscribers and send email campaigns"
        action={<Btn onClick={() => { setShowBlast(true); setSendResult(null); setSendErr('') }}>✉ Send Newsletter</Btn>}
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-white text-[#111827] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {statsLoading ? <PageLoader /> : stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Subscribers', value: stats.total,        color: 'bg-blue-50   border-blue-200',   text: 'text-blue-600' },
                { label: 'Active',            value: stats.active,       color: 'bg-green-50  border-green-200',  text: 'text-green-600' },
                { label: 'Unsubscribed',      value: stats.unsubscribed, color: 'bg-gray-50   border-gray-200',   text: 'text-gray-500' },
                { label: 'Blasts Sent',       value: stats.blastsSent,   color: 'bg-purple-50 border-purple-200', text: 'text-purple-600' },
              ].map(s => (
                <div key={s.label} className={`${s.color} border rounded-xl p-5`}>
                  <p className={`font-display text-3xl ${s.text}`}>{s.value}</p>
                  <p className="text-xs font-semibold text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Could not load stats.</p>
          )}

          <div className="bg-[#f8faf9] border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-[#111827] mb-3">Quick Send</h3>
            <p className="text-sm text-gray-500 mb-4">
              Send a newsletter blast to all {stats?.active ?? '—'} active subscribers.
            </p>
            <Btn onClick={() => { setShowBlast(true); setSendResult(null); setSendErr('') }}>
              ✉ Compose & Send
            </Btn>
          </div>

          {/* SMTP Diagnostics */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-[#111827] mb-1">SMTP Diagnostics</h3>
            <p className="text-sm text-gray-500 mb-4">
              Test that the email server is reachable and credentials are correct.
              A test email will be sent to your admin account.
            </p>

            {testResult && (
              <div className={`text-sm px-4 py-3 rounded-lg font-medium mb-4 ${
                testResult.ok
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50   border border-red-200   text-red-700'
              }`}>
                {testResult.ok ? '✓ ' : '✕ '}{testResult.message}
              </div>
            )}

            <Btn
              variant="outline"
              onClick={handleTestEmail}
              disabled={testing}
            >
              {testing ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2d6a4f]" />
                  Testing SMTP…
                </span>
              ) : '🔌 Test SMTP Connection'}
            </Btn>

            <div className="mt-4 bg-gray-50 rounded-lg p-4 text-xs text-gray-500 space-y-1 font-mono">
              <p>Ensure these env vars are set on the server:</p>
              <p><span className="text-[#2d6a4f]">SMTP_HOST</span> — e.g. smtp.gmail.com</p>
              <p><span className="text-[#2d6a4f]">SMTP_PORT</span> — 587 (TLS) or 465 (SSL)</p>
              <p><span className="text-[#2d6a4f]">SMTP_USER</span> — your Gmail address</p>
              <p><span className="text-[#2d6a4f]">SMTP_PASSWORD</span> — Gmail App Password (not your login password)</p>
              <p><span className="text-[#2d6a4f]">SMTP_FROM</span> — sender address shown in emails</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Subscribers ── */}
      {tab === 'subscribers' && (
        <>
          {subLoading && <PageLoader />}
          {subError   && <ErrorBanner message={subError} onRetry={refetchSubs} />}
          {!subLoading && !subError && (
            <>
              <Table headers={['Email', 'Status', 'Subscribed', 'Unsubscribed']}>
                {(subData?.data ?? []).map((s: Subscriber) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm text-[#111827]">{s.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {s.is_active ? 'Active' : 'Unsubscribed'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {s.unsubscribed_at ? new Date(s.unsubscribed_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </Table>

              {(subData?.data ?? []).length === 0 && (
                <EmptyState icon="📧" title="No subscribers yet" />
              )}

              <Pagination
                page={subPage}
                totalPages={subData?.pagination?.totalPages ?? 1}
                onPage={setSubPage}
              />
            </>
          )}
        </>
      )}

      {/* ── Past Blasts ── */}
      {tab === 'blasts' && (
        <>
          {blastLoading && <PageLoader />}
          {blastError   && <ErrorBanner message={blastError} onRetry={refetchBlasts} />}
          {!blastLoading && !blastError && (
            <>
              <Table headers={['Subject', 'Recipients', 'Sent By', 'Date']}>
                {(blastData?.data ?? []).map((b: Blast) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-semibold text-[#111827] max-w-[220px] truncate">{b.subject}</td>
                    <td className="px-5 py-3 text-sm font-bold text-[#2d6a4f]">{b.recipientCount}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{b.sentBy}</td>
                    <td className="px-5 py-3 text-xs text-gray-400">{new Date(b.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </Table>

              {(blastData?.data ?? []).length === 0 && (
                <EmptyState icon="✉" title="No newsletters sent yet" action={<Btn onClick={() => setShowBlast(true)}>Send first newsletter</Btn>} />
              )}

              <Pagination
                page={blastPage}
                totalPages={blastData?.pagination?.totalPages ?? 1}
                onPage={setBlastPage}
              />
            </>
          )}
        </>
      )}

      {/* ── Compose modal ── */}
      {showBlast && (
        <Modal title="Send Newsletter" onClose={() => setShowBlast(false)} size="lg">
          {sendResult ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">✓</div>
              <h3 className="font-display text-xl text-[#111827]">Newsletter Sent!</h3>
              <p className="text-gray-500 text-sm">
                <span className="text-green-600 font-bold">{sendResult.sent}</span> delivered
                {sendResult.failed > 0 && <>, <span className="text-red-500 font-bold">{sendResult.failed}</span> failed</>}
              </p>
              {sendResult.errors && sendResult.errors.length > 0 && (
                <div className="text-left bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 font-mono space-y-1 max-h-32 overflow-y-auto">
                  {sendResult.errors.map((e, i) => <p key={i}>✕ {e}</p>)}
                </div>
              )}
              <div className="flex gap-3 justify-center pt-2">
                <Btn onClick={() => { setSendResult(null); setBlastForm({ subject: '', content: '' }) }}>
                  Send Another
                </Btn>
                <Btn variant="ghost" onClick={() => setShowBlast(false)}>Close</Btn>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendBlast} className="space-y-5">
              {sendErr && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg font-medium">{sendErr}</div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
                This will be sent to <strong>{stats?.active ?? '…'} active subscribers</strong>.
              </div>

              <Field label="Subject Line">
                <input
                  className={inputCls}
                  value={blastForm.subject}
                  onChange={e => setBlastForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="e.g. New Luxury Listings — August 2026"
                  required
                />
              </Field>

              <Field label="Message">
                <textarea
                  className={inputCls}
                  rows={10}
                  value={blastForm.content}
                  onChange={e => setBlastForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Write your newsletter content here. Plain text or simple HTML."
                  required
                />
              </Field>

              <p className="text-xs text-gray-400">
                An unsubscribe link will be automatically added to every email.
              </p>

              <div className="flex gap-3 pt-1">
                <Btn type="submit" disabled={sending}>
                  {sending ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Sending to {stats?.active ?? '…'} subscribers…
                    </span>
                  ) : `✉ Send to ${stats?.active ?? '…'} Subscribers`}
                </Btn>
                <Btn variant="ghost" onClick={() => setShowBlast(false)}>Cancel</Btn>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  )
}
