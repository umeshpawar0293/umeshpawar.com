import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import TransformBoundingBox from './TransformBoundingBox'

/**
 * HeroUI Component
 * Displays the persistent top header navigation and the Hero landing copy.
 * Hero copy smoothly fades out as the user scrolls into About.
 * Nav active indicator transitions cleanly between HOME and ABOUT.
 */
export default function HeroUI({ scrollProgress = 0 }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const heroCopyRef = useRef(null)

  // Initial 3D rotational flip entrance
  useEffect(() => {
    if (heroCopyRef.current) {
      const items = heroCopyRef.current.children
      gsap.fromTo(
        items,
        {
          opacity: 0,
          y: 40,
          rotateX: -25,
          transformPerspective: 800,
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          stagger: 0.08,
          duration: 0.95,
          ease: 'power3.out',
          clearProps: 'rotateX,transformPerspective',
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

  // Prevent background scroll when mobile drawer is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      const orig = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = orig
      }
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
              className="hero-logo-img"
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

      {/* Modern Mobile Slide-in Drawer with Glassmorphic Backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          <div
            className="mobile-nav-drawer"
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
        </div>
      )}

      {/* Main Hero Copy - Left Aligned with smooth scroll exit */}
      <main
        className="hero-body"
        style={{
          display: isHeroVisible ? 'flex' : 'none',
          visibility: isHeroVisible ? 'visible' : 'hidden',
          pointerEvents: 'none',
        }}
      >
        <div ref={heroCopyRef} className="hero-copy-container" style={copyStyle}>
          <h1 className="hero-name has-transform-box sharp-isometric-shadow neon-long-shadow">
            UMESH PAWAR
            <TransformBoundingBox />
          </h1>
          <h2 className="hero-tagline font-bold">CREATIVE. SKILLED. MOTIVATED.</h2>
          <p className="hero-aside font-medium">(Yes, even after round 11 of client feedback.)</p>
          <p className="hero-statement font-bold max-w-[420px]">
            <span className="whitespace-normal lg:whitespace-nowrap">
              I specialize in agency alchemy: taking non-existent
            </span>
            <br className="hero-desktop-br hidden lg:inline" />
            {' '}
            <span className="whitespace-normal lg:whitespace-nowrap">
              budgets, chaotic 8 PM voice notes, and &lsquo;thoda international
            </span>
            <br className="hero-desktop-br hidden lg:inline" />
            {' '}
            <span className="whitespace-normal lg:whitespace-nowrap">
              feel chahiye&rsquo; and turning them into culture-defining work.
            </span>
            <br className="hero-desktop-br hidden lg:inline" />
            {' '}
            <span className="whitespace-normal lg:whitespace-nowrap">
              Powered by sharp design, sharper punchlines, and a
            </span>
            <br className="hero-desktop-br hidden lg:inline" />
            {' '}
            <span className="whitespace-normal lg:whitespace-nowrap">
              stubborn refusal to make boring campaigns.
            </span>
          </p>

          <div className="hero-action-row">
            <a
              href="#work"
              className="btn-pill btn-explore has-transform-box"
              onClick={(e) => {
                e.stopPropagation()
                handleScrollWork(e)
              }}
            >
              Explore My Work <span className="arrow-icon">→</span>
              <TransformBoundingBox />
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
