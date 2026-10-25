import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'
import TransformBoundingBox from './TransformBoundingBox'

/**
 * ContactBackdropHeading Component
 * Renders the giant "LET'S TALK" heading in Layer 1 (BEHIND the 3D Canvas).
 * Strictly ONE SINGLE LINE, centered behind the 3D character's head,
 * so the character naturally occludes/covers part of the heading,
 * matching the exact typographic composition of the ABOUT ME section.
 */
export function ContactBackdropHeading({ scrollProgress = 0 }) {
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
      className="contact-backdrop-layer"
      style={{
        opacity: contactT,
        transform: `translateY(${translateY}px)`,
        pointerEvents: isInteractive ? 'auto' : 'none',
        visibility: isContactVisible ? 'visible' : 'hidden',
        zIndex: 1,
      }}
      aria-hidden={!isContactActive}
    >
      <h2
        ref={headingRef}
        className="contact-backdrop-heading has-transform-box sharp-isometric-shadow neon-long-shadow"
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

        // Glassmorphic border glow pulse (#d0ff00/50 briefly flashing then settling to white/10)
        gsap.fromTo(
          cards,
          { borderColor: 'rgba(208, 255, 0, 0.5)' },
          {
            borderColor: 'rgba(255, 255, 255, 0.12)',
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
        gsap.fromTo(
          mCards,
          { y: 35, opacity: 0 },
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
          { borderColor: 'rgba(208, 255, 0, 0.5)' },
          {
            borderColor: 'rgba(255, 255, 255, 0.12)',
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
      className="contact-foreground-overlay"
      style={containerStyle}
      aria-label="Contact Umesh Pawar"
    >
      {/* Desktop Stage: Preserved strictly for min-width: 769px */}
      <div className="contact-desktop-stage">
        <div className="contact-composition-wrapper">
          {/* Left Block: Aligned to the EXACT same left edge as LET'S TALK */}
          <div
            className="contact-left-block"
            style={{ pointerEvents: isInteractive ? 'auto' : 'none' }}
          >
            {/* All 3 Cards Vertically Stacked as a Unified Group on the Left Side */}
            <div ref={desktopCardsRef} className="contact-cards-stack">
              {/* Card 1: DIRECT LINES */}
              <div className="contact-card direct-lines-card">
                <span className="contact-micro-label">DIRECT LINES</span>

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
                  <span className="contact-micro-label" style={{ marginBottom: 0 }}>
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
                  <span className="connect-location-val">Mumbai, India</span>
                </div>
              </div>

              {/* Card 3: DIRECT COLLABORATION */}
              <div className="contact-card collab-card">
                <span className="contact-micro-label" style={{ marginBottom: '0.5rem' }}>
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
                    START A CONVERSATION <span className="arrow-btn">→</span>
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
                    href="/CV/Final_Final_CV_Approved.pdf"
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

        {/* Premium Minimal Contact Footer (Desktop) */}
        <footer
          className="contact-site-footer"
          style={{ pointerEvents: isInteractive ? 'auto' : 'none' }}
        >
          <div className="footer-brand-box">
            <span className="footer-brand-name">UMESH PAWAR</span>
            <span className="footer-brand-dot">•</span>
            <span className="footer-tagline">Creative Director &amp; Designer</span>
          </div>

          <nav className="footer-nav" aria-label="Footer Navigation">
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault()
                scrollToRatio(0)
              }}
            >
              HOME
            </a>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault()
                scrollToRatio(1 / 3)
              }}
            >
              ABOUT
            </a>
            <a
              href="#work"
              onClick={(e) => {
                e.preventDefault()
                scrollToRatio(2 / 3)
              }}
            >
              WORK
            </a>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault()
                scrollToRatio(1)
              }}
            >
              CONTACT
            </a>
          </nav>

          <div className="footer-legal-box">
            <span className="footer-copy-text">
              &copy; 2026 Umesh Pawar. All rights reserved.
            </span>
          </div>
        </footer>
      </div>

      {/* Mobile Stage: 2-Column Bento Layout (Direct Lines + Connect next to Direct Collaboration) */}
      <div
        className="contact-mobile-stage"
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
          className="contact-cards-wrapper contact-mobile-bento-container"
          style={{ pointerEvents: 'auto', zIndex: 999 }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* LEFT COLUMN ON MOBILE: DIRECT LINES (TOP) + CONNECT (BOTTOM) */}
          <div className="contact-mobile-col-left flex flex-col gap-2 justify-between h-full" style={{ pointerEvents: 'auto', zIndex: 999 }}>
            {/* Card 1: DIRECT LINES */}
            <div className="contact-card contact-mobile-card direct-lines-card" style={{ pointerEvents: 'auto', zIndex: 999 }}>
              <span className="contact-mobile-card-heading text-[9px] md:text-[11px] font-bold tracking-wider uppercase text-[#d0ff00] mb-1.5 block">
                DIRECT LINES
              </span>

              {/* Field 1: EMAIL */}
              <div className="contact-mobile-field-entry entry-spaced" style={{ pointerEvents: 'auto', zIndex: 999 }}>
                <span className="contact-mobile-field-label block text-[8px] md:text-[10px] uppercase tracking-wider text-white/50">
                  EMAIL
                </span>
                <a
                  href="mailto:umeshpawar93@gmail.com"
                  className="contact-mobile-field-value block text-[10px] md:text-xs font-bold text-white no-underline hover:text-[#d0ff00] break-all leading-tight mt-0.5 cursor-pointer select-none"
                  style={{ color: '#ffffff', textDecoration: 'none', pointerEvents: 'auto', position: 'relative', zIndex: 999, touchAction: 'manipulation' }}
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
                <span className="contact-mobile-field-subtext text-[8px] md:text-[10px] text-white/40 leading-tight mt-0.5 mb-2 block">
                  Best for project briefs, decks, and detailed scopes.
                </span>
              </div>

              {/* Field 2: CALL / WHATSAPP */}
              <div className="contact-mobile-field-entry" style={{ pointerEvents: 'auto', zIndex: 999 }}>
                <span className="contact-mobile-field-label block text-[8px] md:text-[10px] uppercase tracking-wider text-white/50">
                  CALL / WHATSAPP
                </span>
                <a
                  href="https://wa.me/919664359422"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-mobile-field-value block text-[10px] md:text-xs font-bold text-white no-underline hover:text-[#d0ff00] leading-tight mt-0.5 cursor-pointer select-none"
                  style={{ color: '#ffffff', textDecoration: 'none', pointerEvents: 'auto', position: 'relative', zIndex: 999, touchAction: 'manipulation' }}
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
                <span className="contact-mobile-field-subtext text-[8px] md:text-[10px] text-white/40 leading-tight mt-0.5 block">
                  For quick syncs and fast turnarounds.
                </span>
              </div>
            </div>

            {/* Card 2: CONNECT */}
            <div className="contact-card contact-mobile-card connect-card" style={{ pointerEvents: 'auto', zIndex: 999 }}>
              <div className="contact-mobile-connect-header-row flex items-center justify-between w-full">
                <span className="contact-mobile-card-heading text-[9px] md:text-[11px] font-bold uppercase text-[#d0ff00]">
                  CONNECT
                </span>
                <div className="contact-mobile-pills-row flex items-center gap-1">
                  <a
                    href="https://www.linkedin.com/in/umeshpawar93"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-mobile-social-pill-btn border border-white/15 rounded px-2 py-1 text-[9px] md:text-[11px] text-white flex items-center gap-1 bg-white/5 no-underline hover:text-[#d0ff00] cursor-pointer select-none"
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
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                    </svg>
                    <span>LinkedIn</span>
                  </a>

                  <a
                    href="https://www.instagram.com/umesh_pawar_/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-mobile-social-pill-btn border border-white/15 rounded px-2 py-1 text-[9px] md:text-[11px] text-white flex items-center gap-1 bg-white/5 no-underline hover:text-[#d0ff00] cursor-pointer select-none"
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
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                    <span>Instagram</span>
                  </a>
                </div>
              </div>

              <div className="contact-mobile-base-row flex items-center">
                <span className="contact-mobile-base-label text-[8px] md:text-[10px] uppercase text-white/50 mr-2">
                  BASE
                </span>
                <span className="contact-mobile-base-val text-[10px] md:text-xs font-bold text-white">
                  Mumbai, India
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN ON MOBILE: DIRECT COLLABORATION (EQUAL COMBINED HEIGHT) */}
          <div className="contact-mobile-col-right h-full" style={{ pointerEvents: 'auto', zIndex: 999 }}>
            <div className="contact-card contact-mobile-card collab-card h-full flex flex-col justify-between" style={{ pointerEvents: 'auto', zIndex: 999 }}>
              <div>
                <h4 className="contact-mobile-card-heading text-[9px] md:text-[11px] font-bold uppercase tracking-wider text-[#d0ff00]">
                  DIRECT COLLABORATION
                </h4>
                <div className="contact-mobile-collab-subtitle text-[10px] md:text-xs font-extrabold uppercase text-white leading-snug mt-1 mb-2">
                  LET'S BUILD SOMETHING MEMORABLE.
                </div>
              </div>

              {/* 3 Action Buttons */}
              <div className="contact-mobile-collab-buttons-stack flex flex-col gap-1.5 md:gap-2" style={{ pointerEvents: 'auto', zIndex: 999 }}>
                <a
                  href="mailto:umeshpawar93@gmail.com?subject=Project%20Inquiry"
                  className="contact-mobile-action-btn btn-collab-primary has-transform-box w-full py-1.5 md:py-2 px-2 rounded-md bg-[#d0ff00] text-black font-bold text-[8.5px] md:text-[11px] uppercase tracking-wide text-center flex items-center justify-center no-underline shadow-sm cursor-pointer select-none"
                  style={{ color: '#000000', textDecoration: 'none', background: '#d0ff00', pointerEvents: 'auto', position: 'relative', zIndex: 999, touchAction: 'manipulation' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    window.location.href = 'mailto:umeshpawar93@gmail.com?subject=Project%20Inquiry'
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation()
                  }}
                >
                  START A CONVERSATION <span className="arrow-btn text-[9px] ml-1" aria-hidden="true">→</span>
                  <TransformBoundingBox />
                </a>

                <a
                  href="https://wa.me/919664359422"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-mobile-action-btn btn-collab-secondary has-transform-box w-full py-1.5 md:py-2 px-2 rounded-md bg-[#d0ff00] text-black font-bold text-[8.5px] md:text-[11px] uppercase tracking-wide text-center flex items-center justify-center no-underline shadow-sm cursor-pointer select-none"
                  style={{ color: '#000000', textDecoration: 'none', background: '#d0ff00', pointerEvents: 'auto', position: 'relative', zIndex: 999, touchAction: 'manipulation' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open('https://wa.me/919664359422', '_blank')
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation()
                  }}
                >
                  CHAT ON WHATSAPP
                  <TransformBoundingBox />
                </a>

                <a
                  href="/CV/Final_Final_CV_Approved.pdf"
                  download="Umesh_Pawar_CV.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-mobile-action-btn btn-collab-cv has-transform-box w-full py-1.5 md:py-2 px-2 rounded-md bg-[#d0ff00] text-black font-bold text-[8.5px] md:text-[11px] uppercase tracking-wide text-center flex items-center justify-center no-underline shadow-sm cursor-pointer select-none"
                  style={{ color: '#000000', textDecoration: 'none', background: '#d0ff00', pointerEvents: 'auto', position: 'relative', zIndex: 999, touchAction: 'manipulation' }}
                  aria-label="Download CV: Umesh_Pawar_CV.pdf"
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation()
                  }}
                >
                  DOWNLOAD CV <span className="arrow-btn text-[9px] ml-1" aria-hidden="true">↓</span>
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
