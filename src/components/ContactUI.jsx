import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'
import TransformBoundingBox from './TransformBoundingBox'
import { useIPadLandscape } from '../hooks/useIPadLandscape'
import { useIPadPortrait } from '../hooks/useIPadPortrait'

/**
 * ContactBackdropHeading Component
 * Renders the giant "LET'S TALK" heading in Layer 1 (BEHIND the 3D Canvas).
 * Strictly ONE SINGLE LINE, centered behind the 3D character's head,
 * so the character naturally occludes/covers part of the heading,
 * matching the exact typographic composition of the ABOUT ME section.
 */
export function ContactBackdropHeading({ scrollProgress = 0 }) {
  const isIPadLandscape = useIPadLandscape()
  const applyCompactLandscape = isIPadLandscape
  const isIPadPortrait = useIPadPortrait()
  const applyCompactPortrait = isIPadPortrait
  // Enters at 0.76, fully visible 0.88 - 1.00
  let contactT = 0
  if (scrollProgress >= 0.76) {
    if (scrollProgress < 0.88) {
      contactT = (scrollProgress - 0.76) / 0.12
    } else {
      contactT = 1
    }
  }
  const translateY = (1 - contactT) * 24
  const isContactActive = scrollProgress >= 0.74
  const isInteractive = isContactActive && contactT > 0.65
  const isContactVisible = isContactActive && contactT > 0.01

  const headingRef = useRef(null)
  const hasAnimatedRef = useRef(false)

  const triggerHeadingAnimation = () => {
    if (headingRef.current) {
      gsap.fromTo(
        headingRef.current,
        { y: 60, scale: 0.9, opacity: 0 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 0.9,
          ease: 'expo.out',
          clearProps: 'transform',
        }
      )
    }
  }

  useEffect(() => {
    if (isContactActive && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true
      triggerHeadingAnimation()
    } else if (scrollProgress < 0.70) {
      hasAnimatedRef.current = false
    }
  }, [isContactActive, scrollProgress])

  useEffect(() => {
    const handleTransition = (e) => {
      if (e.detail?.toIndex === 3) {
        hasAnimatedRef.current = true
        triggerHeadingAnimation()
      }
    }
    window.addEventListener('sectiontransitionstart', handleTransition)
    return () => window.removeEventListener('sectiontransitionstart', handleTransition)
  }, [])

  return (
    <div
      className="contact-backdrop-layer md:text-center md:mx-auto"
      style={{
        display: (applyCompactLandscape || applyCompactPortrait) ? 'none' : (isContactVisible ? 'block' : 'none'),
        opacity: contactT,
        transform: `translateY(${translateY}px)`,
        pointerEvents: isInteractive ? 'auto' : 'none',
        visibility: isContactVisible ? 'visible' : 'hidden',
        zIndex: 1,
        ...(applyCompactLandscape
          ? {
              position: 'absolute',
              top: 'calc(50% - 215px)',
              left: 0,
              transform: `translateY(${translateY}px) translate(4.5rem, 1.5rem) scale(0.82)`,
              transformOrigin: 'left center',
              width: 'clamp(320px, 26vw, 400px)',
              maxWidth: '400px',
              display: 'flex',
              justifyContent: 'center',
              textAlign: 'center',
              margin: 0,
              padding: 0,
            }
          : {}),
      }}
      aria-hidden={!isContactActive}
    >
      <h2
        ref={headingRef}
        className="contact-backdrop-heading has-transform-box sharp-isometric-shadow neon-long-shadow md:text-center md:mx-auto"
        style={
          isIPadLandscape
            ? {
                fontSize: 'clamp(3.2rem, 4.5vw, 4.0rem)',
                lineHeight: 0.88,
                letterSpacing: '0.04em',
                margin: 0,
                padding: 0,
              }
            : undefined
        }
      >
        LET'S TALK
        <TransformBoundingBox />
      </h2>
    </div>
  )
}

/**
 * ContactUI Component
 * Foreground layer (Layer 4) for the Contact section.
 * - Left block: Aligned to the EXACT SAME left edge as LET'S TALK
 *   (Controlled width, body text stays completely left, no overlap with character)
 * - Right block: Three identical-width cards starting LOWER
 *   (around the vertical level of the final "...die in the deck." line)
 * - Direct Collaboration card has NO orange outline (same neutral border as Cards 1 & 2)
 * - Minimal, non-intrusive site footer at bottom
 */
export default function ContactUI({
  scrollProgress = 0,
  onCharacterDragDown,
  onCharacterTouchStart,
  onCharacterTouchMove,
  onCharacterTouchEnd,
}) {
  const isIPadLandscape = useIPadLandscape()
  const applyCompactLandscape = isIPadLandscape
  const isIPadPortrait = useIPadPortrait()
  const applyCompactPortrait = isIPadPortrait
  let contactT = 0
  if (scrollProgress >= 0.76) {
    if (scrollProgress < 0.88) {
      contactT = (scrollProgress - 0.76) / 0.12
    } else {
      contactT = 1
    }
  }

  const translateY = (1 - contactT) * 24
  const isContactActive = scrollProgress >= 0.74
  const isInteractive = isContactActive && contactT > 0.65
  const isContactVisible = isContactActive && contactT > 0.01

  const desktopCardsRef = useRef(null)
  const mobileBentoRef = useRef(null)
  const hasAnimatedRef = useRef(false)

  const triggerCardCascade = () => {
    // 1. Desktop 3 Cards
    if (desktopCardsRef.current) {
      const cards = desktopCardsRef.current.querySelectorAll('.contact-card')
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            delay: 0.15,
            stagger: 0.12,
            ease: 'power3.out',
            clearProps: 'transform',
          }
        )

        // Glassmorphic border glow pulse (luminous lime/white flash settling into neon-lime rim)
        gsap.fromTo(
          cards,
          { borderColor: 'rgba(204, 255, 0, 0.8)' },
          {
            borderColor: 'rgba(204, 255, 0, 0.40)',
            duration: 1.1,
            delay: 0.25,
            stagger: 0.12,
            ease: 'power2.out',
            clearProps: 'borderColor',
          }
        )
      }

      // Cascade the 3 neon action buttons
      const buttons = desktopCardsRef.current.querySelectorAll('.collab-actions-group a')
      if (buttons.length > 0) {
        gsap.fromTo(
          buttons,
          { x: -15, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.7,
            delay: 0.45,
            stagger: 0.08,
            ease: 'power3.out',
            clearProps: 'transform',
          }
        )
      }
    }

    // 2. Mobile 2-Column Bento Cards
    if (mobileBentoRef.current) {
      const mCards = mobileBentoRef.current.querySelectorAll('.contact-mobile-card')
      if (mCards.length > 0) {
        // Smooth staggered magnetic entrance (y: 15px -> 0px, opacity: 0 -> 1)
        gsap.fromTo(
          mCards,
          { y: 15, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            delay: 0.15,
            stagger: 0.12,
            ease: 'power3.out',
            clearProps: 'transform',
          }
        )

        gsap.fromTo(
          mCards,
          { borderColor: 'rgba(204, 255, 0, 0.8)' },
          {
            borderColor: 'rgba(204, 255, 0, 0.40)',
            duration: 1.0,
            delay: 0.25,
            stagger: 0.12,
            ease: 'power2.out',
            clearProps: 'borderColor',
          }
        )
      }

      const mButtons = mobileBentoRef.current.querySelectorAll('.contact-mobile-action-btn')
      if (mButtons.length > 0) {
        gsap.fromTo(
          mButtons,
          { x: -15, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.65,
            delay: 0.4,
            stagger: 0.08,
            ease: 'power3.out',
            clearProps: 'transform',
          }
        )
      }
    }
  }

  useEffect(() => {
    if (isContactActive && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true
      triggerCardCascade()
    } else if (scrollProgress < 0.70) {
      hasAnimatedRef.current = false
    }
  }, [isContactActive, scrollProgress])

  useEffect(() => {
    const handleTransition = (e) => {
      if (e.detail?.toIndex === 3) {
        hasAnimatedRef.current = true
        triggerCardCascade()
      }
    }
    window.addEventListener('sectiontransitionstart', handleTransition)
    return () => window.removeEventListener('sectiontransitionstart', handleTransition)
  }, [])

  const containerStyle = {
    opacity: contactT,
    transform: `translateY(${translateY}px)`,
    pointerEvents: 'none',
    visibility: isContactVisible ? 'visible' : 'hidden',
    display: isContactVisible ? 'block' : 'none',
    zIndex: 999,
    transition: 'opacity 0.16s ease-out, transform 0.16s ease-out',
  }

  const scrollToRatio = (ratio) => {
    const idx = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : ratio >= 0.2 ? 1 : 0
    window.dispatchEvent(
      new CustomEvent('sectionnavigate', { detail: { index: idx } })
    )
  }

  return (
    <section
      id="contact"
      className="contact-foreground-overlay h-[100dvh] max-h-[100dvh] overflow-hidden md:h-full md:max-h-full"
      style={containerStyle}
      aria-label="Contact Umesh Pawar"
    >
      {/* Desktop Stage: Preserved strictly for min-width: 769px */}
      <div className="contact-desktop-stage">
        <div
          className="contact-composition-wrapper"
          style={
            applyCompactLandscape || applyCompactPortrait
              ? {
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  pointerEvents: 'none',
                  padding: 0,
                  margin: 0,
                }
              : undefined
          }
        >
          {/* Left Block: Aligned to the EXACT same left edge as LET'S TALK */}
          <div
            className="contact-left-block md:mx-auto md:flex md:justify-center"
            style={{
              pointerEvents: isInteractive ? 'auto' : 'none',
              ...(applyCompactLandscape
                ? {
                    position: 'absolute',
                    top: '50%',
                    left: '15.5vw',
                    transform: 'translateY(-50%) scale(0.82)',
                    transformOrigin: 'left center',
                    margin: 0,
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 20,
                    width: 'clamp(320px, 26vw, 400px)',
                    maxWidth: '400px',
                  }
                : applyCompactPortrait
                ? {
                    position: 'fixed',
                    left: '12vw',
                    top: '50%',
                    transform: 'translateY(-50%) scale(0.78)',
                    transformOrigin: 'left center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '480px',
                    maxWidth: '480px',
                    margin: 0,
                    padding: 0,
                    zIndex: 20,
                  }
                : {}),
            }}
          >
            {/* Inner Heading (LET'S TALK) when applyCompactLandscape or applyCompactPortrait is true */}
            <h2
              className="contact-backdrop-heading has-transform-box sharp-isometric-shadow neon-long-shadow"
              style={{
                display: (applyCompactLandscape || applyCompactPortrait) ? 'block' : 'none',
                position: 'relative',
                top: 'auto',
                left: 'auto',
                transform: 'none',
                fontSize: applyCompactPortrait
                  ? 'clamp(5.5rem, 9vw, 8rem)'
                  : '5.6rem',
                lineHeight: applyCompactPortrait ? 0.90 : 0.95,
                whiteSpace: 'nowrap',
                textAlign: 'center',
                width: '100%',
                margin: '0 auto 0.75rem auto',
                paddingBottom: applyCompactPortrait ? 0 : '0.2rem',
                flexShrink: 0,
                zIndex: 25,
                letterSpacing: '0.04em',
                alignSelf: 'center',
              }}
            >
              LET&apos;S TALK
              <TransformBoundingBox />
            </h2>

            {/* All 3 Cards Vertically Stacked as a Unified Group on the Left Side */}
            <div
              ref={desktopCardsRef}
              className="contact-cards-stack"
              style={
                applyCompactLandscape || applyCompactPortrait
                  ? {
                      position: 'relative',
                      top: 'auto',
                      left: 'auto',
                      transform: 'none',
                      margin: 0,
                      marginTop: '0px',
                      gap: '0.45rem',
                      width: '100%',
                      maxHeight: 'none',
                    }
                  : undefined
              }
            >
              {/* Card 1: DIRECT LINES */}
              <div className="contact-card direct-lines-card">
                <span className="contact-card-header-label mb-1">
                  DIRECT LINES
                </span>

                <div className="contact-field-block">
                  <span className="contact-field-label">EMAIL</span>
                  <a
                    href="mailto:umeshpawar93@gmail.com"
                    className="contact-field-value contact-email-val"
                  >
                    umeshpawar93@gmail.com
                  </a>
                  <span className="contact-field-subtext contact-subtext-mb">
                    Best for project briefs, decks, and detailed scopes.
                  </span>
                </div>

                <div className="contact-field-block">
                  <span className="contact-field-label">CALL / WHATSAPP</span>
                  <a
                    href="https://wa.me/919664359422"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-field-value contact-phone-val"
                  >
                    +91 96643 59422
                  </a>
                  <span className="contact-field-subtext">
                    For quick syncs and fast turnarounds.
                  </span>
                </div>
              </div>

              {/* Card 2: CONNECT */}
              <div className="contact-card connect-card">
                <div className="connect-top-row">
                  <span className="contact-card-header-label" style={{ marginBottom: 0 }}>
                    CONNECT
                  </span>

                  <div className="connect-social-pills">
                    <a
                      href="https://www.linkedin.com/in/umeshpawar93"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-social-pill"
                      aria-label="LinkedIn profile"
                    >
                      <svg
                        className="social-svg-icon"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                      </svg>
                      <span>LinkedIn</span>
                    </a>

                    <a
                      href="https://www.instagram.com/umesh_pawar_/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-social-pill"
                      aria-label="Instagram profile"
                    >
                      <svg
                        className="social-svg-icon"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                      <span>Instagram</span>
                    </a>
                  </div>
                </div>

                <div className="connect-bottom-section">
                  <span className="contact-field-label" style={{ marginTop: '0.85rem' }}>
                    BASE
                  </span>
                  <span className="connect-location-val hero-clean-text text-white font-bold text-xs tracking-wide">
                    Mumbai, India
                  </span>
                </div>
              </div>

              {/* Card 3: DIRECT COLLABORATION */}
              <div className="contact-card collab-card">
                <span className="contact-card-header-label mb-1">
                  DIRECT COLLABORATION
                </span>
                <h3 className="collab-heading">LET’S BUILD SOMETHING MEMORABLE.</h3>

                <div className="collab-actions-group" style={{ pointerEvents: 'auto', zIndex: 999 }}>
                  <a
                    href="mailto:umeshpawar93@gmail.com?subject=Project%20Inquiry"
                    className="btn-collab-primary has-transform-box cursor-pointer select-none"
                    style={{ pointerEvents: 'auto', position: 'relative', zIndex: 999, touchAction: 'manipulation' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      window.location.href = 'mailto:umeshpawar93@gmail.com?subject=Project%20Inquiry'
                    }}
                  >
                    GET IN TOUCH <span className="arrow-btn">→</span>
                    <TransformBoundingBox />
                  </a>
                  <a
                    href="https://wa.me/919664359422"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-collab-secondary has-transform-box cursor-pointer select-none"
                    style={{ pointerEvents: 'auto', position: 'relative', zIndex: 999, touchAction: 'manipulation' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open('https://wa.me/919664359422', '_blank')
                    }}
                  >
                    CHAT ON WHATSAPP
                    <TransformBoundingBox />
                  </a>
                  <a
                    href="/cv.pdf"
                    download="Umesh_Pawar_CV.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-collab-cv has-transform-box cursor-pointer select-none"
                    aria-label="Download CV: Umesh_Pawar_CV.pdf"
                    style={{ pointerEvents: 'auto', position: 'relative', zIndex: 999, touchAction: 'manipulation' }}
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    DOWNLOAD CV <span className="arrow-btn" aria-hidden="true">↓</span>
                    <TransformBoundingBox />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Area: Transparent zone where 3D character sits and can be dragged */}
          <div
            className="contact-character-zone"
            aria-label="Drag horizontally to rotate character"
            style={{ pointerEvents: isInteractive ? 'auto' : 'none' }}
            onPointerDown={onCharacterDragDown}
            onTouchStart={onCharacterTouchStart}
            onTouchMove={onCharacterTouchMove}
            onTouchEnd={onCharacterTouchEnd}
            onTouchCancel={onCharacterTouchEnd}
          />
        </div>
      </div>

      {/* Mobile Stage: 2-Column Bento Layout (Direct Lines + Connect next to Direct Collaboration) */}
      <div
        className="contact-mobile-stage h-full max-h-[100dvh] overflow-hidden"
        style={{
          pointerEvents: 'none',
          display: isContactVisible ? 'block' : 'none',
          visibility: isContactVisible ? 'visible' : 'hidden',
          zIndex: 999,
        }}
      >
        {/* COMBINED 2-COLUMN BENTO CONTAINER */}
        <div
          ref={mobileBentoRef}
          data-contact-cards="true"
          className="contact-cards-wrapper contact-mobile-bento-container contact-cards-container grid grid-cols-2 items-stretch gap-2 w-[90vw] max-w-[340px] mx-auto -translate-y-[7.5%] md:translate-y-0 transform-gpu will-change-transform"
          style={{
            pointerEvents: 'auto',
            zIndex: 999,
            bottom: 'calc(74px + env(safe-area-inset-bottom, 16px))',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* LEFT COLUMN ON MOBILE: DIRECT LINES (TOP) + CONNECT (BOTTOM) */}
          <div className="contact-mobile-col-left flex flex-col justify-between h-full gap-2 min-w-0 w-full" style={{ pointerEvents: 'auto', zIndex: 999 }}>
            {/* Card 1: DIRECT LINES */}
            <div className="contact-card contact-mobile-card direct-lines-card p-2.5 sm:p-3 rounded-2xl w-full max-w-full box-border transform-gpu will-change-transform" style={{ pointerEvents: 'auto', zIndex: 999 }}>
              <div className="mb-0.5">
                <span className="contact-card-header-label block text-[8px] font-black tracking-wider text-[#ccff00] uppercase mb-0.5">
                  DIRECT LINES
                </span>
              </div>

              {/* Field 1: EMAIL */}
              <div className="contact-mobile-field-entry entry-spaced w-full max-w-full" style={{ pointerEvents: 'auto', zIndex: 999 }}>
                <span className="contact-mobile-field-label block text-[8px] font-black tracking-wider text-[#ccff00] uppercase mb-0.5 leading-tight">
                  EMAIL
                </span>
                <a
                  href="mailto:umeshpawar93@gmail.com"
                  className="contact-mobile-field-value block text-[9px] font-bold text-zinc-100 no-underline hover:text-[#d0ff00] whitespace-nowrap leading-tight mt-0.5 cursor-pointer select-none"
                  style={{ color: '#f4f4f5', textDecoration: 'none', pointerEvents: 'auto', position: 'relative', zIndex: 999, touchAction: 'manipulation' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    window.location.href = 'mailto:umeshpawar93@gmail.com'
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation()
                  }}
                >
                  umeshpawar93@gmail.com
                </a>
                <span className="contact-mobile-field-subtext text-[7px] text-zinc-400 leading-tight whitespace-nowrap overflow-visible mt-0.5 mb-1.5 block w-full">
                  Best for project briefs, decks, and detailed scopes.
                </span>
              </div>

              {/* Field 2: CALL / WHATSAPP */}
              <div className="contact-mobile-field-entry w-full max-w-full" style={{ pointerEvents: 'auto', zIndex: 999 }}>
                <span className="contact-mobile-field-label block text-[8px] font-black tracking-wider text-[#ccff00] uppercase mb-0.5 leading-tight">
                  CALL / WHATSAPP
                </span>
                <a
                  href="https://wa.me/919664359422"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-mobile-field-value block text-[9.5px] font-bold text-zinc-100 no-underline hover:text-[#d0ff00] whitespace-nowrap leading-tight mt-0.5 cursor-pointer select-none"
                  style={{ color: '#f4f4f5', textDecoration: 'none', pointerEvents: 'auto', position: 'relative', zIndex: 999, touchAction: 'manipulation' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open('https://wa.me/919664359422', '_blank')
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation()
                  }}
                >
                  +91 96643 59422
                </a>
                <span className="contact-mobile-field-subtext text-[7px] text-zinc-400 leading-tight whitespace-nowrap overflow-visible mt-0.5 block w-full">
                  For quick syncs and fast turnarounds.
                </span>
              </div>
            </div>

            {/* Card 2: CONNECT */}
            <div className="contact-card contact-mobile-card connect-card p-2.5 sm:p-3 rounded-2xl w-full max-w-full box-border overflow-hidden transform-gpu will-change-transform" style={{ pointerEvents: 'auto', zIndex: 999 }}>
              {/* Heading "CONNECT" on dedicated top line */}
              <span className="contact-card-header-label text-[8px] font-black uppercase tracking-wider text-[#ccff00] block mb-1 leading-none">
                CONNECT
              </span>

              {/* Social Pills Container: Full width, horizontal single line */}
              <div className="contact-mobile-pills-row flex items-center gap-1.5 w-full flex-nowrap mb-1.5">
                <a
                  href="https://www.linkedin.com/in/umeshpawar93"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-mobile-social-pill-btn inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white flex-1 min-w-0 whitespace-nowrap cursor-pointer select-none no-underline leading-none"
                  style={{ color: '#ffffff', textDecoration: 'none', pointerEvents: 'auto', position: 'relative', zIndex: 999, touchAction: 'manipulation' }}
                  aria-label="LinkedIn profile"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open('https://www.linkedin.com/in/umeshpawar93', '_blank')
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation()
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-2 h-2 min-w-[8px] h-[8px] object-contain flex-shrink-0" style={{ width: '8px', height: '8px', minWidth: '8px', flexShrink: 0, display: 'block' }}>
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                  </svg>
                  <span className="text-[7px] sm:text-[7.5px] font-black uppercase tracking-tight text-white leading-none whitespace-nowrap">LINKEDIN</span>
                </a>

                <a
                  href="https://www.instagram.com/umesh_pawar_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-mobile-social-pill-btn inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white flex-1 min-w-0 whitespace-nowrap cursor-pointer select-none no-underline leading-none"
                  style={{ color: '#ffffff', textDecoration: 'none', pointerEvents: 'auto', position: 'relative', zIndex: 999, touchAction: 'manipulation' }}
                  aria-label="Instagram profile"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open('https://www.instagram.com/umesh_pawar_/', '_blank')
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation()
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-2 h-2 min-w-[8px] h-[8px] object-contain flex-shrink-0" style={{ width: '8px', height: '8px', minWidth: '8px', flexShrink: 0, display: 'block' }}>
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  <span className="text-[7px] sm:text-[7.5px] font-black uppercase tracking-tight text-white leading-none whitespace-nowrap">INSTAGRAM</span>
                </a>
              </div>

              {/* "BASE Mumbai, India" Row directly below pills */}
              <div className="contact-mobile-base-row flex items-center gap-1 text-[8px] font-bold text-zinc-300 mt-0.5">
                <span className="contact-mobile-base-label text-[#ccff00] uppercase font-black tracking-wider leading-tight text-[8px]">
                  BASE
                </span>
                <span className="contact-mobile-base-val text-zinc-100 font-bold tracking-normal leading-tight text-[8px]">
                  Mumbai, India
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN ON MOBILE: DIRECT COLLABORATION (EQUAL COMBINED HEIGHT) */}
          <div className="contact-mobile-col-right h-full min-w-0 w-full" style={{ pointerEvents: 'auto', zIndex: 999 }}>
            <div className="contact-card contact-mobile-card collab-card h-full flex flex-col justify-between p-2.5 sm:p-3 rounded-2xl w-full max-w-full box-border overflow-hidden transform-gpu will-change-transform" style={{ pointerEvents: 'auto', zIndex: 999 }}>
              <div>
                <div className="mb-0.5">
                  <span className="contact-card-header-label block text-[8px] font-black tracking-widest text-[#ccff00] uppercase mb-0.5">
                    DIRECT COLLABORATION
                  </span>
                </div>
                <div className="contact-mobile-collab-subtitle text-[9.5px] font-black text-white leading-tight uppercase mb-1.5">
                  LET'S BUILD SOMETHING MEMORABLE.
                </div>
              </div>

              {/* 3 Action Buttons */}
              <div
                className="contact-mobile-collab-buttons-stack flex flex-col gap-1 w-full max-w-full box-border mt-auto"
                style={{ pointerEvents: 'auto', zIndex: 999 }}
              >
                <a
                  href="mailto:umeshpawar93@gmail.com?subject=Project%20Inquiry"
                  className="contact-mobile-action-btn btn-collab-primary has-transform-box w-full h-[30px] flex items-center justify-center px-2 my-1 rounded-full bg-[#ccff00] text-[#0066ff] text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider text-center whitespace-nowrap shadow-sm no-underline cursor-pointer select-none leading-none gap-1"
                  style={{ color: '#0066ff', textDecoration: 'none', background: '#ccff00', pointerEvents: 'auto', position: 'relative', zIndex: 999, touchAction: 'manipulation' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    window.location.href = 'mailto:umeshpawar93@gmail.com?subject=Project%20Inquiry'
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation()
                  }}
                >
                  <span className="whitespace-nowrap flex items-center justify-center gap-1 text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider text-center text-[#0066ff] leading-none" style={{ color: '#0066ff', textDecoration: 'none' }}>
                    GET IN TOUCH <span className="arrow-btn text-[8.5px] font-bold flex items-center justify-center flex-shrink-0" style={{ color: '#0066ff', textDecoration: 'none' }} aria-hidden="true">→</span>
                  </span>
                  <TransformBoundingBox />
                </a>

                <a
                  href="https://wa.me/919664359422"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-mobile-action-btn btn-collab-secondary has-transform-box w-full h-[30px] flex items-center justify-center px-2 my-1 rounded-full bg-[#ccff00] text-[#0066ff] text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider text-center whitespace-nowrap shadow-sm no-underline cursor-pointer select-none leading-none gap-1"
                  style={{ color: '#0066ff', textDecoration: 'none', background: '#ccff00', pointerEvents: 'auto', position: 'relative', zIndex: 999, touchAction: 'manipulation' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open('https://wa.me/919664359422', '_blank')
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation()
                  }}
                >
                  <span className="whitespace-nowrap flex items-center justify-center text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider text-center text-[#0066ff] leading-none" style={{ color: '#0066ff', textDecoration: 'none' }}>CHAT ON WHATSAPP</span>
                  <TransformBoundingBox />
                </a>

                <a
                  href="/cv.pdf"
                  download="Umesh_Pawar_CV.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-mobile-action-btn btn-collab-cv has-transform-box w-full h-[30px] flex items-center justify-center px-2 my-1 rounded-full bg-[#ccff00] text-[#0066ff] text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider text-center whitespace-nowrap shadow-sm no-underline cursor-pointer select-none leading-none gap-1"
                  style={{ color: '#0066ff', textDecoration: 'none', background: '#ccff00', pointerEvents: 'auto', position: 'relative', zIndex: 999, touchAction: 'manipulation' }}
                  aria-label="Download CV: Umesh_Pawar_CV.pdf"
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation()
                  }}
                >
                  <span className="whitespace-nowrap flex items-center justify-center gap-1 text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider text-center text-[#0066ff] leading-none" style={{ color: '#0066ff', textDecoration: 'none' }}>
                    DOWNLOAD CV <span className="arrow-btn text-[8.5px] font-bold flex items-center justify-center flex-shrink-0" style={{ color: '#0066ff', textDecoration: 'none' }} aria-hidden="true">↓</span>
                  </span>
                  <TransformBoundingBox />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
