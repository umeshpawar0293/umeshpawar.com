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
    const isPortrait = window.innerHeight > window.innerWidth
    const isTabletPortraitWidth = window.innerWidth >= 768 && window.innerWidth <= 1300
    return Boolean(isPortrait && isTabletPortraitWidth)
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkPortrait = () => {
      const isPortrait = window.innerHeight > window.innerWidth
      const isTabletPortraitWidth = window.innerWidth >= 768 && window.innerWidth <= 1300

      const matched = Boolean(isPortrait && isTabletPortraitWidth)
      setIsIPadPortrait(matched)

      if (matched) {
        document.documentElement.dataset.ipadPortrait = 'true'
      } else {
        delete document.documentElement.dataset.ipadPortrait
      }
    }

    checkPortrait()
    window.addEventListener('resize', checkPortrait, { passive: true })
    window.addEventListener('orientationchange', checkPortrait, { passive: true })

    return () => {
      window.removeEventListener('resize', checkPortrait)
      window.removeEventListener('orientationchange', checkPortrait)
    }
  }, [])

  return isIPadPortrait
}

