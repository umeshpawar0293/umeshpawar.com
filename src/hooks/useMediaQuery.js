import { useState, useEffect } from 'react'

/**
 * Custom hook to detect media query matches (e.g. mobile breakpoint)
 * @param {string} query - CSS media query string, e.g. '(max-width: 768px)'
 * @returns {boolean} Whether the media query currently matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQueryList = window.matchMedia(query)
    const listener = (event) => setMatches(event.matches)

    // Set initial match state
    setMatches(mediaQueryList.matches)

    mediaQueryList.addEventListener?.('change', listener)
    return () => mediaQueryList.removeEventListener?.('change', listener)
  }, [query])

  return matches
}

export default useMediaQuery
