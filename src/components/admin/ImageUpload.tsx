import { useRef, useState } from 'react'
import { uploadApi } from '../../services/api'
import { imgFallback } from '../../utils/imgFallback'

interface Props {
  value: string        // current URL (controlled)
  onChange: (url: string) => void
  label?: string
  shape?: 'square' | 'circle'  // circle for avatars, square for thumbnails
  hint?: string
}

export default function ImageUpload({
  value,
  onChange,
  label = 'Image',
  shape = 'square',
  hint,
}: Props) {
  const inputRef             = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError]    = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5 MB')
      return
    }
    setError('')
    setUploading(true)
    try {
      const result = await uploadApi.upload(file)
      onChange(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // reset so same file can be re-selected
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const isCircle = shape === 'circle'

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-[#111827] mb-1.5">{label}</label>
      )}

      <div className="flex items-start gap-4">
        {/* Preview */}
        <div
          className={`shrink-0 bg-gray-100 overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center ${
            isCircle
              ? 'w-20 h-20 rounded-full'
              : 'w-24 h-24 rounded-xl'
          }`}
        >
          {value ? (
            <img
              src={value}
              alt="preview"
              className="w-full h-full object-cover"
              onError={imgFallback}
            />
          ) : (
            <span className="text-gray-300 text-3xl">
              {isCircle ? '◉' : '🖼'}
            </span>
          )}
        </div>

        {/* Drop zone + controls */}
        <div className="flex-1 min-w-0">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed transition-colors px-4 py-5 text-center ${
              dragOver
                ? 'border-[#2d6a4f] bg-[#2d6a4f]/5'
                : 'border-gray-200 hover:border-[#2d6a4f] hover:bg-gray-50'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2d6a4f]" />
                <p className="text-xs text-gray-500 font-medium">Uploading…</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-[#2d6a4f]">
                  Click to upload
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  or drag & drop · JPG, PNG, WebP · max 5 MB
                </p>
              </>
            )}
          </div>

          {/* URL input — also allow pasting a URL directly */}
          <div className="mt-2 flex gap-2">
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="…or paste an image URL"
              className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-xs text-[#111827] focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 placeholder-gray-300"
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-2 py-2 text-xs text-red-500 hover:text-red-700 border border-gray-200 rounded-lg hover:bg-red-50 transition-colors"
                title="Clear image"
              >
                ✕
              </button>
            )}
          </div>

          {hint && !error && (
            <p className="text-xs text-gray-400 mt-1">{hint}</p>
          )}
          {error && (
            <p className="text-xs text-red-600 font-medium mt-1">{error}</p>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  )
}
