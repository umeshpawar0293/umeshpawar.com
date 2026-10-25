import React, { useRef, useLayoutEffect, useEffect } from 'react'
import gsap from 'gsap'

/**
 * Helper to calculate the 3D character's horizontal offset factor
 * matching the Three.js damp logic in HeroCharacter.jsx:
 * - Hero: 0.265 (prominent on the right)
 * - About: 0.175 (closer to center-right)
 * - Work: 0.265 (prominent on the right)
 * - Contact: 0.175 (hidden)
 */
function getCharacterOffsetFactor(progress) {
  if (progress <= 0.10) {
    return 0.235
  } else if (progress < 0.26) {
    const t = (progress - 0.10) / 0.16
    const smoothT = t * t * (3 - 2 * t)
    return 0.235 + (0.175 - 0.235) * smoothT
  } else if (progress <= 0.40) {
    return 0.175
  } else if (progress < 0.58) {
    const t = (progress - 0.40) / 0.18
    const smoothT = t * t * (3 - 2 * t)
    return 0.175 + (0.235 - 0.175) * smoothT
  } else if (progress <= 0.74) {
    return 0.235
  } else if (progress < 0.90) {
    const t = (progress - 0.74) / 0.16
    const smoothT = t * t * (3 - 2 * t)
    return 0.235 + (0.175 - 0.235) * smoothT
  } else {
    return 0.175
  }
}

/**
 * NarrativeScrollPill Component
 * SCROLL INDICATOR VIEWPORT-SPECIFIC TUNING:
 * - Desktop: Typography scaled +10% (8.2px -> 9.02px).
 * - Mobile: Typography scaled -10% (7px -> 6.3px).
 * - Mobile Vertical Position: Waist-level anchor (~46vh) with dynamic collision detection.
 *   If lower content (Landing copy, About copy, Work carousel/subtitle) overlaps,
 *   dynamically nudges upward maintaining a clean 16px-20px visual clearance gap.
 * - Non-interactive (pointer-events: none, user-select: none, rounded-none).
 * - Contact page: completely hidden (unmounted / display: none).
 */
export default function NarrativeScrollPill({ scrollProgress = 0 }) {
  const cueRef = useRef(null)
  const textGroupRef = useRef(null)

  let isVisible = true
  let line1 = "TOTAL MESS RIGHT NOW."
  let line2 = "SCROLL TO FIX ME."

  if (scrollProgress < 0.18) {
    line1 = "TOTAL MESS RIGHT NOW."
    line2 = "SCROLL TO FIX ME."
    isVisible = true
  } else if (scrollProgress < 0.52) {
    line1 = "FINALLY COLOURS ALIGNING,"
    line2 = "KEEP SCROLLING"
    isVisible = true
  } else if (scrollProgress < 0.85) {
    line1 = "DON'T LEAVE ME HANGING"
    line2 = "LIKE A 7 PM BRIEF."
    isVisible = true
  } else {
    // Contact page: completely hidden
    isVisible = false
  }

  const prevLinesRef = useRef({ line1, line2 })

  useEffect(() => {
    if (
      prevLinesRef.current.line1 !== line1 ||
      prevLinesRef.current.line2 !== line2
    ) {
      prevLinesRef.current = { line1, line2 }
      if (textGroupRef.current) {
        gsap.fromTo(
          textGroupRef.current.children,
          {
            opacity: 0,
            y: 10,
            rotateX: -65,
            transformPerspective: 400,
          },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.5,
            stagger: 0.05,
            ease: 'back.out(1.5)',
            clearProps: 'transformPerspective',
          }
        )
      }
    }
  }, [line1, line2])

  // Dynamic Collision Detection & Waist-Level Positioning Engine (Mobile Only)
  useLayoutEffect(() => {
    if (!isVisible) return

    const updatePosition = () => {
      const el = cueRef.current
      if (!el) return

      // Desktop: remove mobile override so media query takes control
      if (window.innerWidth > 768) {
        el.style.removeProperty('--mobile-cue-top')
        return
      }

      // 1. Nominal waist level of the elevated 3D character on mobile: ~38vh from viewport top
      const nominalWaistTop = window.innerHeight * 0.38

      // 2. Identify topmost edge of the lower content block based on active section
      let lowerElement = null
      if (scrollProgress < 0.18) {
        // Landing: Hero copy container or display name
        lowerElement =
          document.querySelector('.hero-copy-container') ||
          document.querySelector('.hero-name')
      } else if (scrollProgress < 0.52) {
        // About Me: mobile copy container or mobile stage
        lowerElement =
          document.querySelector('.about-mobile-copy-container') ||
          document.querySelector('.about-mobile-stage')
      } else if (scrollProgress < 0.85) {
        // Work: mobile subtitle or mobile carousel container
        lowerElement =
          document.querySelector('.work-mobile-subtitle') ||
          document.querySelector('.work-mobile-stage')
      }

      let targetTop = nominalWaistTop

      if (lowerElement) {
        const lowerRect = lowerElement.getBoundingClientRect()
        // Only calculate clearance if lower element is rendered and on screen
        if (lowerRect.height > 0 && lowerRect.top > 0) {
          const cueHeight = el.offsetHeight || 15
          const CLEARANCE = 18 // Strict 16px - 20px clearance buffer
          const maxAllowedTop = lowerRect.top - cueHeight - CLEARANCE

          // If nominal waist position collides or overlaps with lower content, nudge upward
          if (nominalWaistTop > maxAllowedTop) {
            targetTop = Math.max(80, maxAllowedTop)
          }
        }
      }

      el.style.setProperty('--mobile-cue-top', `${Math.round(targetTop)}px`)
      document.documentElement.style.setProperty('--mobile-cue-top', `${Math.round(targetTop)}px`)
    }

    updatePosition()

    window.addEventListener('resize', updatePosition, { passive: true })
    window.addEventListener('scroll', updatePosition, { passive: true })
    window.addEventListener('sectionnavigate', updatePosition, { passive: true })

    const rafId = requestAnimationFrame(updatePosition)
    const timer1 = setTimeout(updatePosition, 100)
    const timer2 = setTimeout(updatePosition, 300)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
      window.removeEventListener('sectionnavigate', updatePosition)
      cancelAnimationFrame(rafId)
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [scrollProgress, isVisible])

  // Hide completely on Contact page (cube solved, zero display)
  if (!isVisible) {
    return null
  }

  const charFactor = getCharacterOffsetFactor(scrollProgress)

  return (
    <aside
      ref={cueRef}
      id="mobile-scroll-indicator"
      className="char-scroll-cue"
      style={{
        '--char-factor': charFactor,
      }}
      aria-hidden="true"
    >
      <div ref={textGroupRef} className="flex flex-col items-center">
        {/* Mobile Line 1: Off-White */}
        <span className="mobile-scroll-line-1">{line1}</span>

        {/* Mobile Line 2: Volt Green */}
        <span className="mobile-scroll-line-2">{line2}</span>
      </div>
    </aside>
  )
}
