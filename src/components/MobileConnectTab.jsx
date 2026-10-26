import React, { useState, useEffect } from 'react'
import TransformBoundingBox from './TransformBoundingBox'

/**
 * MobileConnectTab Component
 * Global sticky "Let's Connect" vertical tab & expand popup for mobile view (@media (max-width: 768px)).
 * - Closed state: Sharp vertical rectangle pinned to right viewport edge: "LET'S CONNECT →"
 * - Open state (on tap): Expands outward into a sleek dark overlay panel matching editorial system
 */
export default function MobileConnectTab() {
  const [isOpen, setIsOpen] = useState(false)

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Prevent background scrolling while connect panel is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.dataset.modalOpen
      document.body.dataset.modalOpen = 'true'
      return () => {
        if (prev) {
          document.body.dataset.modalOpen = prev
        } else {
          delete document.body.dataset.modalOpen
        }
      }
    }
  }, [isOpen])

  return (
    <>
      {/* CLOSED STATE: Sharp rectangular vertical pill pinned to right edge */}
      <button
        type="button"
        className={`mobile-sticky-connect-pill has-transform-box ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close Let's Connect tab" : "Open Let's Connect tab"}
        aria-expanded={isOpen}
      >
        <span className="mobile-sticky-pill-text">
          LET'S CONNECT <span className="tab-arrow" aria-hidden="true">→</span>
        </span>
        <TransformBoundingBox />
      </button>

      {/* OPEN STATE: Sleek dark overlay panel */}
      {isOpen && (
        <div
          className="mobile-connect-backdrop"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Let's Connect panel"
        >
          <div
            className="mobile-connect-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-connect-popup-header">
              <span className="mobile-connect-pill-badge">GET IN TOUCH</span>
              <button
                type="button"
                className="mobile-connect-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close connect panel"
              >
                ✕
              </button>
            </div>

            <div className="mobile-connect-popup-body">
              <h2 className="mobile-connect-headline">
                LET'S BUILD SOMETHING MEMORABLE.
              </h2>
              <p className="mobile-connect-desc">
                Got a brief to crack, or just want to chat about ideas that stick in culture? Reach out directly.
              </p>

              <div className="mobile-connect-actions">
                <a
                  href="mailto:umeshpawar93@gmail.com?subject=Project%20Inquiry"
                  className="mobile-connect-btn primary has-transform-box"
                  onClick={() => {
                    setTimeout(() => setIsOpen(false), 200)
                  }}
                >
                  START A CONVERSATION <span className="btn-arrow" aria-hidden="true">→</span>
                  <TransformBoundingBox />
                </a>

                <a
                  href="https://wa.me/919664359422"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-connect-btn secondary has-transform-box"
                  onClick={() => {
                    setTimeout(() => setIsOpen(false), 200)
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
                  className="mobile-connect-btn cv has-transform-box"
                  aria-label="Download CV: Umesh_Pawar_CV.pdf"
                  onClick={(e) => {
                    e.stopPropagation()
                    setTimeout(() => setIsOpen(false), 200)
                  }}
                  style={{ pointerEvents: 'auto', zIndex: 999 }}
                >
                  DOWNLOAD CV <span className="btn-arrow" aria-hidden="true">↓</span>
                  <TransformBoundingBox />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
