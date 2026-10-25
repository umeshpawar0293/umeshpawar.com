import React, { Suspense, useState, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import Environment from './components/Environment'
import HeroCharacter from './components/HeroCharacter'
import HeroUI from './components/HeroUI'
import AboutUI, { AboutBackdropHeading } from './components/AboutUI'
import WorkUI, { WorkBackdropHeading } from './components/WorkUI'
import ContactUI, { ContactBackdropHeading } from './components/ContactUI'
import MobileConnectTab from './components/MobileConnectTab'
import NarrativeScrollPill from './components/NarrativeScrollPill'
import Footer from './components/Footer'

/**
 * ResponsiveCamera Component
 * Dynamically adjusts Camera FOV and Camera Z-position for mobile portrait aspect ratios.
 * During section transitions, choreographs a cinematic FOV pulse (+3 deg mid-transition)
 * and subtle camera dolly warp using GSAP (power3.inOut, duration 1.1s).
 */
function ResponsiveCamera() {
  const { camera, size } = useThree()
  const cameraTimelineRef = useRef(null)

  const isMobile = size.width <= 768
  const baseFov = 42
  const baseZ = isMobile ? 3.35 : 3.0

  useEffect(() => {
    if (!cameraTimelineRef.current?.isActive()) {
      camera.fov = baseFov
      camera.position.set(0, 0, baseZ)
      camera.updateProjectionMatrix()
    }
  }, [camera, size.width, size.height, baseZ])

  useEffect(() => {
    const handleTransition = () => {
      const isMobileNow = window.innerWidth <= 768
      const currentBaseZ = isMobileNow ? 3.35 : 3.0
      const currentBaseFov = 42

      if (cameraTimelineRef.current) {
        cameraTimelineRef.current.kill()
      }

      // Smooth Camera Dolly & FOV Warp:
      // power3.inOut, duration 1.1s with +3 deg FOV pulse mid-transition
      const tl = gsap.timeline({
        onUpdate: () => {
          camera.updateProjectionMatrix()
        },
        onComplete: () => {
          camera.fov = currentBaseFov
          camera.position.set(0, 0, currentBaseZ)
          camera.updateProjectionMatrix()
        },
      })

      tl.to(camera, {
        fov: currentBaseFov + 3,
        duration: 0.55,
        ease: 'power2.out',
      })
      .to(
        camera.position,
        {
          z: currentBaseZ - 0.12,
          duration: 0.55,
          ease: 'power2.out',
        },
        0
      )
      .to(camera, {
        fov: currentBaseFov,
        duration: 0.55,
        ease: 'power3.inOut',
      }, 0.55)
      .to(
        camera.position,
        {
          z: currentBaseZ,
          duration: 0.55,
          ease: 'power3.inOut',
        },
        0.55
      )

      cameraTimelineRef.current = tl
    }

    window.addEventListener('sectiontransitionstart', handleTransition)
    return () => {
      window.removeEventListener('sectiontransitionstart', handleTransition)
      if (cameraTimelineRef.current) cameraTimelineRef.current.kill()
    }
  }, [camera])

  return null
}

function LoadingScreen() {
  const { active, progress } = useProgress()
  const [displayProgress, setDisplayProgress] = useState(0)
  const [isFading, setIsFading] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    // Accelerated loading curve:
    // Decouples non-essential assets and ensures the percentage loader
    // smoothly and quickly reaches 100% within 1-2 seconds upon character model readiness.
    let animationFrameId
    const startTime = performance.now()

    const updateLoader = (now) => {
      const elapsed = (now - startTime) / 1000

      // Natural ease-out trajectory climbing towards 95%
      const timePercent = Math.min(96, Math.floor((1 - Math.exp(-elapsed * 2.2)) * 100))
      const currentTarget = Math.max(timePercent, Math.round(progress || 0))
      const isAssetReady = !active || progress >= 100 || elapsed >= 1.8

      if (isAssetReady) {
        setDisplayProgress((prev) => {
          const next = Math.min(100, prev + 5)
          if (next >= 100) {
            setTimeout(() => setIsFading(true), 120)
            setTimeout(() => setIsFinished(true), 550)
            return 100
          }
          return next
        })
      } else {
        setDisplayProgress((prev) => {
          if (prev < currentTarget) {
            return Math.min(96, prev + Math.max(1, Math.round((currentTarget - prev) * 0.25)))
          }
          return prev
        })
      }

      if (!isFinished) {
        animationFrameId = requestAnimationFrame(updateLoader)
      }
    }

    animationFrameId = requestAnimationFrame(updateLoader)

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [active, progress, isFinished])

  if (isFinished) return null

  return (
    <div
      className="loading-screen"
      style={{
        opacity: isFading ? 0 : 1,
        pointerEvents: isFading ? 'none' : 'auto',
        transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      aria-live="polite"
      aria-busy={!isFading}
    >
      <div className="loading-spinner" />
      <div className="loading-text">
        LOADING SCENE {Math.min(100, displayProgress)}%
      </div>
    </div>
  )
}

/**
 * Lighting that subtly responds to the Day/Sunset <-> Night environment transition
 * across all 4 acts (Hero -> About -> Work -> Contact).
 */
function CinematicLighting({ scrollProgress = 0, currentScene = 'day' }) {
  let nightT = 0
  if (scrollProgress <= 0.10) {
    nightT = 0
  } else if (scrollProgress < 0.26) {
    const t = (scrollProgress - 0.10) / 0.16
    nightT = t * t * (3 - 2 * t)
  } else if (scrollProgress <= 0.40) {
    nightT = 1
  } else if (scrollProgress < 0.58) {
    const t = (scrollProgress - 0.40) / 0.18
    nightT = 1 - t * t * (3 - 2 * t)
  } else if (scrollProgress <= 0.74) {
    nightT = 0
  } else if (scrollProgress < 0.90) {
    const t = (scrollProgress - 0.74) / 0.16
    nightT = t * t * (3 - 2 * t)
  } else {
    nightT = 1
  }

  // Sunset rim light (#ffad66) <-> Moonlight rim light (#7dd3fc)
  const rimColor = nightT < 0.5 ? '#ffad66' : '#7dd3fc'
  const rimIntensity = THREE.MathUtils.lerp(3.2, 2.4, nightT)

  // Ambient light: warm sunset (#fff1e6) <-> cool night (#e0f2fe)
  const ambientColor = nightT < 0.5 ? '#fff1e6' : '#e0f2fe'
  const ambientIntensity = THREE.MathUtils.lerp(0.85, 0.72, nightT)

  // Interior lamp key light with +12% contrast calibration ([1.5, 1.7] -> [1.68, 1.90])
  const keyIntensity = THREE.MathUtils.lerp(1.68, 1.90, nightT)

  return (
    <>
      {/* Ambient room light anchored to environment color palette */}
      <ambientLight intensity={ambientIntensity} color={ambientColor} />

      {/* Subtle cool/ambient rim light matching scene bounce (catches shoulders, hair, sneakers) */}
      <directionalLight
        position={[0, 4, -3]}
        intensity={0.65}
        color={currentScene === 'night' ? '#7dd3fc' : '#ffffff'}
      />

      {/* Dynamic environment-responsive side kicker */}
      <directionalLight
        position={[4.5, 3.5, -2.5]}
        intensity={rimIntensity}
        color={rimColor}
      />

      {/* Calibrated front key light (+12% contrast) */}
      <directionalLight
        position={[-3, 2.5, 3]}
        intensity={keyIntensity}
        color="#f8fafc"
      />

      {/* Warm fill light */}
      <directionalLight
        position={[3, 1, 2.5]}
        intensity={0.9}
        color="#fed7aa"
      />

      {/* Subtle floor bounce light */}
      <directionalLight
        position={[0, -2, 1]}
        intensity={0.35}
        color="#94a3b8"
      />
    </>
  )
}

export default function App() {
  const location = typeof window !== 'undefined' ? window.location : null
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Mutable ref for horizontal drag rotation (zero React re-renders during drag)
  const INITIAL_YAW = -Math.PI / 4
  const CONTACT_BASE_ROTATION_Y = -0.25 // -0.25 rad (~ -14.3° towards website-right / opposite side)
  const characterDragRef = useRef({
    targetRotY: INITIAL_YAW,
    isDragging: false,
    startX: 0,
    startRotY: INITIAL_YAW,
    velocityX: 0,
    lastX: 0,
    lastTime: 0,
    contactDragOffset: 0,
  })
  const dragZoneRef = useRef(null)

  // 4 discrete storytelling chapters: 0 = HOME, 1 = ABOUT, 2 = WORK, 3 = CONTACT
  const SECTION_PROGRESS = [0.0, 1 / 3, 2 / 3, 1.0]

  const currentSectionRef = useRef(0)
  const scrollProgressRef = useRef(0)
  const isTransitioningRef = useRef(false)
  const accumulatedDeltaYRef = useRef(0)
  const deltaResetTimerRef = useRef(null)
  const animationFrameRef = useRef(null)
  const cooldownTimerRef = useRef(null)

  useEffect(() => {
    // 1. Initial Hash & Pathname Detection
    const hash = (window.location.hash || '').toLowerCase()
    const path = (window.location.pathname || '').toLowerCase()
    const initialIndex =
      hash === '#contact' || path.includes('contact')
        ? 3
        : hash === '#work' || path.includes('work')
        ? 2
        : hash === '#about' || path.includes('about')
        ? 1
        : 0
    currentSectionRef.current = initialIndex
    scrollProgressRef.current = SECTION_PROGRESS[initialIndex]
    setScrollProgress(SECTION_PROGRESS[initialIndex])
    if (initialIndex === 3 && characterDragRef.current) {
      characterDragRef.current.targetRotY = CONTACT_BASE_ROTATION_Y
      characterDragRef.current.startRotY = CONTACT_BASE_ROTATION_Y
      characterDragRef.current.contactDragOffset = 0
      characterDragRef.current.velocityX = 0
    }

    // Sync initial window scroll
    const maxScroll = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      1
    )
    window.scrollTo(0, Math.round(SECTION_PROGRESS[initialIndex] * maxScroll))

    /**
     * Deterministic Section Transition Engine:
     * - Animates camera, environment, and character smoothly over ~0.95s (cinematic power3.inOut).
     * - Blocks ALL incoming wheel/scroll/touch events during transition.
     * - Enforces 400ms cooldown buffer upon arrival to completely discard trailing trackpad inertia.
     */
    const transitionToSection = (targetIndex, duration = 1100) => {
      const clampedIndex = Math.max(0, Math.min(3, targetIndex))
      if (
        clampedIndex === currentSectionRef.current &&
        Math.abs(scrollProgressRef.current - SECTION_PROGRESS[clampedIndex]) < 0.001
      ) {
        return
      }

      // Dispatch section transition event for 3D camera warp & UI choreography
      window.dispatchEvent(
        new CustomEvent('sectiontransitionstart', {
          detail: {
            targetIndex: clampedIndex,
            fromIndex: currentSectionRef.current,
            duration: 1.1,
          },
        })
      )

      // Cancel running animation or cooldown
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current)
        cooldownTimerRef.current = null
      }

      // 1. Set isTransitioning = true (locks the interaction)
      isTransitioningRef.current = true
      accumulatedDeltaYRef.current = 0

      // Reset character manual drag angle to 10° left base angle when entering Contact ("Let's Talk")
      if (clampedIndex === 3) {
        if (characterDragRef.current) {
          characterDragRef.current.targetRotY = CONTACT_BASE_ROTATION_Y
          characterDragRef.current.startRotY = CONTACT_BASE_ROTATION_Y
          characterDragRef.current.contactDragOffset = 0
          characterDragRef.current.velocityX = 0
        }
      } else if (currentSectionRef.current === 3 && clampedIndex < 3) {
        if (characterDragRef.current) {
          characterDragRef.current.targetRotY = INITIAL_YAW
          characterDragRef.current.startRotY = INITIAL_YAW
          characterDragRef.current.contactDragOffset = 0
          characterDragRef.current.velocityX = 0
        }
      }

      const startP = scrollProgressRef.current
      const targetP = SECTION_PROGRESS[clampedIndex]
      const deltaP = targetP - startP
      const startTime = performance.now()

      // Cinematic power3.inOut curve: smooth acceleration and graceful deceleration
      const easePower3InOut = (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

      const step = (now) => {
        const elapsed = now - startTime
        const t = Math.min(elapsed / duration, 1)
        const easedT = easePower3InOut(t)
        const currentP = startP + deltaP * easedT

        scrollProgressRef.current = currentP
        setScrollProgress(currentP)

        const currentMaxScroll = Math.max(
          document.documentElement.scrollHeight - window.innerHeight,
          1
        )
        window.scrollTo(0, Math.round(currentP * currentMaxScroll))

        if (t < 1) {
          animationFrameRef.current = requestAnimationFrame(step)
        } else {
          // Arrived & settled completely at target section
          scrollProgressRef.current = targetP
          setScrollProgress(targetP)
          currentSectionRef.current = clampedIndex
          animationFrameRef.current = null

          const hashNames = ['#home', '#about', '#work', '#contact']
          if (window.location.hash !== hashNames[clampedIndex]) {
            window.history.replaceState(null, '', hashNames[clampedIndex])
          }

          // 4. Intentional cooldown buffer (400ms) to discard trailing trackpad momentum/coasting
          cooldownTimerRef.current = setTimeout(() => {
            isTransitioningRef.current = false
            accumulatedDeltaYRef.current = 0
            cooldownTimerRef.current = null
          }, 400)
        }
      }

      animationFrameRef.current = requestAnimationFrame(step)
    }

    /**
     * Trackpad / Wheel Normalization & Threshold Accumulator:
     * - Prevents raw continuous scroll skips.
     * - Accumulates intentional delta up to threshold (80px), then triggers exactly ONE section.
     */
    const handleWheel = (e) => {
      // 1. Immediately bypass if event originates in modal, lightbox, or PPT stream
      if (
        document.getElementById('ppt-fullscreen-scroller') ||
        e.target?.closest?.('#ppt-fullscreen-scroller') ||
        e.target?.closest?.('.ppt-scroll-container') ||
        e.target?.closest?.('.project-modal-scroll') ||
        e.target?.closest?.('.ppt-scroll-viewport') ||
        e.target?.closest?.('.media-fullscreen-lightbox') ||
        e.target?.closest?.('.project-preview-backdrop') ||
        document.body.dataset.modalOpen === 'true'
      ) {
        return // DO NOT call e.preventDefault()! Let native vertical scroll happen!
      }

      // Allow internal scrolling inside the 3x3 Work grid if it has room to scroll
      const gridEl = e.target.closest('.work-grid-3col')
      if (gridEl) {
        const isDown = e.deltaY > 0
        const canScrollDown =
          gridEl.scrollTop + gridEl.clientHeight < gridEl.scrollHeight - 5
        const canScrollUp = gridEl.scrollTop > 5
        if ((isDown && canScrollDown) || (!isDown && canScrollUp)) {
          return // Allow internal grid scroll
        }
      }

      // Prevent native window scroll jumping
      e.preventDefault()

      // 3. IGNORE / BLOCK all incoming wheel events during active transition or cooldown
      if (isTransitioningRef.current) {
        accumulatedDeltaYRef.current = 0
        return
      }

      // Normalize delta
      let dy = e.deltaY
      if (e.deltaMode === 1) dy *= 20
      else if (e.deltaMode === 2) dy *= 400

      // Ignore micro-jitters
      if (Math.abs(dy) < 2) return

      // Direction change resets accumulator
      if (
        (accumulatedDeltaYRef.current > 0 && dy < 0) ||
        (accumulatedDeltaYRef.current < 0 && dy > 0)
      ) {
        accumulatedDeltaYRef.current = 0
      }

      accumulatedDeltaYRef.current += dy

      // Auto-decay if user paused without committing
      if (deltaResetTimerRef.current) clearTimeout(deltaResetTimerRef.current)
      deltaResetTimerRef.current = setTimeout(() => {
        accumulatedDeltaYRef.current = 0
      }, 200)

      // Intentional gesture threshold: 80px
      const THRESHOLD = 80
      if (Math.abs(accumulatedDeltaYRef.current) >= THRESHOLD) {
        const direction = accumulatedDeltaYRef.current > 0 ? 1 : -1
        accumulatedDeltaYRef.current = 0
        if (deltaResetTimerRef.current) clearTimeout(deltaResetTimerRef.current)

        const nextSection = Math.max(
          0,
          Math.min(3, currentSectionRef.current + direction)
        )
        if (nextSection !== currentSectionRef.current) {
          transitionToSection(nextSection)
        }
      }
    }

    // Touch handling for mobile
    let touchStartY = 0
    let touchStartX = 0

    const handleTouchStart = (e) => {
      if (
        document.getElementById('ppt-fullscreen-scroller') ||
        e.target?.closest?.('#ppt-fullscreen-scroller') ||
        e.target?.closest?.('.ppt-scroll-container') ||
        e.target?.closest?.('.project-modal-scroll') ||
        e.target?.closest?.('.ppt-scroll-viewport') ||
        e.target?.closest?.('.media-fullscreen-lightbox') ||
        e.target?.closest?.('.project-preview-backdrop') ||
        document.body.dataset.modalOpen === 'true'
      ) {
        return
      }
      if (e.target?.closest?.('a, button, input, textarea, select, [role="button"], .interactive-card, .contact-card, .footer-social-btn, .footer-scroll-top-btn, .mobile-menu-toggle, .work-coverflow-card, .work-mobile-deck-container')) return
      if (e.touches && e.touches.length > 0) {
        touchStartY = e.touches[0].clientY
        touchStartX = e.touches[0].clientX
      }
    }

    const handleTouchMove = (e) => {
      if (
        document.getElementById('ppt-fullscreen-scroller') ||
        e.target?.closest?.('#ppt-fullscreen-scroller') ||
        e.target?.closest?.('.ppt-scroll-container') ||
        e.target?.closest?.('.project-modal-scroll') ||
        e.target?.closest?.('.ppt-scroll-viewport') ||
        e.target?.closest?.('.media-fullscreen-lightbox') ||
        e.target?.closest?.('.project-preview-backdrop') ||
        document.body.dataset.modalOpen === 'true'
      ) {
        return // DO NOT call e.preventDefault()! Let native vertical scroll happen!
      }
      if (e.target?.closest?.('a, button, [role="button"], input, textarea, select')) return
      if (e.target.closest('.work-grid-3col')) return
      if (e.target.closest('.work-mobile-carousel')) return
      if (e.target.closest('.work-coverflow-card') || e.target.closest('.work-mobile-deck-container')) return
      if (isTransitioningRef.current) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = (e) => {
      if (
        document.getElementById('ppt-fullscreen-scroller') ||
        e.target?.closest?.('#ppt-fullscreen-scroller') ||
        e.target?.closest?.('.ppt-scroll-container') ||
        e.target?.closest?.('.project-modal-scroll') ||
        e.target?.closest?.('.ppt-scroll-viewport') ||
        e.target?.closest?.('.media-fullscreen-lightbox') ||
        e.target?.closest?.('.project-preview-backdrop') ||
        document.body.dataset.modalOpen === 'true'
      ) {
        return
      }
      if (isTransitioningRef.current) return
      if (!e.changedTouches || e.changedTouches.length === 0) return
      if (e.target.closest('.work-mobile-carousel')) return
      if (e.target?.closest?.('a, button, input, textarea, select, [role="button"], .interactive-card, .contact-card, .footer-social-btn, .footer-scroll-top-btn, .mobile-menu-toggle, .work-coverflow-card, .work-mobile-deck-container')) return

      const deltaY = touchStartY - e.changedTouches[0].clientY
      const deltaX = touchStartX - e.changedTouches[0].clientX

      // Dominant vertical swipe over horizontal
      if (Math.abs(deltaY) > 48 && Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
        const direction = deltaY > 0 ? 1 : -1
        const nextSection = Math.max(
          0,
          Math.min(3, currentSectionRef.current + direction)
        )
        if (nextSection !== currentSectionRef.current) {
          transitionToSection(nextSection)
        }
      }
    }

    // Keyboard navigation (ArrowDown, ArrowUp, PageDown, PageUp, Space)
    const handleKeyDown = (e) => {
      if (document.body.dataset.modalOpen === 'true' || document.getElementById('ppt-fullscreen-scroller')) return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        if (!isTransitioningRef.current) {
          const next = Math.min(3, currentSectionRef.current + 1)
          if (next !== currentSectionRef.current) transitionToSection(next)
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        if (!isTransitioningRef.current) {
          const prev = Math.max(0, currentSectionRef.current - 1)
          if (prev !== currentSectionRef.current) transitionToSection(prev)
        }
      } else if (e.key === 'Home') {
        e.preventDefault()
        if (!isTransitioningRef.current) transitionToSection(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        if (!isTransitioningRef.current) transitionToSection(3)
      }
    }

    // Direct section navigation event (triggered by navbar clicks or buttons)
    const handleSectionNavigate = (e) => {
      if (e.detail && typeof e.detail.index === 'number') {
        transitionToSection(e.detail.index)
      }
    }

    // URL hash navigation
    const handleHashChange = () => {
      const targetMap = {
        '#home': 0,
        '#about': 1,
        '#work': 2,
        '#contact': 3,
      }
      const idx = targetMap[window.location.hash]
      if (idx !== undefined && idx !== currentSectionRef.current) {
        transitionToSection(idx)
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('sectionnavigate', handleSectionNavigate)
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
      if (deltaResetTimerRef.current) clearTimeout(deltaResetTimerRef.current)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('sectionnavigate', handleSectionNavigate)
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  // Desktop-only magnetic hover effect (±4px cursor pull on fine-pointer devices)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const finePointerQuery = window.matchMedia('(pointer: fine)')
    if (!finePointerQuery.matches) return

    let activeEl = null

    const magneticSelector = [
      '.hero-nav .nav-item',
      '.btn-connect',
      '.mobile-sticky-connect-pill',
      '.footer-social-btn',
      '.footer-scroll-top-btn',
      '.btn-collab-primary',
      '.btn-collab-secondary',
      '.btn-collab-cv',
      '.contact-mobile-action-btn',
      '.about-cta-pill',
      '.btn-cta',
      '[data-magnetic="true"]',
    ].join(', ')

    const handlePointerOver = (e) => {
      const el = e.target.closest(magneticSelector)
      if (el) {
        activeEl = el
      }
    }

    const handlePointerMove = (e) => {
      if (!activeEl) return
      const rect = activeEl.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      const pullX = Math.max(-4, Math.min(4, (x / (rect.width / 2)) * 4))
      const pullY = Math.max(-4, Math.min(4, (y / (rect.height / 2)) * 4))
      gsap.to(activeEl, {
        x: pullX,
        y: pullY,
        duration: 0.25,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }

    const handlePointerOut = (e) => {
      if (activeEl && (!e.relatedTarget || !activeEl.contains(e.relatedTarget))) {
        gsap.to(activeEl, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1.1, 0.4)',
          overwrite: 'auto',
        })
        activeEl = null
      }
    }

    document.addEventListener('pointerover', handlePointerOver, { passive: true })
    document.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.addEventListener('pointerout', handlePointerOut, { passive: true })

    return () => {
      document.removeEventListener('pointerover', handlePointerOver)
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerout', handlePointerOut)
    }
  }, [])

  // High-performance pointer drag controller with window-level release handling & inertia glide
  const handleDragDown = (e) => {
    // Disable character drag when preview modal or lightbox is open
    if (isModalOpen || document.body.dataset.modalOpen === 'true') return
    // Only primary mouse button (left click) or touch/pen
    if (e.button !== undefined && e.button !== 0) return
    // Ensure underlying links/buttons and selectable text blocks outside the canvas remain interactive
    if (e.target?.closest?.('a, button, input, textarea, select, [role="button"], .interactive-card, .contact-card, .footer-social-btn, .footer-scroll-top-btn, .mobile-menu-toggle, .work-coverflow-card, .work-mobile-deck-container, .work-header-block, .work-subtitle, .work-subtext, .work-heading, .work-mobile-header-block, .select-text')) return

    const state = characterDragRef.current
    state.isDragging = true
    document.body.classList.add('is-character-dragging')
    state.startX = e.clientX
    state.startRotY = state.targetRotY
    state.lastX = e.clientX
    state.lastTime = performance.now()
    state.velocityX = 0

    const INITIAL_YAW = -Math.PI / 4
    const MAX_VIEW_RANGE = 55 * (Math.PI / 180) // 45° ± 55° natural viewing range
    const MIN_ROT = INITIAL_YAW - MAX_VIEW_RANGE
    const MAX_ROT = INITIAL_YAW + MAX_VIEW_RANGE

    const onPointerMove = (moveEvent) => {
      if (!state.isDragging) return
      const currentX = moveEvent.clientX
      const deltaX = currentX - state.startX
      const now = performance.now()
      const dt = Math.max(now - state.lastTime, 1)
      state.velocityX = (currentX - state.lastX) / dt
      state.lastX = currentX
      state.lastTime = now

      const isContactPage = currentSectionRef.current === 3 || scrollProgressRef.current >= 0.833
      if (isContactPage) {
        // Contact page: Sensitivity factor 0.008, full 360-degree rotation with neutral angle preserved
        const sensitivity = 0.008
        state.targetRotY = state.startRotY + deltaX * sensitivity
        state.contactDragOffset = state.targetRotY - CONTACT_BASE_ROTATION_Y
      } else {
        const isMobileDevice = window.innerWidth <= 768
        const sensitivity = isMobileDevice ? 0.0085 : 0.0045
        if (isMobileDevice) {
          state.targetRotY = state.startRotY + deltaX * sensitivity
        } else {
          state.targetRotY = THREE.MathUtils.clamp(
            state.startRotY + deltaX * sensitivity,
            MIN_ROT,
            MAX_ROT
          )
        }
      }
    }

    const onPointerUp = () => {
      state.isDragging = false
      document.body.classList.remove('is-character-dragging')
      const isContactPage = currentSectionRef.current === 3 || scrollProgressRef.current >= 0.833

      // Apply smooth damping / inertia glide on release
      if (Math.abs(state.velocityX) > 0.04) {
        if (isContactPage) {
          const sensitivity = 0.008
          const inertiaDelta = state.velocityX * 80 * sensitivity
          state.targetRotY = state.targetRotY + inertiaDelta
          state.contactDragOffset = state.targetRotY - CONTACT_BASE_ROTATION_Y
        } else {
          const isMobileDevice = window.innerWidth <= 768
          const sensitivity = isMobileDevice ? 0.0085 : 0.0045
          const inertiaDelta = state.velocityX * 90 * sensitivity
          if (isMobileDevice) {
            state.targetRotY = state.targetRotY + inertiaDelta
          } else {
            state.targetRotY = THREE.MathUtils.clamp(
              state.targetRotY + inertiaDelta,
              MIN_ROT,
              MAX_ROT
            )
          }
        }
      }

      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      window.removeEventListener('blur', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    window.addEventListener('blur', onPointerUp)
  }

  // Dedicated mobile touch gesture handlers (touchstart, touchmove, touchend)
  const handleTouchStart = (e) => {
    if (isModalOpen || document.body.dataset.modalOpen === 'true') return
    if (!e.touches || e.touches.length === 0) return
    if (e.target?.closest?.('a, button, input, textarea, select, [role="button"], .interactive-card, .contact-card, .footer-social-btn, .footer-scroll-top-btn, .mobile-menu-toggle, .work-coverflow-card, .work-mobile-deck-container')) return
    const touch = e.touches[0]
    const state = characterDragRef.current
    state.isDragging = true
    state.startX = touch.clientX
    state.startY = touch.clientY
    state.startRotY = state.targetRotY
    state.lastX = touch.clientX
    state.lastTime = performance.now()
    state.velocityX = 0
    state.touchDirection = null
  }

  const handleTouchMove = (e) => {
    const state = characterDragRef.current
    if (!state.isDragging || !e.touches || e.touches.length === 0) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - state.startX
    const deltaY = touch.clientY - state.startY

    const isContactPage = currentSectionRef.current === 3 || scrollProgressRef.current >= 0.833

    if (state.touchDirection === null) {
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        state.touchDirection = Math.abs(deltaX) >= Math.abs(deltaY) ? 'horizontal' : 'vertical'
      }
    }

    if (state.touchDirection === 'horizontal') {
      const now = performance.now()
      const dt = Math.max(now - state.lastTime, 1)
      state.velocityX = (touch.clientX - state.lastX) / dt
      state.lastX = touch.clientX
      state.lastTime = now

      const sensitivity = isContactPage ? 0.008 : 0.0085
      // Smooth 360-degree rotation on mobile touch drag
      state.targetRotY = state.startRotY + deltaX * sensitivity
      if (isContactPage) {
        state.contactDragOffset = state.targetRotY - CONTACT_BASE_ROTATION_Y
      }
    }
  }

  const handleTouchEnd = () => {
    const state = characterDragRef.current
    if (!state.isDragging) return
    state.isDragging = false
    const isContactPage = currentSectionRef.current === 3 || scrollProgressRef.current >= 0.833

    if (state.touchDirection === 'horizontal' && Math.abs(state.velocityX) > 0.04) {
      const sensitivity = isContactPage ? 0.008 : 0.0085
      const inertiaDelta = state.velocityX * (isContactPage ? 80 : 90) * sensitivity
      state.targetRotY = state.targetRotY + inertiaDelta
      if (isContactPage) {
        state.contactDragOffset = state.targetRotY - CONTACT_BASE_ROTATION_Y
      }
    }
    state.touchDirection = null
  }

  // Bind touch listeners on dragZoneRef with passive: true
  useEffect(() => {
    const el = dragZoneRef.current
    if (!el) return

    const onTouchStart = (e) => handleTouchStart(e)
    const onTouchMove = (e) => handleTouchMove(e)
    const onTouchEnd = () => handleTouchEnd()

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [])

  // 4-chapter narrative scene mapping:
  // Hero (Day) -> About (Night) -> Work (Day) -> Contact (Night)
  const currentScene =
    scrollProgress < 0.18 ? 'day' :
    scrollProgress < 0.52 ? 'night' :
    scrollProgress < 0.82 ? 'day' : 'night'

  const activePage =
    scrollProgress >= 0.833 ? 'contact' :
    scrollProgress >= 0.5 ? 'work' :
    scrollProgress >= 0.2 ? 'about' : 'hero'
  const currentRoute =
    activePage === 'contact' ? '/contact' :
    activePage === 'work' ? '/work' :
    activePage === 'about' ? '/about' : '/'

  return (
    <div className="portfolio-root">
      {/* Sleek Neon Lime Global Scroll Progress Bar along top of viewport */}
      <div
        className="fixed top-0 left-0 right-0 h-[2px] z-[9999] pointer-events-none"
        style={{
          transformOrigin: '0 50%',
          transform: `scaleX(${scrollProgress})`,
          background: '#d0ff00',
          boxShadow: '0 0 10px #d0ff00, 0 0 20px rgba(208, 255, 0, 0.6)',
          transition: 'transform 0.08s linear',
        }}
        aria-hidden="true"
      />

      {/* Scroll track providing runway for the Hero -> About cinematic transition */}
      <div className="hero-scroll-track" aria-hidden="true" />

      {/* Fixed Fullscreen Viewport Layer */}
      <div className="app-container">
        {/* Layer 1 (Backdrop): Video background container (z-0) */}
        <Environment scrollProgress={scrollProgress} currentScene={currentScene} />

        {/* Micro Backdrop Contrast Diffuser (2D Overlay, z-1) */}
        <div className="character-backdrop-diffuser" aria-hidden="true" />

        {/* Giant Single-Line Backdrop Headings behind character */}
        <AboutBackdropHeading scrollProgress={scrollProgress} />
        <WorkBackdropHeading scrollProgress={scrollProgress} />
        <ContactBackdropHeading scrollProgress={scrollProgress} />

        {/* Global Sticky "Let's Connect" Vertical Pill Tab & Popup (Mobile View Only) */}
        <MobileConnectTab />

        {/* PERSISTENT GLOBAL SCROLL BADGE */}
        {(() => {
          const current = (activePage || (typeof location !== 'undefined' ? location?.pathname : '') || '').toLowerCase();
          if (current.includes('contact')) return null;

          let line1 = "TOTAL MESS RIGHT NOW.";
          let line2 = "SCROLL TO FIX ME.";

          if (current.includes('work')) {
            line1 = "DON'T LEAVE ME HANGING";
            line2 = "LIKE A 7 PM BRIEF.";
          } else if (current.includes('about')) {
            line1 = "FINALLY COLOURS ALIGNING,";
            line2 = "KEEP SCROLLING";
          }

          return (
            <div
              id="persistent-scroll-indicator"
              style={{
                position: 'fixed',
                top: '12.8%',
                left: '59.5%',
                transform: 'translate(-50%, 0)',
                zIndex: 5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                userSelect: 'none',
                visibility: 'visible',
                opacity: 0.98,
                fontFamily: "'Dela Gothic One', 'Fredoka', cursive, sans-serif"
              }}
            >
              {/* LINE 1: SOLID CRISP WHITE WITH MATTE CHISELED BEVEL & DEEP #0D061A OUTLINE */}
              <span
                className={`${line1.length > 25 ? 'text-[17px] lg:text-[1.38rem]' : 'text-[23px] lg:text-[2.05rem]'} max-w-[90vw] text-center`}
                style={{
                  textTransform: 'uppercase',
                  lineHeight: 0.88,
                  fontWeight: 900,
                  letterSpacing: '0.045em',
                  wordSpacing: '0.25em',
                  color: '#FFFFFF',
                  padding: '0 8px',
                  /* Crisp dark purple-black backing outline */
                  WebkitTextStroke: '1.4px #0D061A',
                  paintOrder: 'stroke fill',
                  textShadow: `
                    /* Clean Geometric Bevel & 3D Extrusion (Zero Glow Bleed, Zero Plastic Shine) */
                    -1px 0 0 #CBD5E1,
                    1px 0 0 #CBD5E1,
                    0 1px 0 #CBD5E1,
                    0 2px 0 #94A3B8,
                    0 3px 0 #64748B,
                    0 4px 0 #334155,
                    0 5px 0 #0D061A,
                    -2px 5px 0 #0D061A,
                    2px 5px 0 #0D061A,
                    
                    /* Directional Ground Occlusion Shadow */
                    0 7px 12px rgba(13, 6, 26, 0.85),
                    0 12px 20px rgba(0, 0, 0, 0.75)
                  `
                }}
              >
                {line1}
              </span>

              {/* LINE 2: SOLID NEON LIME GREEN (#B4F82B) WITH MATTE CHISELED BEVEL & DEEP #0D061A OUTLINE */}
              <span
                className={`${line2.length > 25 ? 'text-[20px] lg:text-[1.65rem]' : 'text-[28px] lg:text-[2.45rem]'} mt-[5px] max-w-[90vw] text-center`}
                style={{
                  textTransform: 'uppercase',
                  lineHeight: 0.88,
                  fontWeight: 900,
                  letterSpacing: '0.045em',
                  wordSpacing: '0.25em',
                  color: '#B4F82B', /* Crisp Solid Neon Lime Green */
                  padding: '0 8px',
                  /* Crisp dark purple-black backing outline */
                  WebkitTextStroke: '1.4px #0D061A',
                  paintOrder: 'stroke fill',
                  textShadow: `
                    /* Clean Geometric Bevel & 3D Extrusion (Zero Glow Bleed, Zero Plastic Shine) */
                    -1px 0 0 #9EE41A,
                    1px 0 0 #9EE41A,
                    0 1px 0 #9EE41A,
                    0 2px 0 #85C412,
                    0 3px 0 #6BA30A,
                    0 4px 0 #4C7505,
                    0 5px 0 #0D061A,
                    -2px 5px 0 #0D061A,
                    2px 5px 0 #0D061A,
                    
                    /* Directional Ground Occlusion Shadow */
                    0 7px 12px rgba(13, 6, 26, 0.85),
                    0 12px 20px rgba(0, 0, 0, 0.75)
                  `
                }}
              >
                {line2}
              </span>
            </div>
          );
        })()}

        {/* Layer 2 (3D Scene): Transparent Three.js Character Canvas (z-20 sits in front of scroll text z-5) */}
        <div
          className="canvas-layer"
          style={{ zIndex: 20, pointerEvents: 'auto', touchAction: 'none' }}
          onPointerDown={handleDragDown}
        >
          <Canvas
            camera={{ position: [0, 0, 3], fov: 42 }}
            gl={{
              alpha: true,
              antialias: true,
              powerPreference: 'high-performance',
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.1,
            }}
            dpr={[1, 2]}
          >
            <ResponsiveCamera />
            <CinematicLighting scrollProgress={scrollProgress} currentScene={currentScene} />

            <Suspense fallback={<ambientLight intensity={0.6} color="#fff1e6" />}>
              <HeroCharacter
                scrollProgress={scrollProgress}
                characterDragRef={characterDragRef}
                currentRoute={currentRoute}
                activePage={activePage}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Layer 3: High-performance Character Drag Zone covering canvas layer (z-21) */}
        <div
          ref={dragZoneRef}
          className="character-drag-zone"
          style={{ zIndex: 21, pointerEvents: isModalOpen ? 'none' : 'auto' }}
          aria-label="Drag horizontally to rotate character"
          onPointerDown={handleDragDown}
        />

        {/* Loading Screen Overlay while GLB streams */}
        <LoadingScreen />

        {/* Persistent Header Navigation & Hero Copy */}
        <HeroUI scrollProgress={scrollProgress} />

        {/* Cinematic About Me Section */}
        <AboutUI scrollProgress={scrollProgress} />

        {/* Selected Work Section */}
        <WorkUI
          scrollProgress={scrollProgress}
          onPreviewOpenChange={setIsModalOpen}
          onCharacterDragDown={handleDragDown}
          onCharacterTouchStart={handleTouchStart}
          onCharacterTouchMove={handleTouchMove}
          onCharacterTouchEnd={handleTouchEnd}
        />

        {/* Cinematic Contact & Climax Section */}
        <ContactUI
          scrollProgress={scrollProgress}
          onCharacterDragDown={handleDragDown}
          onCharacterTouchStart={handleTouchStart}
          onCharacterTouchMove={handleTouchMove}
          onCharacterTouchEnd={handleTouchEnd}
        />

        {/* Interactive Cube Narrative Cues & Scroll Indicator System */}
        <NarrativeScrollPill scrollProgress={scrollProgress} />

        {/* Global Floating Glassmorphic Docked Footer */}
        <Footer scrollProgress={scrollProgress} />
      </div>
    </div>
  )
}
