import React, { useState, useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import { PROJECTS_DATA, checkIsVideo, cleanAssetUrl } from '../data/projectsData'
import ProjectPreview from './ProjectPreview'
import TransformBoundingBox from './TransformBoundingBox'

/**
 * WorkUI Component (Matching Reference Image Composition Strictly)
 *
 * Requirements:
 * 1. SCALE THE 9 BOXES / CARDS (3X LARGER):
 *    - Dominant, prominent card footprint matching reference screenshot composition.
 *    - Large, premium aspect ratio with rounded corners (#65676b placeholder / image).
 *    - Distinctive bottom-right docked notch with inverted fillets containing compact orange "View" button.
 * 2. SHIFT GRID + "WORK" TEXT TO MIDDLE (CLOSE TO CHARACTER):
 *    - Left block ("WORK" title + subtitle + 3x3 Grid) shifted away from screen left edge towards center/middle.
 *    - Text and Grid left edges strictly aligned (margin-left: 0).
 *    - Tight, intentional proximity to the 3D iMac and character desk area.
 * 3. FUNCTIONAL SCROLL INDICATOR LINE (GRID HEIGHT MATCH):
 *    - Vertical divider line height strictly matches 3x3 Grid top-to-bottom height (does not overshoot).
 *    - Real-time sliding orange pill tracking grid scroll progress (scrollTop / scrollHeight).
 *    - Interactive click & pointer drag-to-scrub along the track for real-time scrolling.
 * 4. CONTAINED SCROLL FOR 20+ PROJECTS:
 *    - Exactly 9 large cards (clean 3x3) visible initially.
 *    - Native scrollbar hidden; orange indicator pill acts as active tracker.
 *    - Smooth internal vertical scrolling & touchpad/mousewheel through 20+ projects without breaking page layout.
 */
/**
 * WorkBackdropHeading Component
 * Renders the giant "WORK" heading in Layer 1 (BEHIND the 3D Canvas).
 * Strictly ONE SINGLE LINE, centered behind the 3D character's head,
 * matching the exact typographic composition and vertical baseline of ABOUT ME and LET'S TALK.
 */
export function WorkBackdropHeading({ scrollProgress = 0 }) {
  // Enters around 0.46, fully visible during Work [0.58, 0.74], fades out cleanly [0.74, 0.88]
  let workT = 0
  if (scrollProgress >= 0.46 && scrollProgress <= 0.88) {
    if (scrollProgress < 0.58) {
      workT = (scrollProgress - 0.46) / 0.12
    } else if (scrollProgress <= 0.74) {
      workT = 1
    } else {
      workT = 1 - (scrollProgress - 0.74) / 0.14
    }
  }
  const translateY = (1 - workT) * 24

  return (
    <div
      className="work-backdrop-layer"
      style={{
        opacity: workT,
        transform: `translateY(${translateY}px)`,
        pointerEvents: 'none',
        zIndex: 1,
      }}
      aria-hidden="true"
    >
      <h2 className="work-backdrop-heading sharp-isometric-shadow neon-long-shadow">WORK</h2>
    </div>
  )
}

export default function WorkUI({
  scrollProgress = 0,
  onPreviewOpenChange,
  onCharacterDragDown,
  onCharacterTouchStart,
  onCharacterTouchMove,
  onCharacterTouchEnd,
}) {
  const [previewProject, setPreviewProject] = useState(null)
  const [scrollProgressPct, setScrollProgressPct] = useState(0)

  // Mobile 3D Coverflow / Flanked Deck state & gesture refs
  const [activeDeckIndex, setActiveDeckIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDeckDragging, setIsDeckDragging] = useState(false)

  const touchStartXRef = useRef(0)
  const touchStartYRef = useRef(0)
  const touchStartTimeRef = useRef(0)
  const touchDirectionRef = useRef(null)
  const hasDraggedCardRef = useRef(false)
  const dragOffsetRef = useRef(0)

  const gridRef = useRef(null)
  const trackerTrackRef = useRef(null)
  const isDraggingTracker = useRef(false)

  // Drag-to-scroll state for the grid container
  const isPointerDownOnGrid = useRef(false)
  const gridDragStartY = useRef(0)
  const gridTouchStartY = useRef(0)
  const gridDragStartScroll = useRef(0)
  const hasDraggedGrid = useRef(false)

  // Determine if we are actively in the WORK section (HOME: 0.0, ABOUT: 0.333, WORK: 0.667, CONTACT: 1.0)
  const isWorkActive = scrollProgress >= 0.48 && scrollProgress < 0.85

  // Velocity skew and cascade entry states
  const [gridSkewY, setGridSkewY] = useState(0)
  const lastGridScrollTop = useRef(0)
  const skewTweenRef = useRef(null)
  const hasAnimatedWorkRef = useRef(false)

  // Preload project thumbnail images for instant mobile carousel display without blanks
  useEffect(() => {
    PROJECTS_DATA.forEach((project) => {
      if (project.thumbnail && !checkIsVideo(project.thumbnail)) {
        const img = new Image()
        img.src = cleanAssetUrl(project.thumbnail)
      }
    })
  }, [])

  // Staggered Entry Cascade: animate cards on entering Work (desktop only)
  useEffect(() => {
    if (isWorkActive && !hasAnimatedWorkRef.current) {
      hasAnimatedWorkRef.current = true
      const cards = document.querySelectorAll('.work-grid-3col .work-project-card')
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          {
            opacity: 0,
            y: 50,
            scale: 0.94,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.06,
            duration: 0.7,
            ease: 'back.out(1.2)',
          }
        )
      }
    } else if (!isWorkActive) {
      hasAnimatedWorkRef.current = false
    }
  }, [isWorkActive])

  // Notify parent of modal open/close for scroll locks and character drag control
  useEffect(() => {
    onPreviewOpenChange?.(Boolean(previewProject && isWorkActive))
  }, [previewProject, isWorkActive, onPreviewOpenChange])

  // STRICT GUARD: If user navigates away from Work section, immediately close any active preview
  useEffect(() => {
    if (!isWorkActive && previewProject) {
      console.log("Closing modal triggered by: WorkUI !isWorkActive guard", { scrollProgress, isWorkActive, projectId: previewProject?.id })
      setPreviewProject(null)
    }
  }, [isWorkActive, previewProject, scrollProgress])

  // Work section active range: enters at 0.48, fully visible 0.60 - 0.74, fades out 0.74 - 0.88
  let opacity = 0
  if (scrollProgress >= 0.48 && scrollProgress <= 0.88) {
    if (scrollProgress < 0.60) {
      opacity = (scrollProgress - 0.48) / 0.12
    } else if (scrollProgress <= 0.74) {
      opacity = 1
    } else {
      opacity = 1 - (scrollProgress - 0.74) / 0.14
    }
  }

  const isInteractive = isWorkActive && opacity > 0.5
  const isWorkVisible = isWorkActive && opacity > 0.01
  const translateY = (1 - opacity) * 16

  const containerStyle = {
    opacity,
    transform: `translateY(${translateY}px)`,
    pointerEvents: 'none',
    visibility: isWorkVisible ? 'visible' : 'hidden',
    display: isWorkVisible ? 'flex' : 'none',
    transition: 'opacity 0.16s ease-out, transform 0.16s ease-out',
  }

  // Real-time functional scroll tracking for the vertical divider indicator + velocity skew
  const handleGridScroll = useCallback((e) => {
    const el = e.currentTarget
    const maxScroll = el.scrollHeight - el.clientHeight
    if (maxScroll > 0) {
      const pct = Math.min(Math.max(el.scrollTop / maxScroll, 0), 1)
      setScrollProgressPct(pct)
    } else {
      setScrollProgressPct(0)
    }

    // Scroll Velocity Skew (clamped to ±3deg, springs back to 0deg)
    const deltaY = el.scrollTop - lastGridScrollTop.current
    lastGridScrollTop.current = el.scrollTop
    const rawSkew = Math.max(-3, Math.min(3, deltaY * 0.08))

    if (skewTweenRef.current) skewTweenRef.current.kill()
    setGridSkewY(rawSkew)
    skewTweenRef.current = gsap.to(
      { val: rawSkew },
      {
        val: 0,
        duration: 0.35,
        ease: 'power2.out',
        onUpdate: function () {
          setGridSkewY(this.targets()[0].val)
        },
      }
    )
  }, [])

  // Prevent grid mousewheel scrolling from bubbling to window scroll transitions
  const handleGridWheel = (e) => {
    if (e.target.closest('.ppt-scroll-container') || e.target.closest('.project-modal-scroll')) {
      return
    }
    e.stopPropagation()
  }

  // Tablet / iPad Touch Handlers: Isolate grid scrolling & stop bubbling if actively scrollable
  const handleGridTouchStart = (e) => {
    if (!gridRef.current || !e.touches || e.touches.length === 0) return
    gridTouchStartY.current = e.touches[0].clientY
    const el = gridRef.current
    const isScrollable = el.scrollHeight > el.clientHeight + 2
    if (isScrollable) {
      e.stopPropagation()
    }
  }

  const handleGridTouchMove = (e) => {
    if (!gridRef.current || !e.touches || e.touches.length === 0) return
    const currentY = e.touches[0].clientY
    const deltaY = gridTouchStartY.current - currentY // > 0: swiping up (scrolling down), < 0: swiping down (scrolling up)
    const el = gridRef.current
    const isScrollable = el.scrollHeight > el.clientHeight + 2
    if (!isScrollable) return

    const canScrollDown = el.scrollTop + el.clientHeight < el.scrollHeight - 5
    const canScrollUp = el.scrollTop > 5

    if ((deltaY > 0 && canScrollDown) || (deltaY < 0 && canScrollUp)) {
      e.stopPropagation()
    }
  }

  const handleGridTouchEnd = (e) => {
    if (!gridRef.current || !e.changedTouches || e.changedTouches.length === 0) return
    const currentY = e.changedTouches[0].clientY
    const deltaY = gridTouchStartY.current - currentY
    const el = gridRef.current
    const isScrollable = el.scrollHeight > el.clientHeight + 2
    if (!isScrollable) return

    const canScrollDown = el.scrollTop + el.clientHeight < el.scrollHeight - 5
    const canScrollUp = el.scrollTop > 5

    if ((deltaY > 0 && canScrollDown) || (deltaY < 0 && canScrollUp)) {
      e.stopPropagation()
    }
  }

  // Interactive scrubber: updates grid scroll and indicator pill in real time
  const updateScrollFromTrackerY = useCallback((clientY) => {
    if (!gridRef.current || !trackerTrackRef.current) return
    const rect = trackerTrackRef.current.getBoundingClientRect()
    const pillH = 42
    const availableTrack = rect.height - pillH
    if (availableTrack <= 0) return

    const clickY = clientY - rect.top - pillH / 2
    const ratio = Math.min(Math.max(clickY / availableTrack, 0), 1)
    const maxScroll = gridRef.current.scrollHeight - gridRef.current.clientHeight

    gridRef.current.scrollTop = ratio * maxScroll
    setScrollProgressPct(ratio)
  }, [])

  // Pointer down on vertical tracker track: starts dragging/scrubbing immediately
  const handleTrackerPointerDown = (e) => {
    e.stopPropagation()
    e.preventDefault()
    isDraggingTracker.current = true
    updateScrollFromTrackerY(e.clientY)

    const handlePointerMove = (moveEvent) => {
      if (!isDraggingTracker.current) return
      updateScrollFromTrackerY(moveEvent.clientY)
    }

    const handlePointerUp = () => {
      isDraggingTracker.current = false
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  // Optional tactile drag-to-scroll on grid container (desktop only: >= 1024px)
  const handleGridPointerDown = (e) => {
    if (window.innerWidth < 1024) return // Natural touch scroll on mobile
    if (e.button !== 0) return
    isPointerDownOnGrid.current = true
    hasDraggedGrid.current = false
    gridDragStartY.current = e.clientY
    gridDragStartScroll.current = gridRef.current ? gridRef.current.scrollTop : 0
  }

  const handleGridPointerMove = (e) => {
    if (window.innerWidth < 1024) return
    if (!isPointerDownOnGrid.current || !gridRef.current) return
    const deltaY = e.clientY - gridDragStartY.current
    if (Math.abs(deltaY) > 5) {
      hasDraggedGrid.current = true
    }
    if (hasDraggedGrid.current) {
      gridRef.current.scrollTop = gridDragStartScroll.current - deltaY
    }
  }

  const handleGridPointerUp = () => {
    if (window.innerWidth < 1024) return
    isPointerDownOnGrid.current = false
    setTimeout(() => {
      hasDraggedGrid.current = false
    }, 60)
  }

  // Advance to next project in 3D coverflow
  const handleNextCard = useCallback(() => {
    setActiveDeckIndex((prev) => (prev + 1) % PROJECTS_DATA.length)
    setDragOffset(0)
  }, [])

  // Go to previous project in 3D coverflow
  const handlePrevCard = useCallback(() => {
    setActiveDeckIndex((prev) => (prev - 1 + PROJECTS_DATA.length) % PROJECTS_DATA.length)
    setDragOffset(0)
  }, [])

  // Touch Gesture handlers for 3D Coverflow swipe
  const handleDeckTouchStart = useCallback((e) => {
    // Note: Do NOT stopPropagation so touchstart bubbles to window for section navigation
    const touch = e.touches[0]
    if (!touch) return
    touchStartXRef.current = touch.clientX
    touchStartYRef.current = touch.clientY
    touchStartTimeRef.current = Date.now()
    touchDirectionRef.current = null
    hasDraggedCardRef.current = false
    dragOffsetRef.current = 0
    setDragOffset(0)
  }, [])

  const handleDeckTouchMove = useCallback((e) => {
    const touch = e.touches[0]
    if (!touch) return
    const dx = touch.clientX - touchStartXRef.current
    const dy = touch.clientY - touchStartYRef.current

    if (!touchDirectionRef.current) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        if (Math.abs(dy) >= Math.abs(dx)) {
          touchDirectionRef.current = 'vertical'
        } else {
          touchDirectionRef.current = 'horizontal'
          setIsDeckDragging(true)
        }
      }
    }

    if (touchDirectionRef.current === 'vertical') {
      // Allow vertical page scroll without interference; do not lock or preventDefault
      return
    }

    if (touchDirectionRef.current === 'horizontal') {
      if (e.cancelable) e.preventDefault()
      e.stopPropagation()
      if (Math.abs(dx) > 8) {
        hasDraggedCardRef.current = true
      }
      dragOffsetRef.current = dx
      setDragOffset(dx)
    }
  }, [])

  const handleDeckTouchEnd = useCallback((e) => {
    if (touchDirectionRef.current === 'horizontal') {
      e?.stopPropagation?.()
      const dt = Math.max(1, Date.now() - touchStartTimeRef.current)
      const currentOffset = dragOffsetRef.current
      const velocityX = currentOffset / dt
      const SWIPE_DIST_THRESHOLD = 35 // px - snappy responsive threshold
      const VELOCITY_THRESHOLD = 0.18 // px/ms

      if (currentOffset < -SWIPE_DIST_THRESHOLD || velocityX < -VELOCITY_THRESHOLD) {
        // Swiping LEFT moves Next card to center
        setActiveDeckIndex((prev) => (prev + 1) % PROJECTS_DATA.length)
      } else if (currentOffset > SWIPE_DIST_THRESHOLD || velocityX > VELOCITY_THRESHOLD) {
        // Swiping RIGHT moves Previous card to center
        setActiveDeckIndex((prev) => (prev - 1 + PROJECTS_DATA.length) % PROJECTS_DATA.length)
      }
      setTimeout(() => {
        hasDraggedCardRef.current = false
      }, 60)
    } else {
      // Vertical swipe or quick tap: DO NOT stop propagation so page scroll / section navigation proceeds
      hasDraggedCardRef.current = false
    }

    setIsDeckDragging(false)
    dragOffsetRef.current = 0
    setDragOffset(0)
    touchDirectionRef.current = null
  }, [])

  // Card click handler: Tapping flanking cards directly centers them; tapping center card opens preview
  const handleCardClick = useCallback((offset, project, e) => {
    if (e) {
      if (e.cancelable) e.preventDefault()
      e.stopPropagation()
    }
    if (hasDraggedCardRef.current) return
    if (offset < 0) {
      setActiveDeckIndex((prev) => (prev + offset + PROJECTS_DATA.length) % PROJECTS_DATA.length)
      setDragOffset(0)
    } else if (offset > 0) {
      setActiveDeckIndex((prev) => (prev + offset) % PROJECTS_DATA.length)
      setDragOffset(0)
    } else if (offset === 0) {
      console.log("Opening project:", project.id, "(from mobile deck click)")
      setPreviewProject(project)
    }
  }, [])

  const handleClosePreview = useCallback((reason = "WorkUI handleClosePreview") => {
    console.log("Closing modal triggered by:", reason)
    setPreviewProject(null)
  }, [])

  const handleSelectProject = useCallback((nextP) => {
    console.log("Opening project:", nextP.id, "(from handleSelectProject)")
    setPreviewProject(nextP)
  }, [])

  return (
    <>
      <section
        id="work"
        className="work-foreground-overlay"
        style={containerStyle}
        aria-label="Selected Work by Umesh Pawar"
      >
        {/* Desktop View: Preserved strictly for min-width: 1024px */}
        <div
          className="work-composition-wrapper work-desktop-stage"
          style={{ pointerEvents: isInteractive ? 'auto' : 'none' }}
        >
          {/* Main Content Stage: Centers the portfolio block naturally between left viewport space and 3D character */}
          <div className="work-content-stage">
            <div className="work-left-pane">
              {/* Header Block: Left-aligned strictly with 3x3 grid below, elevated above 3D canvas for text selection */}
              <div
                className="work-header-block relative z-30 select-text"
                style={{
                  pointerEvents: isWorkActive ? 'auto' : 'none',
                  userSelect: 'text',
                  WebkitUserSelect: 'text',
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <h2
                  className="work-heading has-transform-box sharp-isometric-shadow neon-long-shadow select-text"
                  style={{
                    pointerEvents: 'auto',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  WORK
                  <TransformBoundingBox />
                </h2>
                <p
                  className="work-subtitle font-bold select-text"
                  style={{
                    pointerEvents: 'auto',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    cursor: 'text',
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  Briefs that walked in ordinary, campaigns that walked out sharp.
                </p>
                <p
                  className="hidden md:block font-bold work-subtext select-text"
                  style={{
                    pointerEvents: 'auto',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    cursor: 'text',
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  (Scroll down, yahan chai, tears, aur approved revisions ka display hai.)
                </p>
              </div>

              {/* 2X Scaled 3x3 Grid + Linked Vertical Scroll Tracker */}
              <div className="work-grid-tracker-wrapper">
                {/* 3x3 Grid with Contained Smooth Vertical Scroll (No Pagination Numbers) */}
                <div
                  className="work-grid-3col overscroll-y-contain"
                  ref={gridRef}
                  role="region"
                  aria-label="Selected Projects Grid"
                  style={{
                    pointerEvents: isInteractive ? 'auto' : 'none',
                    transform: gridSkewY !== 0 ? `skewY(${gridSkewY.toFixed(2)}deg)` : undefined,
                    transformOrigin: 'center center',
                    transition: gridSkewY === 0 ? 'transform 0.25s ease-out' : undefined,
                  }}
                  onScroll={handleGridScroll}
                  onWheel={handleGridWheel}
                  onTouchStart={handleGridTouchStart}
                  onTouchMove={handleGridTouchMove}
                  onTouchEnd={handleGridTouchEnd}
                  onPointerDown={handleGridPointerDown}
                  onPointerMove={handleGridPointerMove}
                  onPointerUp={handleGridPointerUp}
                  onPointerLeave={handleGridPointerUp}
                >
                  {PROJECTS_DATA.map((project, i) => {
                    const isEven = i % 2 === 0
                    return (
                      <article
                        key={project.id}
                        className={`work-project-card ${isEven ? 'card-type-a' : 'card-type-b'}`}
                        aria-label={project.title}
                        onPointerDown={(e) => {
                          e.stopPropagation?.()
                        }}
                        onClick={(e) => {
                          e.preventDefault?.()
                          e.stopPropagation?.()
                          if (hasDraggedGrid.current) return
                          console.log("Opening project:", project.id, "(from desktop grid card click)")
                          setPreviewProject(project)
                        }}
                      >
                        {/* Inner Thumbnail / Media Window (Upper ~75%) */}
                        <div className={`work-card-media-window has-transform-box ${project.thumbnailClass ? 'is-aspect-video' : ''}`}>
                          {project.thumbnail ? (
                            checkIsVideo(project.thumbnail) ? (
                              <video
                                src={cleanAssetUrl(project.thumbnail)}
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="auto"
                                className={`work-card-thumbnail ${project.thumbnailClass || ''}`}
                                onLoadedMetadata={(e) => {
                                  e.currentTarget.play().catch(() => {})
                                }}
                              />
                            ) : (
                              <img
                                src={cleanAssetUrl(project.thumbnail)}
                                alt={project.title}
                                className={`work-card-thumbnail ${project.thumbnailClass || ''}`}
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                              />
                            )
                          ) : (
                            <div className="work-card-empty-media" aria-hidden="true" />
                          )}
                          <TransformBoundingBox />
                        </div>

                        {/* Bottom Header Bar (Lower ~25%) */}
                        <div className="work-card-bottom-bar flex items-center justify-between w-full pt-2.5 pb-1 px-1 gap-2.5 min-h-[44px]">
                          {/* Full Name Container - Wraps into 2 lines if needed */}
                          <h3
                            className="work-card-name font-['Archivo'] font-black uppercase text-sm sm:text-base lg:text-[15px] leading-[1.1] leading-tight break-words whitespace-normal flex-1 min-w-0"
                            style={{
                              fontSize: 'clamp(13px, 1.15vw, 15px)',
                              lineHeight: 1.1,
                              color: isEven ? '#d8ff00' : '#004af2',
                            }}
                            title={project.title || project.name}
                          >
                            {project.title || project.name}
                          </h3>

                          {/* Fixed Arrow Button - Stays vertically centered and pinned */}
                          <div className="shrink-0 self-center">
                            <button
                              type="button"
                              className={`work-card-arrow-btn w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border-none cursor-pointer p-0 transition-transform hover:scale-110 shadow-sm ${
                                isEven ? 'bg-white text-black' : 'bg-black text-white'
                              }`}
                              onPointerDown={(e) => {
                                e.stopPropagation?.()
                              }}
                              onClick={(e) => {
                                e.preventDefault?.()
                                e.stopPropagation?.()
                                if (hasDraggedGrid.current) return
                                console.log("Opening project:", project.id, "(from desktop arrow btn click)")
                                setPreviewProject(project)
                              }}
                              aria-label={`Open preview for ${project.title || project.name}`}
                            >
                              <span className="text-xs sm:text-sm font-bold leading-none select-none" aria-hidden="true">→</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>

                {/* Vertical Divider Line with Real-Time Orange Scroll Progress Indicator */}
                <div
                  className="work-vertical-scroll-tracker"
                  onPointerDown={handleTrackerPointerDown}
                  role="scrollbar"
                  aria-valuenow={Math.round(scrollProgressPct * 100)}
                  aria-label="Project Grid Scroll Indicator"
                >
                  <div className="work-tracker-track" ref={trackerTrackRef}>
                    <div
                      className="work-tracker-pill"
                      style={{
                        top: `calc(${scrollProgressPct * 100}% - ${scrollProgressPct * 42}px)`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Area: Transparent zone where 3D Character sits and can be dragged */}
          <div
            className="work-character-zone"
            aria-label="Drag horizontally to rotate character"
            style={{ pointerEvents: isInteractive ? 'auto' : 'none' }}
            onPointerDown={onCharacterDragDown}
            onTouchStart={onCharacterTouchStart}
            onTouchMove={onCharacterTouchMove}
            onTouchEnd={onCharacterTouchEnd}
            onTouchCancel={onCharacterTouchEnd}
          />
        </div>

        {/* Mobile View: 3D Swipeable Card Stack Deck */}
        <div
          className="work-mobile-stage"
          style={{
            pointerEvents: 'none',
            display: isWorkVisible ? 'flex' : 'none',
            visibility: isWorkVisible ? 'visible' : 'hidden',
          }}
        >

          <div
            className="work-mobile-header-block text-center px-4 mb-2 relative z-30 select-text"
            style={{
              pointerEvents: isWorkVisible ? 'auto' : 'none',
              userSelect: 'text',
              WebkitUserSelect: 'text',
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <p
              className="work-mobile-subtitle font-bold select-text text-xs sm:text-sm md:text-base"
              style={{
                pointerEvents: 'auto',
                userSelect: 'text',
                WebkitUserSelect: 'text',
                cursor: 'text',
                margin: '0 0 2px 0',
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              Briefs that walked in ordinary, campaigns that walked out sharp.
            </p>
            <p
              className="work-mobile-subtext font-bold select-text text-[11px] sm:text-xs block md:hidden"
              style={{
                pointerEvents: 'auto',
                userSelect: 'text',
                WebkitUserSelect: 'text',
                cursor: 'text',
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              (Swipe through, yahan chai, tears, aur approved revisions ka display hai.)
            </p>
          </div>

          <div
            className="work-mobile-deck-container"
            style={{
              pointerEvents: isInteractive ? 'auto' : 'none',
              touchAction: 'pan-y',
            }}
            onTouchStart={handleDeckTouchStart}
            onTouchMove={handleDeckTouchMove}
            onTouchEnd={handleDeckTouchEnd}
            onTouchCancel={handleDeckTouchEnd}
          >
            {[-2, 2, -1, 1, 0].map((offset) => {
              const projectIndex =
                (activeDeckIndex + offset + PROJECTS_DATA.length) % PROJECTS_DATA.length
              const project = PROJECTS_DATA[projectIndex]
              const isCenter = offset === 0
              const isLeftFlank = offset === -1
              const isRightFlank = offset === 1
              const isFarLeft = offset === -2
              const isFarRight = offset === 2
              const isEven = projectIndex % 2 === 0

              // Visual Architecture:
              // Center Card (Active / Index i):
              //   transform: translateX(0) scale(1) translateZ(0)
              //   opacity: 1, z-index: 30
              // Previous Card (Left Flank / Index i - 1):
              //   transform: translateX(-48%) scale(0.82) rotateY(12deg) translateZ(-40px)
              //   opacity: 0.6, z-index: 20
              // Next Card (Right Flank / Index i + 1):
              //   transform: translateX(48%) scale(0.82) rotateY(-12deg) translateZ(-40px)
              //   opacity: 0.6, z-index: 20
              // Far Buffer Cards (Index i - 2, i + 2):
              //   Pre-rendered in DOM, opacity 0, ready to transition immediately

              let cardTransform = ''
              let cardOpacity = isCenter ? 1 : isLeftFlank || isRightFlank ? 0.6 : 0
              let zIndex = isCenter ? 30 : isLeftFlank || isRightFlank ? 20 : 10

              if (isDeckDragging) {
                const p = Math.min(1, Math.max(-1, dragOffset / 150))
                const deckSkewX = Math.max(-3, Math.min(3, -p * 3))
                if (isCenter) {
                  cardTransform = `translateX(${dragOffset}px) scale(${1 - Math.abs(p) * 0.18}) rotateY(${-p * 14}deg) skewX(${deckSkewX.toFixed(2)}deg) translateZ(${-Math.abs(p) * 40}px)`
                  cardOpacity = 1 - Math.abs(p) * 0.35
                } else if (isLeftFlank) {
                  if (dragOffset > 0) {
                    const t = Math.min(1, dragOffset / 140)
                    cardTransform = `translateX(calc(-48% + ${t * 48}%)) scale(${0.82 + t * 0.18}) rotateY(${12 - t * 12}deg) translateZ(${-40 + t * 40}px)`
                    cardOpacity = 0.6 + t * 0.4
                    if (t > 0.5) zIndex = 25
                  } else {
                    const t = Math.min(1, -dragOffset / 140)
                    cardTransform = `translateX(calc(-48% - ${t * 47}%)) scale(${0.82 - t * 0.17}) rotateY(${12 + t * 8}deg) translateZ(${-40 - t * 40}px)`
                    cardOpacity = Math.max(0, 0.6 - t * 0.6)
                  }
                } else if (isRightFlank) {
                  if (dragOffset < 0) {
                    const t = Math.min(1, -dragOffset / 140)
                    cardTransform = `translateX(calc(48% - ${t * 48}%)) scale(${0.82 + t * 0.18}) rotateY(${-12 + t * 12}deg) translateZ(${-40 + t * 40}px)`
                    cardOpacity = 0.6 + t * 0.4
                    if (t > 0.5) zIndex = 25
                  } else {
                    const t = Math.min(1, dragOffset / 140)
                    cardTransform = `translateX(calc(48% + ${t * 47}%)) scale(${0.82 - t * 0.17}) rotateY(${-12 - t * 8}deg) translateZ(${-40 - t * 40}px)`
                    cardOpacity = Math.max(0, 0.6 - t * 0.6)
                  }
                } else if (isFarLeft) {
                  if (dragOffset > 0) {
                    const t = Math.min(1, dragOffset / 140)
                    cardTransform = `translateX(calc(-95% + ${t * 47}%)) scale(${0.65 + t * 0.17}) rotateY(${20 - t * 8}deg) translateZ(${-80 + t * 40}px)`
                    cardOpacity = t * 0.6
                    zIndex = 15
                  } else {
                    cardTransform = 'translateX(-95%) scale(0.65) rotateY(20deg) translateZ(-80px)'
                    cardOpacity = 0
                    zIndex = 10
                  }
                } else if (isFarRight) {
                  if (dragOffset < 0) {
                    const t = Math.min(1, -dragOffset / 140)
                    cardTransform = `translateX(calc(95% - ${t * 47}%)) scale(${0.65 + t * 0.17}) rotateY(${-20 + t * 8}deg) translateZ(${-80 + t * 40}px)`
                    cardOpacity = t * 0.6
                    zIndex = 15
                  } else {
                    cardTransform = 'translateX(95%) scale(0.65) rotateY(-20deg) translateZ(-80px)'
                    cardOpacity = 0
                    zIndex = 10
                  }
                }
              } else {
                if (isCenter) {
                  cardTransform = 'translateX(0) scale(1) translateZ(0)'
                  cardOpacity = 1
                  zIndex = 30
                } else if (isLeftFlank) {
                  cardTransform = 'translateX(-48%) scale(0.82) rotateY(12deg) translateZ(-40px)'
                  cardOpacity = 0.6
                  zIndex = 20
                } else if (isRightFlank) {
                  cardTransform = 'translateX(48%) scale(0.82) rotateY(-12deg) translateZ(-40px)'
                  cardOpacity = 0.6
                  zIndex = 20
                } else if (isFarLeft) {
                  cardTransform = 'translateX(-95%) scale(0.65) rotateY(20deg) translateZ(-80px)'
                  cardOpacity = 0
                  zIndex = 10
                } else if (isFarRight) {
                  cardTransform = 'translateX(95%) scale(0.65) rotateY(-20deg) translateZ(-80px)'
                  cardOpacity = 0
                  zIndex = 10
                }
              }

              return (
                <article
                  key={`coverflow-${project.id}`}
                  className={`work-coverflow-card ${
                    isCenter ? 'is-center' : isLeftFlank || isRightFlank ? 'is-flank' : 'is-buffer'
                  } ${isDeckDragging ? 'is-dragging' : ''} ${isEven ? 'card-type-a' : 'card-type-b'}`}
                  style={{
                    transform: cardTransform,
                    opacity: cardOpacity,
                    zIndex,
                    pointerEvents: (isCenter || isLeftFlank || isRightFlank) && !isDeckDragging ? 'auto' : 'none',
                    touchAction: 'pan-y',
                  }}
                  onClick={(e) => handleCardClick(offset, project, e)}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label={`${project.title}${isCenter ? ' (Active)' : isLeftFlank ? ' (Previous)' : ' (Next)'}`}
                >
                  <div className={`work-card-media-window has-transform-box ${project.thumbnailClass ? 'is-aspect-video' : ''}`}>
                    {project.thumbnail ? (
                      checkIsVideo(project.thumbnail) ? (
                        <video
                          src={cleanAssetUrl(project.thumbnail)}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="auto"
                          className={`work-card-thumbnail ${project.thumbnailClass || ''}`}
                          onLoadedMetadata={(e) => {
                            e.currentTarget.play().catch(() => {})
                          }}
                        />
                      ) : (
                        <img
                          src={cleanAssetUrl(project.thumbnail)}
                          alt={project.title}
                          className={`work-card-thumbnail ${project.thumbnailClass || ''}`}
                          loading="eager"
                          decoding="async"
                          draggable={false}
                        />
                      )
                    ) : (
                      <div className="work-card-empty-media" aria-hidden="true" />
                    )}

                    <TransformBoundingBox />
                  </div>

                  {/* Bottom Header Bar (Lower ~25%) */}
                  <div className="work-card-bottom-bar flex items-center justify-between w-full pt-2.5 pb-1 px-1 gap-2.5 min-h-[44px]">
                    {/* Full Name Container - Wraps into 2 lines if needed */}
                    <h3
                      className="work-card-name font-['Archivo'] font-black uppercase text-sm sm:text-base leading-[1.1] leading-tight break-words whitespace-normal flex-1 min-w-0"
                      style={{
                        fontSize: 'clamp(12px, 3.2vw, 14px)',
                        lineHeight: 1.1,
                        color: isEven ? '#d8ff00' : '#004af2',
                      }}
                      title={project.title || project.name}
                    >
                      {project.title || project.name}
                    </h3>

                    {/* Fixed Arrow Button - Stays vertically centered and pinned */}
                    <div className="shrink-0 self-center">
                      <button
                        type="button"
                        className={`work-card-arrow-btn w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border-none cursor-pointer p-0 transition-transform hover:scale-110 shadow-sm ${
                          isEven ? 'bg-white text-black' : 'bg-black text-white'
                        }`}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          if (e.cancelable) e.preventDefault()
                          e.stopPropagation()
                          if (hasDraggedCardRef.current) return
                          if (isCenter) {
                            console.log("Opening project:", project.id, "(from mobile center card arrow)")
                            setPreviewProject(project)
                          } else {
                            handleCardClick(offset, project, e)
                          }
                        }}
                        aria-label={`Open preview for ${project.title || project.name}`}
                      >
                        <span className="text-xs sm:text-sm font-bold leading-none select-none" aria-hidden="true">→</span>
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {/* Minimal Bottom Bar: Prev Button + Counter & Dots + Swipe Hint + Next Button */}
          <div
            className="work-mobile-deck-bar"
            style={{ pointerEvents: isInteractive ? 'auto' : 'none' }}
          >
            <button
              type="button"
              className="work-deck-btn"
              onClick={handlePrevCard}
              aria-label="Previous Project"
            >
              ‹
            </button>

            <div className="work-deck-pagination-group">
              <span
                className="work-mobile-counter font-mono"
                aria-label={`Project ${activeDeckIndex + 1} of ${PROJECTS_DATA.length}`}
              >
                <span className="work-counter-current">
                  {(activeDeckIndex + 1).toString().padStart(2, '0')}
                </span>
                <span className="work-counter-sep"> / </span>
                <span className="work-counter-total">
                  {PROJECTS_DATA.length.toString().padStart(2, '0')}
                </span>
              </span>

              {/* Dynamic 5-Dot Window Track for immediate visual stack progress */}
              <div className="work-deck-dots-track" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((dotIdx) => {
                  const activeStep = Math.min(
                    4,
                    Math.floor((activeDeckIndex / Math.max(1, PROJECTS_DATA.length - 1)) * 4)
                  )
                  return (
                    <span
                      key={dotIdx}
                      className={`work-deck-dot ${dotIdx === activeStep ? 'is-active' : ''}`}
                    />
                  )
                })}
              </div>
            </div>

            <span className="work-deck-hint">SWIPE</span>

            <button
              type="button"
              className="work-deck-btn"
              onClick={handleNextCard}
              aria-label="Next Project"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* Same-Page Cinematic Project Preview Overlay (Strictly guarded to activeSection === 'work') */}
      {isWorkActive && previewProject && (
        <ProjectPreview
          key={previewProject.id}
          project={previewProject}
          projects={PROJECTS_DATA}
          onClose={handleClosePreview}
          onSelectProject={handleSelectProject}
        />
      )}
    </>
  )
}

