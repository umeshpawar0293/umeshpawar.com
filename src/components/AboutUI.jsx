import React, { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import TransformBoundingBox from './TransformBoundingBox'

/**
 * AboutBackdropHeading Component
 * Renders the giant "ABOUT ME" heading in Layer 1 (BEHIND the 3D Canvas).
 * Strictly ONE SINGLE LINE, centered behind the 3D character's head,
 * so the character naturally occludes/overlaps it matching the reference composition.
 */
export function AboutBackdropHeading({ scrollProgress = 0 }) {
  // Enters around 0.14, full during About [0.26, 0.40], fades out cleanly [0.40, 0.54]
  let aboutT = 0
  if (scrollProgress >= 0.14 && scrollProgress <= 0.54) {
    if (scrollProgress < 0.26) {
      aboutT = (scrollProgress - 0.14) / 0.12
    } else if (scrollProgress <= 0.40) {
      aboutT = 1
    } else {
      aboutT = 1 - (scrollProgress - 0.40) / 0.14
    }
  }
  const translateY = (1 - aboutT) * 24
  const isAboutActive = scrollProgress >= 0.12 && scrollProgress <= 0.54
  const isInteractive = isAboutActive && aboutT > 0.65
  const isAboutVisible = isAboutActive && aboutT > 0.01

  return (
    <div
      className="about-backdrop-layer"
      style={{
        opacity: aboutT,
        transform: `translateY(${translateY}px)`,
        pointerEvents: isInteractive ? 'auto' : 'none',
        visibility: isAboutVisible ? 'visible' : 'hidden',
        zIndex: 1,
      }}
      aria-hidden={!isAboutActive}
    >
      <h2 className="about-backdrop-heading has-transform-box sharp-isometric-shadow neon-long-shadow">
        ABOUT ME
        <TransformBoundingBox />
      </h2>
    </div>
  )
}

/**
 * AboutUI Component
 * Foreground layer (Layer 4) for the About section.
 * - Unified content column: Left boundary sits in exact alignment with ABOUT ME
 * - 3-Line Headline Lockup with Clip-Path Reveal
 * - 3D Perspective Staggered Copy Block
 * - Interactive Count-Up Animation for "12+ YEARS"
 * - Narrative paragraphs and CV download CTA
 */
export default function AboutUI({ scrollProgress = 0 }) {
  // Enters around 0.16, full during About [0.28, 0.40], fades out cleanly [0.40, 0.54]
  let aboutT = 0
  if (scrollProgress >= 0.16 && scrollProgress <= 0.54) {
    if (scrollProgress < 0.28) {
      aboutT = (scrollProgress - 0.16) / 0.12
    } else if (scrollProgress <= 0.40) {
      aboutT = 1
    } else {
      aboutT = 1 - (scrollProgress - 0.40) / 0.14
    }
  }
  const opacity = aboutT
  const translateY = (1 - aboutT) * 24
  const isAboutActive = scrollProgress >= 0.12 && scrollProgress <= 0.54
  const isInteractive = isAboutActive && aboutT > 0.65
  const isAboutVisible = isAboutActive && aboutT > 0.01

  // Dynamic counter for Experience / Stats numbers (0 -> 12+)
  const [yearsCount, setYearsCount] = useState(12)
  const hasAnimatedRef = useRef(false)
  const headlineLockupRef = useRef(null)
  const copyBlockRef = useRef(null)
  const actionRowRef = useRef(null)
  const mobileHeadlineRef = useRef(null)
  const mobileCopyRef = useRef(null)
  const mobileActionRef = useRef(null)

  useEffect(() => {
    if (isAboutActive && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true

      // 1. Headline Reveal with vertical clip-path mask (clipPath: inset(100% 0% 0%) -> inset(0% 0% 0%))
      if (headlineLockupRef.current) {
        gsap.fromTo(
          headlineLockupRef.current.children,
          {
            clipPath: 'inset(100% 0% 0% 0%)',
            y: 40,
            opacity: 0,
          },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            y: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 0.85,
            ease: 'expo.out',
          }
        )
      }

      // 2. Smooth count-up animation for Experience stat (0 -> 12)
      const countTarget = { val: 0 }
      gsap.to(countTarget, {
        val: 12,
        duration: 1.2,
        ease: 'power2.out',
        onUpdate: () => {
          setYearsCount(Math.round(countTarget.val))
        },
      })

      // 3. Narrative Copy Block: 3D perspective stagger
      if (copyBlockRef.current) {
        gsap.fromTo(
          copyBlockRef.current.children,
          {
            opacity: 0,
            y: 35,
            rotateX: 12,
            transformPerspective: 600,
          },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            stagger: 0.08,
            duration: 0.85,
            ease: 'power3.out',
            clearProps: 'rotateX,transformPerspective',
          }
        )
      }

      // 4. Action Row (CV Download CTA)
      if (actionRowRef.current) {
        gsap.fromTo(
          actionRowRef.current,
          { opacity: 0, y: 25, scale: 0.94 },
          { opacity: 1, y: 0, scale: 1, duration: 0.65, delay: 0.25, ease: 'back.out(1.4)' }
        )
      }

      // 5. Mobile Stagger reveals
      if (mobileHeadlineRef.current) {
        gsap.fromTo(
          mobileHeadlineRef.current.children,
          { clipPath: 'inset(100% 0% 0% 0%)', y: 30, opacity: 0 },
          { clipPath: 'inset(0% 0% 0% 0%)', y: 0, opacity: 1, stagger: 0.08, duration: 0.8, ease: 'expo.out' }
        )
      }
      if (mobileCopyRef.current) {
        gsap.fromTo(
          mobileCopyRef.current.children,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, stagger: 0.08, duration: 0.75, ease: 'power3.out' }
        )
      }
      if (mobileActionRef.current) {
        gsap.fromTo(
          mobileActionRef.current,
          { opacity: 0, y: 20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, delay: 0.2, ease: 'back.out(1.4)' }
        )
      }
    } else if (!isAboutActive) {
      hasAnimatedRef.current = false
    }
  }, [isAboutActive])

  const containerStyle = {
    opacity,
    transform: `translateY(${translateY}px)`,
    pointerEvents: 'none',
    visibility: isAboutVisible ? 'visible' : 'hidden',
    display: isAboutVisible ? 'block' : 'none',
    zIndex: 999,
    transition: 'opacity 0.16s ease-out, transform 0.16s ease-out',
  }

  return (
    <section
      id="about"
      className="about-foreground-overlay"
      style={containerStyle}
      aria-label="About Umesh Pawar"
    >
      {/* Desktop Stage: Preserved strictly for min-width: 769px */}
      <div className="about-desktop-stage">
        {/* Unified Content Column: Left boundary aligned directly with ABOUT ME heading */}
        <div
          className="about-content-column max-w-[420px] xl:max-w-[450px]"
          style={{ pointerEvents: isInteractive ? 'auto' : 'none' }}
        >
          {/* 3-Line Headline Typography & Colors with vertical clip-path reveal */}
          <div ref={headlineLockupRef} className="about-headline-lockup">
            <span className="about-stat-line has-transform-box">
              {yearsCount}+ YEARS
              <TransformBoundingBox />
            </span>
            <span className="about-headline-line">
              TURNING CREATIVE CHAOS
            </span>
            <span className="about-headline-line">
              INTO WORK THAT LANDS.
            </span>
          </div>

          <div ref={copyBlockRef} className="about-copy-block max-w-[420px] xl:max-w-[450px]">
            <p className="about-paragraph font-bold text-white/90 leading-relaxed max-w-[420px]">
              <span className="whitespace-normal lg:whitespace-nowrap">
                &ldquo;Thoda aur pop karo.&rdquo; &ldquo;Budget halved, but ASAP chahiye.&rdquo;
              </span>
              <br className="about-desktop-br hidden lg:inline" />
              {' '}Heard every punchline in the book, survived the madness,<br className="about-desktop-br hidden lg:inline" />
              {' '}and still show up for midnight pitch decks like Baburao<br className="about-desktop-br hidden lg:inline" />
              {' '}answering a wrong number. Because inside that classic<br className="about-desktop-br hidden lg:inline" />
              {' '}comedy of errors, the winning ideas actually happen.
            </p>

            <p className="about-role-statement font-bold text-white/90 leading-relaxed max-w-[420px]">
              Part visual strategist, part creative firefighter fueled by craft, laughs, and cutting chai.
            </p>
          </div>

          <div ref={actionRowRef} className="about-action-row" style={{ pointerEvents: 'auto', zIndex: 999 }}>
            <a
              href="/cv.pdf"
              download="Umesh_Pawar_CV.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill btn-cv has-transform-box cursor-pointer select-none"
              aria-label="Download CV: Final_Final_Approved_CV.pdf"
              onClick={(e) => {
                e.stopPropagation()
              }}
              onTouchEnd={(e) => {
                e.stopPropagation()
              }}
              style={{ pointerEvents: 'auto', position: 'relative', zIndex: 999, touchAction: 'manipulation' }}
            >
              Final_Final_Approved_CV.pdf
              <span className="download-icon" aria-hidden="true">↓</span>
              <TransformBoundingBox />
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Stage: Positioned in exact same vertical zone below waistline over soft gradient tint */}
      <div
        className="about-mobile-stage"
        style={{
          pointerEvents: 'none',
          display: isAboutVisible ? 'flex' : 'none',
          visibility: isAboutVisible ? 'visible' : 'hidden',
          zIndex: 999,
        }}
      >
        <div className="about-mobile-copy-container" style={{ pointerEvents: 'none' }}>
          <div ref={mobileHeadlineRef} className="w-full">
            <h2 className="about-mobile-stat has-transform-box">
              {yearsCount}+ YEARS
              <TransformBoundingBox />
            </h2>
            <h3 className="about-mobile-subheading">
              TURNING CREATIVE CHAOS <br className="block sm:hidden about-mobile-subheading-br" />
              INTO WORK THAT LANDS.
            </h3>
          </div>

          <div ref={mobileCopyRef} className="about-mobile-copy-block">
            <p className="about-mobile-paragraph font-bold">
              &ldquo;Thoda aur pop karo.&rdquo; &ldquo;Budget halved, but ASAP chahiye.&rdquo;{' '}
              Heard every punchline in the book, survived the madness, and still show up for midnight pitch decks like Baburao answering a wrong number. Because inside that classic comedy of errors, the winning ideas actually happen.
            </p>
            <p className="about-mobile-statement font-bold">
              Part visual strategist, part creative firefighter fueled by craft, laughs, and cutting chai.
            </p>
          </div>

          <div ref={mobileActionRef} className="about-mobile-action" style={{ pointerEvents: 'auto', zIndex: 999 }}>
            <a
              href="/cv.pdf"
              download="Umesh_Pawar_CV.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill btn-cv-mobile has-transform-box cursor-pointer select-none"
              aria-label="Download CV: Final_Final_Approved_CV.pdf"
              onClick={(e) => {
                e.stopPropagation()
              }}
              onTouchEnd={(e) => {
                e.stopPropagation()
              }}
              style={{ pointerEvents: 'auto', position: 'relative', zIndex: 999, touchAction: 'manipulation' }}
            >
              Final_Final_Approved_CV.pdf
              <span className="download-icon" aria-hidden="true">↓</span>
              <TransformBoundingBox />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
