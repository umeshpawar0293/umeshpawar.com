import { useState, useEffect } from 'react'

/**
 * useIPadPortrait Hook
 * Detects touch-capable tablet/iPad devices in portrait mode
 * (specifically covers legacy 12.9" 1024px, M4 13" 1032px, and Safari toolbars: 980px - 1100px).
 * Also toggles data-ipad-portrait="true" on <html> for styling synchronization.
 */
export function useIPadPortrait() {
  const [isIPadPortrait, setIsIPadPortrait] = useState(() => {
    if (typeof window === 'undefined') return false
    const isTouchDevice =
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      'ontouchstart' in window ||
      window.matchMedia('(pointer: coarse)').matches
    const isPortrait = window.innerHeight > window.innerWidth
    const isTabletPortraitWidth = window.innerWidth >= 980 && window.innerWidth <= 1100
    return Boolean(isTouchDevice && isPortrait && isTabletPortraitWidth)
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkIPadPortrait = () => {
      const isTouchDevice =
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
        'ontouchstart' in window ||
        window.matchMedia('(pointer: coarse)').matches
      const isPortrait = window.innerHeight > window.innerWidth
      const isTabletPortraitWidth = window.innerWidth >= 980 && window.innerWidth <= 1100

      const matched = Boolean(isTouchDevice && isPortrait && isTabletPortraitWidth)
      setIsIPadPortrait(matched)

      if (matched) {
        document.documentElement.dataset.ipadPortrait = 'true'
      } else {
        delete document.documentElement.dataset.ipadPortrait
      }
    }

    checkIPadPortrait()
    window.addEventListener('resize', checkIPadPortrait, { passive: true })
    window.addEventListener('orientationchange', checkIPadPortrait, { passive: true })

    return () => {
      window.removeEventListener('resize', checkIPadPortrait)
      window.removeEventListener('orientationchange', checkIPadPortrait)
    }
  }, [])

  return isIPadPortrait
}

