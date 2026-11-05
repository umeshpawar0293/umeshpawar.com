import { useState, useEffect } from 'react'

/**
 * useIPadLandscape Hook
 * Detects touch-capable tablet/iPad devices in landscape mode regardless of resolution
 * (covers standard 1024px-1366px, M4 1376px, and iPadOS 'More Space' desktop zoom up to 1700px).
 * Also toggles data-ipad-landscape="true" on <html> for seamless styling synchronization.
 */
export function useIPadLandscape() {
  const [isIPadLandscape, setIsIPadLandscape] = useState(() => {
    if (typeof window === 'undefined') return false
    const isTouchDevice =
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) ||
      'ontouchstart' in window ||
      window.matchMedia('(pointer: coarse)').matches
    const isLandscape = window.innerWidth > window.innerHeight
    const isTabletWidth = window.innerWidth >= 1024 && window.innerWidth <= 1700
    return Boolean(isTouchDevice && isLandscape && isTabletWidth)
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkIPadLandscape = () => {
      const isTouchDevice =
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) ||
        'ontouchstart' in window ||
        window.matchMedia('(pointer: coarse)').matches
      const isLandscape = window.innerWidth > window.innerHeight
      const isTabletWidth = window.innerWidth >= 1024 && window.innerWidth <= 1700

      const matched = Boolean(isTouchDevice && isLandscape && isTabletWidth)
      setIsIPadLandscape(matched)

      if (matched) {
        document.documentElement.dataset.ipadLandscape = 'true'
      } else {
        delete document.documentElement.dataset.ipadLandscape
      }
    }

    checkIPadLandscape()

    let t1 = null
    let t2 = null
    const handleOrientationChange = () => {
      checkIPadLandscape()
      if (t1) clearTimeout(t1)
      if (t2) clearTimeout(t2)
      t1 = setTimeout(checkIPadLandscape, 50)
      t2 = setTimeout(checkIPadLandscape, 200)
    }

    window.addEventListener('resize', checkIPadLandscape, { passive: true })
    window.addEventListener('orientationchange', handleOrientationChange, { passive: true })

    return () => {
      if (t1) clearTimeout(t1)
      if (t2) clearTimeout(t2)
      window.removeEventListener('resize', checkIPadLandscape)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  return isIPadLandscape
}

export const useCompactLandscape = useIPadLandscape
export default useIPadLandscape

