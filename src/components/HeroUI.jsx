import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import TransformBoundingBox from './TransformBoundingBox'
import { useIPadLandscape } from '../hooks/useIPadLandscape'
import { useIPadPortrait } from '../hooks/useIPadPortrait'

/**
 * HeroUI Component
 * Displays the persistent top header navigation and the Hero landing copy.
 * Hero copy smoothly fades out as the user scrolls into About.
 * Nav active indicator transitions cleanly between HOME and ABOUT.
 */
export default function HeroUI({ scrollProgress = 0 }) {
  const isIPadLandscape = useIPadLandscape()
  const applyCompactLandscape = isIPadLandscape
  const isIPadPortrait = useIPadPortrait()
  const applyCompactPortrait = isIPadPortrait
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [isQuickScrolling, setIsQuickScrolling] = React.useState(false)
  const heroCopyRef = useRef(null)
  const heroNameRef = useRef(null)
  const heroGlassBoxRef = useRef(null)
  const quickScrollTimerRef = useRef(null)

  // Track quick scroll pulses for brand signature micro-feedback
  useEffect(() => {
    const onScrollOrWheel = () => {
      setIsQuickScrolling(true)
      if (quickScrollTimerRef.current) clearTimeout(quickScrollTimerRef.current)
      quickScrollTimerRef.current = setTimeout(() => {
        setIsQuickScrolling(false)
      }, 250)
    }
    window.addEventListener('scroll', onScrollOrWheel, { passive: true })
    window.addEventListener('wheel', onScrollOrWheel, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScrollOrWheel)
      window.removeEventListener('wheel', onScrollOrWheel)
      if (quickScrollTimerRef.current) clearTimeout(quickScrollTimerRef.current)
    }
  }, [])

  // Initial Studio-Grade Entrance: Split-character upward stagger + glass card scale reveal
  useEffect(() => {
    if (heroNameRef.current) {
      const chars = heroNameRef.current.querySelectorAll('.hero-title-char')
      if (chars.length > 0) {
        gsap.fromTo(
          chars,
          { y: 35, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.035,
            duration: 0.9,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
          }
        )
      }
    }

    if (heroGlassBoxRef.current) {
      gsap.fromTo(
        heroGlassBoxRef.current,
        { scale: 0.96, opacity: 0.85, y: 16 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 1.0,
          delay: 0.15,
          ease: 'power2.out',
          clearProps: 'scale,transform',
        }
      )
    }
  }, [])

  // Hero copy fades out smoothly during the first transition with 3D tilt
  const copyOpacity = Math.max(0, 1 - scrollProgress * 4.2)
  const isHeroActive = scrollProgress <= 0.14
  const isHeroVisible = isHeroActive && copyOpacity > 0.01

  const scrollRotationX = Math.min(25, scrollProgress * 140)
  const copyStyle = {
    transform: `perspective(900px) rotateX(${scrollRotationX}deg) translateY(calc(var(--hero-text-shift-y, 0%) - ${scrollProgress * 54}px))`,
    opacity: copyOpacity,
    pointerEvents: isHeroVisible && copyOpacity >= 0.08 ? 'auto' : 'none',
    visibility: isHeroVisible ? 'visible' : 'hidden',
    display: isHeroVisible ? 'flex' : 'none',
    transformOrigin: 'top center',
    transition: 'transform 0.14s ease-out, opacity 0.14s ease-out',
    ...(applyCompactLandscape
      ? {
          position: 'relative',
          top: 0,
          left: 0,
          maxWidth: 'min(46vw, 560px)',
          width: '100%',
          alignItems: 'center',
          textAlign: 'center',
          paddingTop: 0,
          marginTop: 0,
        }
      : {}),
  }

  const [navTarget, setNavTarget] = React.useState(null)

  let computedSection = 'HOME'
  if (scrollProgress >= 0.833) {
    computedSection = 'CONTACT'
  } else if (scrollProgress >= 0.500) {
    computedSection = 'WORK'
  } else if (scrollProgress >= 0.167) {
    computedSection = 'ABOUT'
  }

  // Clear manual navTarget once scroll catches up
  React.useEffect(() => {
    if (navTarget && computedSection === navTarget) {
      setNavTarget(null)
    }
  }, [computedSection, navTarget])

  const activeSection = navTarget || computedSection

  const navigateTo = (sectionName, targetIndex) => {
    setNavTarget(sectionName)
    const hash = `#${sectionName.toLowerCase()}`
    try {
      window.history.pushState(null, '', hash)
    } catch (_) {}
    window.dispatchEvent(
      new CustomEvent('sectionnavigate', { detail: { index: targetIndex } })
    )
  }

  const handleScrollHome = (e) => {
    e?.preventDefault?.()
    navigateTo('HOME', 0)
  }

  const handleScrollAbout = (e) => {
    e?.preventDefault?.()
    navigateTo('ABOUT', 1)
  }

  const handleScrollWork = (e) => {
    e?.preventDefault?.()
    navigateTo('WORK', 2)
  }

  // CTA button "Explore My Work" routes directly to the WORK section
  const handleScrollExplore = handleScrollWork

  const handleScrollContact = (e) => {
    e?.preventDefault?.()
    navigateTo('CONTACT', 3)
  }

  const handleNavClick = (scrollFn) => (e) => {
    setMobileMenuOpen(false)
    scrollFn(e)
  }

  // Prevent background scroll when mobile drawer is open; ensure full clean reset when closed
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      document.body.dataset.mobileMenuOpen = 'true'
      return () => {
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
        document.body.style.position = ''
        document.documentElement.style.position = ''
        delete document.body.dataset.mobileMenuOpen
      }
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      document.body.style.position = ''
      document.documentElement.style.position = ''
      delete document.body.dataset.mobileMenuOpen
    }
  }, [mobileMenuOpen])

  return (
    <div className="hero-ui-overlay">
      {/* Top Persistent Navigation Bar */}
      <header className="hero-header">
        <div className="hero-logo-box">
          <a
            href="#home"
            aria-label="Umesh Pawar Home"
            className="logo-link"
            onClick={handleScrollHome}
          >
            <img
              src="/brand/Logo.svg"
              alt="Umesh Pawar Signature Logo"
              className={`hero-logo-img ${isQuickScrolling ? 'is-quick-scrolling' : ''}`}
              decoding="async"
            />
          </a>
        </div>

        <nav className="hero-nav" aria-label="Main Navigation">
          {[
            { id: 'HOME', label: 'HOME', fn: handleScrollHome },
            { id: 'ABOUT', label: 'ABOUT', fn: handleScrollAbout },
            { id: 'WORK', label: 'WORK', fn: handleScrollWork },
            { id: 'CONTACT', label: 'CONTACT', fn: handleScrollContact },
          ].map(({ id, label, fn }) => {
            const isActive = activeSection === id
            return (
              <a
                key={id}
                href={`#${id.toLowerCase()}`}
                className={`nav-item has-transform-box ${isActive ? 'active' : ''}`}
                onClick={fn}
              >
                {label}
                <TransformBoundingBox active={isActive} />
              </a>
            )
          })}
        </nav>

        <div className="hero-connect-box">
          <a
            href="#contact"
            className="btn-pill btn-connect desktop-only-btn has-transform-box"
            onClick={handleScrollContact}
          >
            LET'S CONNECT <span className="arrow-icon">→</span>
            <TransformBoundingBox />
          </a>

          {/* Compact Mobile Menu Toggle Button */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open mobile navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>
      </header>

      {/* Modern Mobile Slide-in Drawer with Glassmorphic Solid Backdrop via Portal */}
      {mobileMenuOpen && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="mobile-nav-backdrop fixed inset-0 z-[999] w-full h-full bg-black/95 backdrop-blur-xl"
            onClick={() => setMobileMenuOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
          >
            <div
              className="mobile-nav-drawer z-[1000] bg-[#0a0c12]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mobile-drawer-header">
                <img
                  src="/brand/Logo.svg"
                  alt="Umesh Pawar Signature Logo"
                  className="mobile-drawer-logo"
                  decoding="async"
                />
                <button
                  type="button"
                  className="mobile-drawer-close-btn"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                >
                  ✕
                </button>
              </div>

              <nav className="mobile-drawer-links" aria-label="Mobile Section Navigation">
                <a
                  href="#home"
                  className={`mobile-nav-link ${activeSection === 'HOME' ? 'active' : ''}`}
                  onClick={handleNavClick(handleScrollHome)}
                >
                  <span className="mobile-nav-num">01</span>
                  <span className="mobile-nav-text">HOME</span>
                  {activeSection === 'HOME' && <span className="mobile-active-pill">CURRENT</span>}
                </a>
                <a
                  href="#about"
                  className={`mobile-nav-link ${activeSection === 'ABOUT' ? 'active' : ''}`}
                  onClick={handleNavClick(handleScrollAbout)}
                >
                  <span className="mobile-nav-num">02</span>
                  <span className="mobile-nav-text">ABOUT</span>
                  {activeSection === 'ABOUT' && <span className="mobile-active-pill">CURRENT</span>}
                </a>
                <a
                  href="#work"
                  className={`mobile-nav-link ${activeSection === 'WORK' ? 'active' : ''}`}
                  onClick={handleNavClick(handleScrollWork)}
                >
                  <span className="mobile-nav-num">03</span>
                  <span className="mobile-nav-text">WORK</span>
                  {activeSection === 'WORK' && <span className="mobile-active-pill">CURRENT</span>}
                </a>
                <a
                  href="#contact"
                  className={`mobile-nav-link ${activeSection === 'CONTACT' ? 'active' : ''}`}
                  onClick={handleNavClick(handleScrollContact)}
                >
                  <span className="mobile-nav-num">04</span>
                  <span className="mobile-nav-text">CONTACT</span>
                  {activeSection === 'CONTACT' && <span className="mobile-active-pill">CURRENT</span>}
                </a>
              </nav>

              <div className="mobile-drawer-footer">
                <a
                  href="#contact"
                  className="btn-pill btn-mobile-connect has-transform-box"
                  onClick={handleNavClick(handleScrollContact)}
                >
                  LET'S CONNECT <span className="arrow-icon">→</span>
                  <TransformBoundingBox />
                </a>
                <div className="mobile-drawer-direct">
                  <a href="mailto:umeshpawar93@gmail.com" className="mobile-direct-link">
                    umeshpawar93@gmail.com
                  </a>
                  <a
                    href="https://wa.me/919664359422"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mobile-direct-link"
                  >
                    WhatsApp: +91 96643 59422
                  </a>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Main Hero Copy - Left Aligned with smooth scroll exit */}
      <main
        className="hero-body"
        style={{
          display: isHeroVisible ? 'flex' : 'none',
          visibility: isHeroVisible ? 'visible' : 'hidden',
          pointerEvents: 'none',
          ...(applyCompactLandscape
            ? {
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                padding: 0,
                margin: 0,
                transform: 'none',
              }
            : {}),
        }}
      >
        <div
          ref={heroCopyRef}
          className="hero-copy-container flex flex-col items-center justify-center text-center mx-auto w-full"
          style={{
            ...copyStyle,
            ...(applyCompactLandscape
              ? {
                  position: 'absolute',
                  top: '50%',
                  left: '15.5vw',
                  transform: `perspective(900px) rotateX(${scrollRotationX}deg) translateY(-50%) scale(0.82)`,
                  transformOrigin: 'left center',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20,
                  maxWidth: 'min(46vw, 540px)',
                  width: 'fit-content',
                  textAlign: 'center',
                }
              : applyCompactPortrait
              ? {
                  position: 'fixed',
                  left: '12vw',
                  top: '50%',
                  transform: `perspective(900px) rotateX(${scrollRotationX}deg) translateY(-50%) scale(0.78)`,
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
                  textAlign: 'center',
                }
              : {}),
          }}
        >
          <h1
            ref={heroNameRef}
            className="hero-name has-transform-box sharp-isometric-shadow neon-long-shadow text-center mx-auto uppercase"
            style={{
              transform: `translateY(${-scrollProgress * 40 * 0.4}px)`,
              willChange: 'transform',
              ...(applyCompactLandscape
                ? {
                    position: 'relative',
                    top: 'auto',
                    left: 'auto',
                    transform: 'none',
                    fontSize: '5.6rem',
                    lineHeight: 0.95,
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    width: '100%',
                    marginTop: 0,
                    marginBottom: '0.75rem',
                    paddingBottom: '0.2rem',
                    flexShrink: 0,
                    zIndex: 25,
                  }
                : applyCompactPortrait
                ? {
                    position: 'relative',
                    top: 'auto',
                    left: 'auto',
                    transform: 'none',
                    fontSize: 'clamp(5.5rem, 9vw, 8rem)',
                    lineHeight: 0.90,
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    width: '100%',
                    margin: '0 auto 0.75rem auto',
                    flexShrink: 0,
                    zIndex: 25,
                  }
                : {}),
            }}
          >
            {"UMESH PAWAR".split("").map((char, idx) => (
              <span
                key={idx}
                className="hero-title-char inline-block"
                style={{ display: char === " " ? "inline" : "inline-block" }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
            <TransformBoundingBox />
          </h1>

          {/* ── Frosted Glass Box Container across Desktop and Mobile (Tight mt-2 sm:mt-3) ── */}
          <div
            ref={heroGlassBoxRef}
            className="hero-glass-box mx-auto mt-2 sm:mt-3 md:mt-3 transform-gpu will-change-transform"
            style={
              applyCompactLandscape || applyCompactPortrait
                ? {
                    position: 'relative',
                    top: 'auto',
                    left: 'auto',
                    transform: 'none',
                    margin: 0,
                    marginTop: '0px',
                    padding: '0.95rem 1.35rem',
                    maxWidth: '480px',
                    width: '100%',
                  }
                : undefined
            }
          >
            <h2 className="hero-tagline text-[11px] sm:text-xs md:text-sm lg:text-base font-black tracking-wider text-[#ccff00] uppercase text-center mx-auto drop-shadow-[0_0_8px_rgba(204,255,0,0.4)] md:whitespace-nowrap" style={{ marginTop: 0 }}>
              <span className="hero-clean-text text-[11px] sm:text-xs md:text-sm lg:text-base font-black tracking-wider text-[#ccff00] uppercase text-center drop-shadow-[0_0_8px_rgba(204,255,0,0.4)] md:whitespace-nowrap">
                CREATIVE. SKILLED. MOTIVATED.
              </span>
            </h2>
            <p className="hero-aside text-[9.5px] sm:text-[10px] md:text-xs font-normal text-zinc-400 text-center mx-auto mt-0.5 mb-2">
              <span className="hero-clean-text-sub text-[9.5px] sm:text-[10px] md:text-xs font-normal text-zinc-400">
                (Yes, even after round 11 of client feedback.)
              </span>
            </p>
            <p className="hero-statement text-[10px] sm:text-[10.5px] md:text-sm lg:text-[14px] font-bold md:font-medium text-zinc-100 md:text-zinc-200 leading-[1.4] md:leading-[1.4] tracking-tight md:tracking-normal text-center text-balance px-1 md:px-2 my-2 md:my-3 max-w-[420px] md:max-w-[500px] mx-auto font-['Archivo']" style={{ textWrap: 'balance' }}>
              {/* Desktop 5-line distribution (preserved strictly for md: / lg:) */}
              <span className="hidden md:inline">
                <span className="whitespace-nowrap">I specialize in agency alchemy: taking non-existent budgets,</span>
                <br />
                <span className="whitespace-nowrap">chaotic 8 PM voice notes, and &lsquo;thoda international feel chahiye&rsquo;</span>
                <br />
                <span className="whitespace-nowrap">and turning them into culture-defining work.</span>
                <br />
                <span className="whitespace-nowrap">Powered by sharp design, sharper punchlines,</span>
                <br />
                <span className="whitespace-nowrap">and a stubborn refusal to make boring campaigns.</span>
              </span>

              {/* Mobile 4-line balanced distribution (strictly < 768px, zero orphan words) */}
              <span className="inline md:hidden text-[10px] sm:text-[10.5px] font-bold leading-[1.4] text-zinc-100 text-center tracking-tight">
                I specialize in agency alchemy: taking non-existent budgets,<br className="block md:hidden" />
                chaotic 8 PM voice notes, and &lsquo;thoda international feel chahiye&rsquo;<br className="block md:hidden" />
                and turning them into culture-defining work. Powered by<br className="block md:hidden" />
                sharp design, sharper punchlines, and a stubborn refusal to make boring campaigns.
              </span>
            </p>

            {/* Action buttons row: side-by-side on both desktop & mobile */}
            <div className="hero-action-row flex flex-row items-center justify-center gap-2.5 sm:gap-3 w-full mx-auto mt-3 md:mt-4">
              <a
                href="#work"
                className="btn-pill btn-explore has-transform-box no-underline h-[30px] md:h-auto w-auto flex-shrink-0 px-3.5 sm:px-4 md:px-6 text-[8.5px] sm:text-[9px] md:text-sm font-black md:font-extrabold uppercase tracking-wider text-[#0066ff] md:text-[#004af2] bg-[#ccff00] rounded-full inline-flex items-center justify-center whitespace-nowrap shadow-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleScrollWork(e)
                }}
                style={{ textDecoration: 'none', margin: 0 }}
              >
                EXPLORE MY WORK <span className="arrow-icon text-[8.5px] sm:text-[9px] md:text-sm font-black ml-1" aria-hidden="true">→</span>
                <TransformBoundingBox />
              </a>
              <a
                href="#about"
                className="btn-pill btn-know-me has-transform-box no-underline h-[30px] md:h-auto w-auto flex-shrink-0 px-3.5 sm:px-4 md:px-6 text-[8.5px] sm:text-[9px] md:text-sm font-black md:font-extrabold uppercase tracking-wider text-[#0066ff] md:text-[#004af2] bg-[#ccff00] rounded-full inline-flex items-center justify-center whitespace-nowrap shadow-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleScrollAbout(e)
                }}
                style={{ textDecoration: 'none', margin: 0 }}
              >
                KNOW ME
                <TransformBoundingBox />
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
