/**
 * Attach to an <img> onError to swap in a placeholder.
 * Usage: <img onError={imgFallback} ... />
 */
export const imgFallback = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const target = e.currentTarget
  // avoid infinite loop if placeholder itself fails
  target.onerror = null
  target.src = `https://placehold.co/800x600/f0f4f2/2d6a4f?text=ARSA`
}

/** Square variant for avatars */
export const avatarFallback = (name = '?') => (e: React.SyntheticEvent<HTMLImageElement>) => {
  const target = e.currentTarget
  target.onerror = null
  const initials = encodeURIComponent(name.slice(0, 2).toUpperCase())
  target.src = `https://placehold.co/200x200/2d6a4f/ffffff?text=${initials}`
}
