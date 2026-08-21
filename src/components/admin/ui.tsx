import { ReactNode } from 'react'

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full border-b-2 border-[#2d6a4f] ${className}`} />
  )
}

// ─── PageLoader ───────────────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner className="h-10 w-10" />
    </div>
  )
}

// ─── ErrorBanner ─────────────────────────────────────────────────────────────
export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center justify-between gap-4">
      <p className="text-red-700 text-sm font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 text-sm font-semibold text-red-700 underline hover:no-underline"
        >
          Retry
        </button>
      )}
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({
  icon = '📭',
  title,
  action,
}: {
  icon?: string
  title: string
  action?: ReactNode
}) {
  return (
    <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-gray-500 font-semibold mb-4">{title}</p>
      {action}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({
  title,
  children,
  onClose,
  size = 'md',
}: {
  title: string
  children: ReactNode
  onClose: () => void
  size?: 'sm' | 'md' | 'lg'
}) {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 shrink-0">
          <h3 className="font-display text-xl text-[#111827]">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors text-lg"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
      </div>
    </div>
  )
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
export function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  danger = true,
}: {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-display text-xl text-[#111827] mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-[#111827] hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#2d6a4f] hover:bg-[#1b4332]'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  SOLD:      'bg-gray-100  text-gray-600',
  RENTED:    'bg-blue-100  text-blue-700',
  PENDING:   'bg-yellow-100 text-yellow-700',
  ARCHIVED:  'bg-red-100   text-red-700',
  UNREAD:    'bg-blue-100  text-blue-700',
  READ:      'bg-gray-100  text-gray-600',
  REPLIED:   'bg-green-100 text-green-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-red-100   text-red-700',
  ADMIN:     'bg-purple-100 text-purple-700',
  USER:      'bg-blue-100  text-blue-700',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        statusColors[status] ?? 'bg-gray-100 text-gray-600'
      }`}
    >
      {status}
    </span>
  )
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl text-[#111827]">{title}</h2>
        {subtitle && <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// ─── Input helpers ────────────────────────────────────────────────────────────
export const inputCls =
  'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 transition-all placeholder-gray-400'

export const labelCls = 'block text-sm font-semibold text-[#111827] mb-1.5'

export function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

// ─── Btn ──────────────────────────────────────────────────────────────────────
export function Btn({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
}) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-5 py-2.5 text-sm' }
  const variants = {
    primary: 'bg-[#2d6a4f] text-white hover:bg-[#1b4332]',
    outline: 'border-2 border-[#2d6a4f] text-[#2d6a4f] hover:bg-[#2d6a4f]/10',
    danger:  'bg-red-600 text-white hover:bg-red-700',
    ghost:   'text-gray-600 hover:bg-gray-100',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

// ─── Table ───────────────────────────────────────────────────────────────────
export function Table({
  headers,
  children,
  className = '',
}: {
  headers: string[]
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {headers.map(h => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">{children}</tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ← Prev
      </button>
      <span className="text-sm text-gray-600 px-2">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next →
      </button>
    </div>
  )
}
