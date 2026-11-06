import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useIPadPortrait } from '../hooks/useIPadPortrait'

/**
 * NarrativeScrollPill
 *
 * Dynamic 3D scene floating scroll prompt pill across ALL pages
 * (Home, About Me, Work, Contact) for both Desktop (md:) and Mobile (< 768px).
 *
 * 1. Strict Font Family Preservation:
 *    - Preserves exact font family: 'Dela Gothic One', 'Fredoka', cursive, sans-serif
 *    - Line 1: Pure White (#FFFFFF)
 *    - Line 2: Signature Neon Lime/Green (#ccff00)
 *
 * 2. Size Scaling (~40% down on Mobile):
 *    - Mobile: text-[7px] sm:text-[7.5px], py-1 px-3 rounded-full, max-w-[190px]
 *    - Desktop (md:): text-[11px], py-2 px-5 rounded-full, max-w-[270px]
 *
 * 3. Mobile Anchoring & Collision Clearance:
 *    - Directly above the focal cards / video element / intro text
 *    - Anchored close to the 3D character's lower area (waist/knees)
 *    - 100% horizontal center alignment across mobile viewports
 *    - Desktop positioning remains 100% untouched
 */
export default function NarrativeScrollPill({ scrollProgress = 0, activePage = 'hero' }) {
  const cueRef = useRef(null)
  const textGroupRef = useRef(null)
  const isIPadPortrait = useIPadPortrait()
  const applyCompactPortrait = isIPadPortrait

  const current = (activePage || (typeof location !== 'undefined' ? location?.pathname : '') || '').toLowerCase()

  const isContact = current.includes('contact') || scrollProgress >= 0.74
  const isWork = current.includes('work') || (scrollProgress >= 0.5 && scrollProgress < 0.74)
  const isAbout = current.includes('about') || (scrollProgress >= 0.18 && scrollProgress < 0.5)

  let desktopLine1 = "TOTAL MESS RIGHT NOW."
  let desktopLine2 = "SCROLL TO FIX ME."
  let mobileLine1 = "TOTAL MESS"
  let mobileLine2 = "RIGHT NOW."
  let mobileLine3 = "SCROLL TO FIX ME."

  if (isWork) {
    desktopLine1 = "DON'T LEAVE ME HANGING"
    desktopLine2 = "LIKE A 7 PM BRIEF."
    mobileLine1 = "DON'T LEAVE ME"
    mobileLine2 = "HANGING LIKE"
    mobileLine3 = "A 7 PM BRIEF."
  } else if (isAbout) {
    desktopLine1 = "FINALLY COLOURS ALIGNING,"
    desktopLine2 = "KEEP SCROLLING."
    mobileLine1 = "FINALLY COLOURS"
    mobileLine2 = "ALIGNING,"
    mobileLine3 = "KEEP SCROLLING."
  }

  const sectionClass = isWork
    ? 'is-work-section'
    : isAbout
    ? 'is-about-section'
    : isContact
    ? 'is-contact-section'
    : 'is-hero-section'

  const prevLinesRef = useRef({ line1: desktopLine1, line2: desktopLine2 })

  useEffect(() => {
    if (isContact) return
    if (
      prevLinesRef.current.line1 !== desktopLine1 ||
      prevLinesRef.current.line2 !== desktopLine2
    ) {
      prevLinesRef.current = { line1: desktopLine1, line2: desktopLine2 }
      if (textGroupRef.current && window.innerWidth >= 768) {
        gsap.fromTo(
          textGroupRef.current.children,
          {
            opacity: 0,
            y: 4,
            scale: 0.96,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.3,
            stagger: 0.04,
            ease: 'back.out(1.4)',
          }
        )
      }
    }
  }, [desktopLine1, desktopLine2, isContact])

  // Mobile-Only Anchoring & Clearance Buffer Engine (< 768px ONLY)
  useEffect(() => {
    if (isContact || applyCompactPortrait) return
    const updatePosition = () => {
      const el = cueRef.current
      if (!el) return

      // Desktop: preserve 100% desktop CSS positioning
      if (window.innerWidth >= 768) {
        el.style.removeProperty('--mobile-scroll-cue-top')
        return
      }

      // Default anchor near lower 3D character area: ~32.5vh (shifted upward by 5% on mobile)
      const nominalTop = window.innerHeight * 0.325

      // Target topmost interactive/focal element based on active section
      let targetElement = null
      if (isWork) {
        targetElement =
          document.querySelector('.work-mobile-header-block') ||
          document.querySelector('.work-mobile-subtitle') ||
          document.querySelector('.work-mobile-deck-container')
      } else if (isAbout) {
        targetElement =
          document.querySelector('.about-mobile-stat') ||
          document.querySelector('.about-mobile-copy-container') ||
          document.querySelector('.about-mobile-stage')
      } else {
        // Hero / Landing
        targetElement =
          document.querySelector('.hero-name') ||
          document.querySelector('.hero-glass-box') ||
          document.querySelector('.hero-copy-container')
      }

      let chosenTop = nominalTop

      if (targetElement) {
        const rect = targetElement.getBoundingClientRect()
        if (rect.height > 0 && rect.top > 0) {
          const pillHeight = el.offsetHeight || 30
          const CLEARANCE = 22 // Enhanced 22px clearance buffer above cards/video
          const maxAllowedTop = rect.top - pillHeight - CLEARANCE

          if (nominalTop > maxAllowedTop) {
            chosenTop = Math.max(50, maxAllowedTop)
          }
        }
      }

      el.style.setProperty('--mobile-scroll-cue-top', `${Math.round(chosenTop)}px`)
    }

    updatePosition()
    window.addEventListener('resize', updatePosition, { passive: true })
    window.addEventListener('scroll', updatePosition, { passive: true })

    const rafId = requestAnimationFrame(updatePosition)
    const t1 = setTimeout(updatePosition, 100)
    const t2 = setTimeout(updatePosition, 300)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
      cancelAnimationFrame(rafId)
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [isWork, isAbout, isContact, scrollProgress, activePage])

  // Completely removed from Contact page across ALL viewports (Mobile & Desktop)
  if (isContact) {
    return null
  }

  return (
    <aside
      ref={cueRef}
      id="persistent-scroll-indicator"
      data-scroll-badge="pill"
      className={`scroll-prompt-pill scroll-badge-wrapper z-40 ${sectionClass} left-5 md:left-[var(--scroll-pill-x)] -translate-y-[5%] md:translate-y-0 origin-left md:origin-center`}
      style={
        applyCompactPortrait
          ? {
              position: 'absolute',
              bottom: 'auto',
              top: '55%',
              left: '75%',
              right: 'auto',
              transform: 'translate(-50%, -50%)',
              whiteSpace: 'nowrap',
              zIndex: 25,
              pointerEvents: 'none',
              margin: 0,
            }
          : {
              position: 'fixed',
              left: 'var(--scroll-pill-x, calc(var(--char-head-x, calc(50vw + (min(100vw, 1440px) * 0.235))) - 150px))',
              top: 'var(--scroll-pill-y, 52%)',
              zIndex: 40,
              pointerEvents: 'none',
            }
      }
      aria-hidden="true"
    >
      <div
        ref={textGroupRef}
        data-scroll-badge="capsule"
        className="scroll-prompt-capsule scroll-badge-capsule rounded-lg md:rounded-full py-0.5 px-2 md:py-2 md:px-5 bg-[#18181b]/60 md:bg-black/75 backdrop-blur-md md:backdrop-blur-2xl border border-white/15 md:border-white/25 border-t-white/30 md:border-t-white/40 shadow-md md:shadow-[0_8px_24px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)] inline-flex flex-col items-start md:items-center justify-center text-left md:text-center pointer-events-none select-none z-40 max-w-fit md:max-w-[270px] scale-[0.78] origin-left md:scale-100 md:origin-center"
        style={{
          WebkitTextSizeAdjust: 'none',
          textSizeAdjust: 'none',
        }}
      >
        {/* Mobile View: Exactly 3 clean balanced lines scaled via transform scale(0.78) (< 768px ONLY) */}
        <div
          data-scroll-badge="text-wrapper"
          className="scroll-badge-text-wrapper block md:hidden text-left leading-[1.25]"
          style={{
            WebkitTextSizeAdjust: 'none',
            textSizeAdjust: 'none',
          }}
        >
          <span
            className="scroll-badge-text block text-white !text-[9.5px] font-black uppercase tracking-wider !leading-[1.25] whitespace-nowrap"
            style={{
              fontFamily: "'Dela Gothic One', 'Fredoka', cursive, sans-serif",
              color: '#FFFFFF',
              fontSize: '9.5px',
              lineHeight: 1.25,
              WebkitTextSizeAdjust: 'none',
              textSizeAdjust: 'none',
            }}
          >
            {mobileLine1}
          </span>
          <span
            className="scroll-badge-text block text-white !text-[9.5px] font-black uppercase tracking-wider !leading-[1.25] whitespace-nowrap mt-0.5"
            style={{
              fontFamily: "'Dela Gothic One', 'Fredoka', cursive, sans-serif",
              color: '#FFFFFF',
              fontSize: '9.5px',
              lineHeight: 1.25,
              WebkitTextSizeAdjust: 'none',
              textSizeAdjust: 'none',
            }}
          >
            {mobileLine2}
          </span>
          <span
            className="scroll-badge-text block text-[#ccff00] !text-[9.5px] font-black uppercase tracking-wider !leading-[1.25] whitespace-nowrap mt-0.5"
            style={{
              fontFamily: "'Dela Gothic One', 'Fredoka', cursive, sans-serif",
              color: '#ccff00',
              fontSize: '9.5px',
              lineHeight: 1.25,
              WebkitTextSizeAdjust: 'none',
              textSizeAdjust: 'none',
            }}
          >
            {mobileLine3}
          </span>
        </div>

        {/* Desktop View: Preserved 2 lines strictly for md: (>= 768px) */}
        <div className="hidden md:flex md:flex-col md:items-center md:justify-center md:text-center">
          <span
            className="scroll-prompt-line-1 whitespace-nowrap text-[11px] font-black uppercase tracking-wider text-white text-center leading-tight whitespace-nowrap block"
            style={{
              fontFamily: "'Dela Gothic One', 'Fredoka', cursive, sans-serif",
              color: '#FFFFFF',
            }}
          >
            {desktopLine1}
          </span>
          <span
            className="scroll-prompt-line-2 whitespace-nowrap text-[11px] font-black uppercase tracking-wider text-[#ccff00] text-center leading-tight whitespace-nowrap block mt-1"
            style={{
              fontFamily: "'Dela Gothic One', 'Fredoka', cursive, sans-serif",
              color: '#ccff00',
            }}
          >
            {desktopLine2}
          </span>
        </div>
      </div>
    </aside>
  )
}
