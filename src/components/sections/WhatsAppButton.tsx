import { useLocation } from 'react-router-dom'

export default function WhatsAppButton() {
  const location = useLocation()

  // Hide button on admin pages and login
  if (location.pathname.startsWith('/admin') || location.pathname === '/login') {
    return null
  }

  const whatsappNumber = '0795308101'
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hello%20ARSA%20REALESTATE`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-3 sm:px-5 sm:py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
      aria-label="Chat with us on WhatsApp"
    >
      {/* Official WhatsApp Logo */}
      <svg
        className="w-5 h-5 sm:w-6 sm:h-6"
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.547 4.129 1.512 5.87L.256 23.744 6.13 22.488C7.87 23.453 9.876 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm6.211 16.501c-.275.797-.958 1.45-1.838 1.676-1.184.305-2.805-.187-4.373-1.379-2.301-1.768-3.767-5.008-3.88-8.268-.125-3.616 2.066-6.957 5.442-7.54 1.089-.19 2.133.223 2.884.909.75.687 1.178 1.625 1.178 2.624 0 1.088-.464 2.151-1.287 2.974-.82.82-1.92 1.276-3.095 1.276-.62 0-1.204.254-1.615.691-.411.438-.637 1.021-.637 1.621 0 .6.226 1.183.637 1.621.411.437.995.691 1.615.691 1.175 0 2.275.456 3.095 1.276.823.823 1.287 1.886 1.287 2.974 0 .999-.428 1.937-1.178 2.624z" />
      </svg>

      {/* Text - hidden on mobile, shown on larger screens */}
      <span className="hidden sm:inline text-sm font-semibold">Chat with us</span>
    </a>
  )
}
