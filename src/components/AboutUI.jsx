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
      className="about-backdrop-layer md:text-center md:mx-auto"
      style={{
        opacity: aboutT,
        transform: `translateY(${translateY}px)`,
        pointerEvents: isInteractive ? 'auto' : 'none',
        visibility: isAboutVisible ? 'visible' : 'hidden',
        zIndex: 1,
      }}
      aria-hidden={!isAboutActive}
    >
      <h2 className="about-backdrop-heading has-transform-box sharp-isometric-shadow neon-long-shadow md:text-center md:mx-auto">
        ABOUT ME
        <TransformBoundingBox />
      </h2>
    </div>
  )
}

const SKILLS_DATA = [
  // Column 1 (Left): Signature Neon Lime #ccff00 with glow shadow-[0_0_10px_rgba(204,255,0,0.5)]
  // Column 2 (Right): Electric Royal Blue #004af2 with glow shadow-[0_0_10px_rgba(0,74,242,0.5)]
  // Row 1:
  {
    name: 'BRAND BUILDING*',
    percentage: 90,
    color: '#ccff00',
    glow: '0 0 10px rgba(204, 255, 0, 0.5)',
  },
  {
    name: 'IDEAS*',
    percentage: 88,
    color: '#004af2',
    glow: '0 0 10px rgba(0, 74, 242, 0.5)',
  },
  // Row 2:
  {
    name: 'INNOVATION*',
    percentage: 85,
    color: '#ccff00',
    glow: '0 0 10px rgba(204, 255, 0, 0.5)',
  },
  {
    name: 'DESIGN IMPACT*',
    percentage: 92,
    color: '#004af2',
    glow: '0 0 10px rgba(0, 74, 242, 0.5)',
  },
  // Row 3:
  {
    name: 'DESIGN THINKING*',
    percentage: 95,
    color: '#ccff00',
    glow: '0 0 10px rgba(204, 255, 0, 0.5)',
  },
  {
    name: 'PROBLEM SOLVING*',
    percentage: 87,
    color: '#004af2',
    glow: '0 0 10px rgba(0, 74, 242, 0.5)',
  },
]

/**
 * AboutUI Component
 * Foreground layer (Layer 4) for the About section.
 * - Unified content column: Left boundary sits in exact alignment with ABOUT ME
 * - 3-Line Headline Lockup with Clip-Path Reveal
 * - 3D Perspective Staggered Copy Block
 * - Interactive Count-Up Animation for "12+ YEARS"
 * - Narrative paragraphs and CV download CTA
 */
export default function AboutUI({ scrollProgress = 0, activePage = 'hero' }) {
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
  } else if (activePage === 'about') {
    aboutT = 1
  }
  const opacity = aboutT
  const translateY = (1 - aboutT) * 24
  const isAboutActive = (scrollProgress >= 0.12 && scrollProgress <= 0.54) || activePage === 'about'
  const isInteractive = isAboutActive && aboutT > 0.65
  const isAboutVisible = isAboutActive && aboutT > 0.01

  // Dynamic counter for Experience / Stats numbers (0 -> 12+)
  const [yearsCount, setYearsCount] = useState(12)
  const [animateBars, setAnimateBars] = useState(false)
  const hasAnimatedRef = useRef(false)
  const headlineLockupRef = useRef(null)
  const copyBlockRef = useRef(null)
  const actionRowRef = useRef(null)
  const mobileHeadlineRef = useRef(null)
  const mobileCopyRef = useRef(null)
  const mobileActionRef = useRef(null)

  useEffect(() => {
    if (isAboutActive) {
      const timer = setTimeout(() => {
        setAnimateBars(true)
      }, 60)
      return () => clearTimeout(timer)
    } else {
      setAnimateBars(false)
    }
  }, [isAboutActive])

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

      // 2. Kinetic counter / scrubbed numeric tick for Experience stat (0 -> 12+)
      const countTarget = { val: 0 }
      gsap.fromTo(
        countTarget,
        { val: 0 },
        {
          val: 12,
          duration: 1.3,
          ease: 'power2.out',
          onUpdate: () => {
            setYearsCount(Math.round(countTarget.val))
          },
        }
      )

      // 3. Bio Paragraphs: Balanced multi-line kinetic text mask (polygon clip-path reveal)
      const bioParagraphs = document.querySelectorAll(
        '.about-body-paragraph, .about-mobile-paragraph, .about-mobile-statement'
      )
      if (bioParagraphs.length > 0) {
        gsap.fromTo(
          bioParagraphs,
          {
            clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
            y: 18,
            opacity: 0,
          },
          {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            y: 0,
            opacity: 1,
            stagger: 0.12,
            duration: 0.85,
            ease: 'power3.out',
            clearProps: 'clipPath,transform',
          }
        )
      }

      // 4. Skills Breakdown Rows: Crisp stagger on label, percentage & progress fill
      const skillRows = document.querySelectorAll('.skill-item, .skills-mobile-grid > div')
      if (skillRows.length > 0) {
        gsap.fromTo(
          skillRows,
          { opacity: 0, y: 14 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.08,
            duration: 0.65,
            delay: 0.12,
            ease: 'power2.out',
            clearProps: 'opacity,transform',
          }
        )
      }

      // 5. Action Row (CV Download CTA)
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
        {/* Unified Content Column: Left-aligned to balance with the 3D character on the right */}
        <div
          className="about-content-column w-full max-w-[460px] lg:max-w-[520px] mx-0"
          style={{ pointerEvents: isInteractive ? 'auto' : 'none' }}
        >
          {/* ── Unified Luminous Glass Box Container (Shifted closer to ABOUT ME heading) ── */}
          <div
            className="about-glass-box neon-glass-box flex flex-col items-center min-h-fit h-auto p-6 md:p-8 lg:p-10 rounded-3xl w-full max-w-[460px] lg:max-w-[520px] mt-2 md:mt-3 mx-0 relative z-30 select-text"
            style={{ pointerEvents: 'auto', width: '100%', height: 'auto' }}
          >
            {/* Hero Stat: 12+ YEARS (Neon green & 56px scale) */}
            <h3 className="about-hero-stat text-4xl md:text-5xl lg:text-[56px] font-black text-[#ccff00] tracking-tight leading-none text-center font-['Archivo'] m-0">
              {yearsCount}+ YEARS
            </h3>

            {/* Subtitle: 2-Line Break in Heavy White Font (text-lg md:text-xl lg:text-[22px], tightly locked under 12+ YEARS) */}
            <p className="about-hero-subtitle text-lg md:text-xl lg:text-[22px] font-extrabold text-white uppercase leading-tight tracking-tight text-center font-['Archivo'] mt-1.5 md:mt-2 mb-5 md:mb-6">
              TURNING CREATIVE CHAOS
              <br />
              INTO WORK THAT LANDS.
            </p>

            {/* Paragraph 1 (Agency Experience) */}
            <p className="about-body-paragraph agency-exp font-normal md:font-medium text-sm md:text-[14px] leading-relaxed md:leading-[1.65] text-zinc-200 text-center mb-4 md:mb-5 font-['Archivo']">
              Currently at Cheil India. Earlier at DDB Mudra, Gozoop, The Minimalist and WatConsult. Brands across automotive, tech, food, finance, hospitality, FMCG and entertainment.
            </p>

            {/* Paragraph 2 (Personal Philosophy / Flavor Line - Standalone Semantic Block) */}
            <p className="about-body-paragraph flavor-line font-normal md:font-medium text-sm md:text-[14px] leading-relaxed md:leading-[1.65] text-zinc-200 text-center mb-6 font-['Archivo']">
              Sketch first, overthink later. Fueled by chai, deadlines aur ek stubborn pyaar white space ke saath.
            </p>

            {/* Skills Progress Bars Grid (Thick capsule bars with outer cyan border track) */}
            <div className="skills-progress-grid grid grid-cols-2 gap-x-6 gap-y-5 md:gap-y-6 mt-6 md:mt-7 mb-2 md:mb-3 w-full text-left">
              {SKILLS_DATA.map((skill) => (
                <div key={skill.name} className="skill-item flex flex-col w-full">
                  {/* a) Header row (flex justify-between items-center mb-1.5) */}
                  <div className="flex justify-between items-center mb-1.5 w-full">
                    {/* Skill Label */}
                    <span className="text-xs font-bold text-white tracking-wider uppercase font-['Archivo']">
                      {skill.name}
                    </span>
                    {/* Percentage */}
                    <span className="text-xs font-bold text-white tracking-wider font-['Archivo']">
                      {skill.percentage}%
                    </span>
                  </div>

                  {/* b) Progress Bar Track: Thick capsule bar with sky-blue border */}
                  <div
                    className="skill-progress-track h-3 md:h-3.5 w-full bg-black/40 rounded-full border border-sky-400/80 p-[1.5px] overflow-hidden relative"
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.40)',
                      border: '1.5px solid rgba(56, 189, 248, 0.80)',
                      borderRadius: '9999px',
                      padding: '1.5px',
                      overflow: 'hidden',
                      position: 'relative',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Inner filled bar */}
                    <div
                      className="skill-progress-fill h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        height: '100%',
                        width: animateBars ? `${skill.percentage}%` : '0%',
                        backgroundColor: skill.color,
                        boxShadow: skill.glow,
                        borderRadius: '9999px',
                        transition: 'width 1.1s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer Note (Synchronized to Work Section Subtitle Secondary Line) */}
            <p
              className="about-disclaimer-note text-zinc-400 font-normal text-xs md:text-[13px] italic text-center tracking-normal leading-normal select-text m-0 mt-2 md:mt-3 mb-5 md:mb-6 font-['Archivo']"
              style={{
                fontFamily: "var(--font-primary, 'Archivo', sans-serif)",
                pointerEvents: 'auto',
                userSelect: 'text',
                WebkitUserSelect: 'text',
              }}
            >
              *Percentages are subject to change after 3 rounds of feedback.
            </p>

            {/* CV Action Button (Fit-Content Auto-Width, Synchronized Brand Blue Text & 1:1 Typography) */}
            <div className="w-full flex justify-center">
              <a
                href="/cv.pdf"
                download="Umesh_Pawar_CV.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-about-cv w-fit inline-flex items-center justify-center gap-2 px-6 py-2.5 mx-auto rounded-full bg-[#ccff00] text-[#004af2] font-extrabold text-xs md:text-sm tracking-wider uppercase hover:scale-105 transition-transform shadow-[0_0_15px_rgba(204,255,0,0.35)] cursor-pointer select-none no-underline border-none"
                aria-label="Download CV: Final_Final_Approved_CV.pdf"
                onClick={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                style={{ textDecoration: 'none', color: '#004af2' }}
              >
                FINAL_FINAL_APPROVED_CV.PDF
                <span className="text-sm font-extrabold leading-none no-underline inline-block" style={{ color: '#004af2', textDecoration: 'none' }} aria-hidden="true">↓</span>
              </a>
            </div>
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
        <div className="about-mobile-copy-container flex flex-col items-center justify-center text-center mx-auto w-[88vw] max-w-[340px]" style={{ pointerEvents: 'none' }}>
          {/* 1. Header & Subtitle OUTSIDE the glass container (Mobile Only) */}
          <div ref={mobileHeadlineRef} className="w-full flex flex-col items-center justify-center text-center mx-auto" style={{ pointerEvents: 'auto' }}>
            <h2
              className="about-mobile-stat has-transform-box text-center mx-auto text-2xl sm:text-3xl font-black text-[#ccff00] tracking-tight block mb-0.5"
              style={{
                color: '#ccff00',
                fontSize: 'clamp(1.5rem, 6.5vw, 1.875rem)',
                fontWeight: 900,
                letterSpacing: '-0.025em',
                lineHeight: 1,
                display: 'block',
                marginBottom: '0.125rem',
              }}
            >
              <span className="text-[#ccff00] text-2xl sm:text-3xl font-black tracking-tight" style={{ color: '#ccff00', fontSize: 'inherit' }}>
                {yearsCount}+ YEARS
                <TransformBoundingBox />
              </span>
            </h2>
            <h3
              className="about-mobile-subheading text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white text-center block whitespace-nowrap mt-0.5 mb-2 font-['Archivo']"
              style={{
                fontSize: '10px',
                fontWeight: 900,
                letterSpacing: '0.05em',
                color: '#ffffff',
                lineHeight: 1.25,
                whiteSpace: 'nowrap',
                marginTop: '0.125rem',
                marginBottom: '0.5rem',
                display: 'block',
              }}
            >
              TURNING CREATIVE CHAOS INTO WORK THAT LANDS.
            </h3>
          </div>

          {/* 2. Neon Glassmorphic Box: now shorter, snug under subtitle, containing only body copy, skills, footnote & CTA */}
          <div
            className="neon-glass-box w-full mt-1.5 sm:mt-2 h-auto pt-3 pb-3.5 px-3.5 sm:px-4 rounded-2xl flex flex-col items-center justify-center text-center mx-auto transform-gpu will-change-transform"
            style={{
              pointerEvents: 'auto',
              height: 'auto',
              marginTop: '0.375rem',
              paddingTop: '0.75rem',
              paddingBottom: '0.875rem',
              paddingLeft: '0.875rem',
              paddingRight: '0.875rem',
              boxSizing: 'border-box',
            }}
          >
            <div ref={mobileCopyRef} className="about-mobile-copy-block flex flex-col items-center justify-center text-center mx-auto w-full">
              <p
                className="about-mobile-paragraph text-[10.5px] font-bold leading-[1.4] text-zinc-100 text-center tracking-tight px-1 font-['Archivo'] text-balance"
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  lineHeight: 1.4,
                  color: '#f4f4f5',
                  textAlign: 'center',
                  letterSpacing: '-0.02em',
                  textWrap: 'balance',
                  margin: '0 auto',
                  paddingLeft: '0.25rem',
                  paddingRight: '0.25rem',
                }}
              >
                Currently at Cheil India. Earlier at DDB Mudra, Gozoop,<br className="block md:hidden" />
                The Minimalist and WatConsult. Brands across automotive,<br className="block md:hidden" />
                tech, food, finance, hospitality, FMCG and entertainment.
              </p>
              <p
                className="about-mobile-statement text-[10.5px] font-bold leading-[1.4] text-zinc-100 text-center tracking-tight px-1 mt-2 mb-2.5 font-['Archivo'] text-balance"
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  lineHeight: 1.4,
                  color: '#f4f4f5',
                  textAlign: 'center',
                  letterSpacing: '-0.02em',
                  textWrap: 'balance',
                  marginTop: '0.5rem',
                  marginBottom: '0.625rem',
                  paddingLeft: '0.25rem',
                  paddingRight: '0.25rem',
                }}
              >
                Sketch first, overthink later. Fueled by chai, deadlines<br className="block md:hidden" />
                aur ek stubborn pyaar white space ke saath.
              </p>
            </div>

            {/* Mobile-Friendly Skills Grid (Sleek & Spaced 2-Column Component) */}
            <div
              className="skills-mobile-grid grid grid-cols-2 gap-x-5 gap-y-2 mb-2 px-1 w-full text-left"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                columnGap: '1.25rem',
                rowGap: '0.5rem',
                marginBottom: '0.5rem',
                paddingLeft: '0.25rem',
                paddingRight: '0.25rem',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {SKILLS_DATA.map((skill, idx) => {
                const isLeft = idx % 2 === 0
                const fillColor = isLeft ? '#ccff00' : '#0066ff'
                return (
                  <div key={skill.name} className="flex flex-col w-full" style={{ width: '100%' }}>
                    {/* Label & Percentage row */}
                    <div
                      className="flex justify-between items-center mb-0.5 w-full"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.125rem', width: '100%' }}
                    >
                      <span
                        className="text-[7.5px] font-bold tracking-tight text-white uppercase font-['Archivo']"
                        style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff', textTransform: 'uppercase', lineHeight: 1 }}
                      >
                        {skill.name}
                      </span>
                      <span
                        className="text-[7.5px] font-bold tracking-tight text-[#ccff00] font-['Archivo']"
                        style={{ fontSize: '7.5px', fontWeight: 700, color: '#ccff00', lineHeight: 1 }}
                      >
                        {skill.percentage}%
                      </span>
                    </div>
                    {/* Progress Bar Track: h-[3px] bg-white/10 rounded-full overflow-hidden */}
                    <div
                      className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden relative"
                      style={{
                        width: '100%',
                        height: '3px',
                        backgroundColor: 'rgba(255, 255, 255, 0.10)',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      {/* Progress Fill */}
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          height: '100%',
                          width: animateBars ? `${skill.percentage}%` : '0%',
                          backgroundColor: fillColor,
                          borderRadius: '9999px',
                          transition: 'width 1.1s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Disclaimer Footnote */}
            <p
              className="about-mobile-footnote text-[8.5px] sm:text-[9px] font-normal italic text-zinc-400 text-center tracking-tight block whitespace-nowrap px-0 mb-2.5 font-['Archivo']"
              style={{
                fontSize: 'clamp(8.5px, 2.3vw, 9px)',
                color: 'rgba(161, 161, 170, 0.85)',
                fontStyle: 'italic',
                fontWeight: 400,
                letterSpacing: '-0.015em',
                textAlign: 'center',
                display: 'block',
                whiteSpace: 'nowrap',
                paddingLeft: 0,
                paddingRight: 0,
                marginBottom: '0.625rem',
                lineHeight: 1.2,
                width: '100%',
                overflow: 'visible',
              }}
            >
              *Percentages are subject to change after 3 rounds of feedback.
            </p>

            {/* Action Button: FINAL_FINAL_APPROVED_CV.PDF ↓ */}
            <div ref={mobileActionRef} className="about-mobile-action flex justify-center items-center w-full mx-auto" style={{ pointerEvents: 'auto', zIndex: 999 }}>
              <a
                href="/cv.pdf"
                download="Umesh_Pawar_CV.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-cv-mobile h-[30px] w-auto px-5 text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider text-[#0066ff] bg-[#ccff00] rounded-full inline-flex items-center justify-center whitespace-nowrap shadow-sm mx-auto no-underline leading-none gap-1"
                aria-label="Download CV: Final_Final_Approved_CV.pdf"
                onClick={(e) => {
                  e.stopPropagation()
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation()
                }}
                style={{
                  pointerEvents: 'auto',
                  position: 'relative',
                  zIndex: 999,
                  touchAction: 'manipulation',
                  backgroundColor: '#ccff00',
                  color: '#0066ff',
                  height: '30px',
                  width: 'auto',
                  paddingLeft: '1.25rem',
                  paddingRight: '1.25rem',
                  fontSize: '8.5px',
                  fontWeight: 900,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  textDecoration: 'none',
                  border: 'none',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
                  boxSizing: 'border-box',
                }}
              >
                FINAL_FINAL_APPROVED_CV.PDF
                <span className="download-icon no-underline text-[8.5px] font-black leading-none inline-block ml-1" style={{ color: '#0066ff', textDecoration: 'none' }} aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
