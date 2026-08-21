import { PageHeader } from '../../components/admin/ui'

export default function Media() {
  return (
    <div className="space-y-6">
      <PageHeader title="Media Library" subtitle="Upload and manage images" />
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center">
        <p className="text-4xl mb-4">🖼️</p>
        <h3 className="font-display text-xl text-[#111827] mb-2">Media Uploads</h3>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">
          Connect a Cloudinary account in Settings to enable image uploads. For now, use external image URLs.
        </p>
      </div>
    </div>
  )
}
