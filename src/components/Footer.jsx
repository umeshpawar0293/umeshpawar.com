import React, { useState, useEffect } from 'react'

/**
 * Floating Glassmorphic Docked Footer
 * Fixed at the bottom of the desktop viewport (min-width: 1024px).
 * Features:
 * - Brand identity & role on the left
 * - Glowing availability badge & dynamic live Mumbai clock in the center capsule
 * - Circular social buttons (LinkedIn, Behance, Instagram) and glowing scroll-to-top action on the right
 * - Top neon gradient glow hairline (cyan -> lime-yellow)
 */
export default function Footer({ scrollProgress = 0 }) {
  const getMumbaiTime = () => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(new Date())
    } catch {
      const d = new Date()
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
    }
  }

  const [mumbaiTime, setMumbaiTime] = useState(getMumbaiTime)

  useEffect(() => {
    setMumbaiTime(getMumbaiTime())
    const interval = setInterval(() => {
      setMumbaiTime(getMumbaiTime())
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleScrollToTop = (e) => {
    e?.preventDefault()
    window.dispatchEvent(new CustomEvent('sectionnavigate', { detail: { index: 0 } }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (window.location.hash) {
      history.pushState(null, '', window.location.pathname)
    }
  }

  // Display rules:
  // Desktop View (>= 1024px): Always visible docked at bottom.
  // Mobile View (< 1024px): Visible ONLY on Contact section (scrollProgress >= 0.74).
  const isContactActive = scrollProgress >= 0.74

  return (
    <footer
      className={`docked-footer ${isContactActive ? 'mobile-contact-visible' : ''}`}
      role="contentinfo"
      aria-label="Portfolio Footer"
    >
      {/* Top Neon Gradient Glow Border Hairline & Scroll Progress Indicator */}
      <div className="footer-glow-border" aria-hidden="true">
        <div
          className="footer-progress-indicator"
          style={{
            width: `${Math.min(100, Math.max(0, scrollProgress * 100))}%`,
            height: '100%',
            background: '#d0ff00',
            boxShadow: '0 0 10px #d0ff00, 0 0 20px rgba(208, 255, 0, 0.7)',
            transition: 'width 0.12s linear',
            borderRadius: 'inherit',
          }}
        />
      </div>

      {/* SEGMENT 1: Logo & Brand (Far Left) - Always visible on mobile */}
      <div className="footer-left-section flex items-center gap-1 shrink-0">
        <span className="footer-brand-name text-[8.5px] xs:text-[9.5px] font-bold text-white uppercase whitespace-nowrap shrink-0">
          UMESH PAWAR
        </span>
        <span className="footer-bullet-dot w-1 h-1 rounded-full bg-[#c8ff00] shrink-0" aria-hidden="true" />
        <span className="footer-brand-role text-[7.5px] xs:text-[8px] text-zinc-400 whitespace-nowrap hidden min-[360px]:inline shrink-0">
          Creative | Skilled | Motivated
        </span>
      </div>

      {/* SEGMENT 2: Status Capsule & Time (Center) */}
      <div className="footer-center-section flex items-center justify-center shrink-0">
        <div className="footer-pill-capsule rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0.5 flex items-center gap-1 shrink-0">
          <div className="footer-status-badge flex items-center gap-1 shrink-0">
            <span className="footer-status-dot w-1.5 h-1.5 rounded-full bg-[#a3e635] shadow-[0_0_4px_#a3e635] shrink-0" aria-hidden="true" />
            <span className="footer-status-text text-[7.5px] xs:text-[8px] text-[#a3e635] whitespace-nowrap shrink-0">
              Available<span className="footer-for-projects">&nbsp;for Projects</span>
            </span>
          </div>

          <span className="footer-pill-divider h-2 w-[0.5px] bg-white/20 shrink-0" aria-hidden="true" />

          <div className="footer-mumbai-clock flex items-center whitespace-nowrap shrink-0">
            <span className="footer-city-label">Mumbai — </span>
            <span className="footer-time-val text-[7.5px] xs:text-[8px] font-mono text-zinc-300 whitespace-nowrap shrink-0">{mumbaiTime}</span>
          </div>
        </div>
      </div>

      {/* SEGMENT 3: All 3 White Social Icons + Scroll-To-Top (Far Right) */}
      <div className="footer-right-section flex items-center gap-1 shrink-0">
        <div className="footer-social-links-group flex items-center gap-1 shrink-0">
          {/* LinkedIn with standard official vector SVG path & pure solid white fill */}
          <a
            href="https://www.linkedin.com/in/umeshpawar93"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-btn w-5 h-5 xs:w-6 xs:h-6 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center shrink-0"
            aria-label="LinkedIn profile"
          >
            <svg 
              className="footer-social-svg w-2.5 h-2.5 xs:w-3 xs:h-3 fill-white text-white" 
              viewBox="0 0 24 24" 
              aria-label="LinkedIn"
            >
              <path fill="#ffffff" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
            </svg>
          </a>

          {/* Behance with pure solid white fill */}
          <a
            href="https://www.behance.net/umesh_pawar"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-btn w-5 h-5 xs:w-6 xs:h-6 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center shrink-0"
            aria-label="Behance portfolio"
          >
            <svg 
              className="footer-social-svg w-2.5 h-2.5 xs:w-3 xs:h-3 fill-white text-white" 
              viewBox="0 0 24 24" 
              aria-label="Behance" 
              aria-hidden="true"
            >
              <path fill="#ffffff" d="M22 7h-7v2h7V7zm1.726 10c-.442 1.297-2.029 3-4.726 3-3.23 0-5-2.072-5-5.006 0-3.155 1.954-5.044 5.035-5.044 3.03 0 4.793 1.968 4.793 4.95 0 .4-.047.8-.094 1.1h-7.6c.114 1.624 1.258 2.378 2.872 2.378 1.488 0 2.213-.679 2.72-1.378zm-2.1-3.6c-.057-1.15-.815-1.9-2.6-1.9-1.526 0-2.457.77-2.6 1.9h5.2zm-12.626 5.6h-7v-14h6.7c2.5 0 4.3 1.2 4.3 3.4 0 1.4-.7 2.4-1.8 2.9 1.5.5 2.3 1.7 2.3 3.3 0 2.7-2 4.4-4.5 4.4zm-4.5-8.5h4.1c1.2 0 1.9-.6 1.9-1.6 0-1-.7-1.6-1.9-1.6h-4.1v3.2zm0 6h4.3c1.3 0 2.1-.7 2.1-1.8 0-1.1-.8-1.8-2.1-1.8h-4.3v3.6z" />
            </svg>
          </a>

          {/* Instagram with pure solid white stroke */}
          <a
            href="https://www.instagram.com/umesh_pawar_/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-btn w-5 h-5 xs:w-6 xs:h-6 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center shrink-0"
            aria-label="Instagram profile"
          >
            <svg
              className="footer-social-svg w-2.5 h-2.5 xs:w-3 xs:h-3 fill-white text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
        </div>

        {/* Circular Scroll-To-Top Action Button */}
        <button
          type="button"
          onClick={handleScrollToTop}
          className="footer-scroll-top-btn w-5 h-5 xs:w-6 xs:h-6 rounded-full border border-[#a3e635] flex items-center justify-center text-[#a3e635] shrink-0"
          aria-label="Scroll to top of portfolio"
        >
          <svg
            className="footer-scroll-arrow-svg w-2.5 h-2.5 xs:w-3 xs:h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>
    </footer>
  )
}
