import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import TransformBoundingBox from './TransformBoundingBox'
import SafeProjectGallery, { getAssetUrl, checkIsVideo, cleanAssetUrl, DIMENSION_CACHE } from './BehanceStyleGallery'
import BehanceShowcaseModal from './BehanceShowcaseModal'
import { scanProjectSubfolders } from '../data/portfolioData'
import pptData from '../data/pptData.json'

export { SafeProjectGallery, getAssetUrl, checkIsVideo, cleanAssetUrl } from './BehanceStyleGallery'
export { scanProjectSubfolders, formatSectionLabel, parseProjectSections } from '../data/portfolioData'
export { BehanceShowcaseModal } from './BehanceShowcaseModal'
export { PreviewVideo } from './ProjectModal'

/**
 * Adaptive Modal Grid Item:
 * Strictly obeys Behance dynamic ratio grid rules:
 * - Horizontal (ratio >= 1.25) -> col-span-6 (1 per row, 16:9)
 * - Square (0.85 <= ratio < 1.25) -> col-span-3 (2 per row, 1:1)
 * - Vertical (ratio < 0.85) -> col-span-2 (3 per row, 4:5)
 * - Presentation Decks (type === 'ppt') -> col-span-6 (1 per row, 16:9 widescreen)
 * - Videos -> native <video autoPlay loop muted playsInline preload="auto" controls={false} />
 */
export function AdaptiveModalGridItem({
  item,
  index,
  onOpenItem,
  onOpenFullscreenPresentation,
}) {
  const isVideo = item.type === 'video' || checkIsVideo(item.src || item.url)
  const isPpt = item.type === 'ppt'
  const isPdf = item.type === 'pdf'
  const url = item.thumbnail || item.src || item.url

  // Initial class computation
  const [colSpanClass, setColSpanClass] = useState(() => {
    if (isPpt || isPdf) return 'behance-col-horizontal col-span-1 sm:col-span-2 md:col-span-6'
    if (item.aspectRatio === '16/9') return 'behance-col-horizontal col-span-1 sm:col-span-2 md:col-span-6'
    const cached = DIMENSION_CACHE.get(url)
    if (cached) {
      if (cached.ratio >= 1.25) return 'behance-col-horizontal col-span-1 sm:col-span-2 md:col-span-6'
      if (cached.ratio >= 0.85) return 'behance-col-square col-span-1 sm:col-span-1 md:col-span-3'
      return 'behance-col-vertical col-span-1 sm:col-span-1 md:col-span-2'
    }
    if (/amfi.*kv/i.test(url)) return 'behance-col-vertical col-span-1 sm:col-span-1 md:col-span-2'
    return 'behance-col-horizontal col-span-1 sm:col-span-2 md:col-span-6'
  })

  const [aspectClass, setAspectClass] = useState(() => {
    if (isPpt) return 'behance-aspect-horizontal aspect-[16/9]'
    if (isPdf) return 'behance-aspect-horizontal'
    if (item.aspectRatio === '16/9') return 'behance-aspect-horizontal aspect-[16/9]'
    const cached = DIMENSION_CACHE.get(url)
    if (cached) {
      if (cached.ratio >= 1.25) return 'behance-aspect-horizontal aspect-[16/9]'
      if (cached.ratio >= 0.85) return 'behance-aspect-square aspect-square'
      return 'behance-aspect-vertical aspect-[4/5]'
    }
    if (/amfi.*kv/i.test(url)) return 'behance-aspect-vertical aspect-[4/5]'
    return 'behance-aspect-horizontal aspect-[16/9]'
  })

  const handleMediaDimensions = useCallback((w, h) => {
    if (!w || !h) return
    const ratio = w / h
    DIMENSION_CACHE.set(url, { w, h, ratio })

    if (isPpt || item.aspectRatio === '16/9' || ratio >= 1.25) {
      setColSpanClass('behance-col-horizontal col-span-1 sm:col-span-2 md:col-span-6')
      setAspectClass('behance-aspect-horizontal aspect-[16/9]')
    } else if (ratio >= 0.85) {
      setColSpanClass('behance-col-square col-span-1 sm:col-span-1 md:col-span-3')
      setAspectClass('behance-aspect-square aspect-square')
    } else {
      setColSpanClass('behance-col-vertical col-span-1 sm:col-span-1 md:col-span-2')
      setAspectClass('behance-aspect-vertical aspect-[4/5]')
    }
  }, [url, isPpt, item.aspectRatio])

  useEffect(() => {
    if (!url || isVideo || isPpt || isPdf) return
    const cached = DIMENSION_CACHE.get(url)
    if (cached) {
      handleMediaDimensions(cached.w, cached.h)
      return
    }
    const img = new Image()
    img.src = cleanAssetUrl(url)
    if (img.complete && img.naturalWidth && img.naturalHeight) {
      handleMediaDimensions(img.naturalWidth, img.naturalHeight)
    } else {
      img.onload = () => {
        handleMediaDimensions(img.naturalWidth, img.naturalHeight)
      }
    }
  }, [url, isVideo, isPpt, isPdf, handleMediaDimensions])

  // Mobile-safe tap tracking
  const touchStartRef = useRef({ x: 0, y: 0, moved: false })
  const lastTouchRef = useRef(0)

  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      moved: false,
    }
  }

  const handleTouchMove = (e) => {
    if (!e.touches || e.touches.length === 0) return
    const dx = Math.abs(e.touches[0].clientX - touchStartRef.current.x)
    const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y)
    if (dx > 10 || dy > 10) {
      touchStartRef.current.moved = true
    }
  }

  const triggerAction = () => {
    if (isPpt) {
      if (onOpenFullscreenPresentation) {
        onOpenFullscreenPresentation(item.slides)
      } else {
        onOpenItem?.(index)
      }
    } else {
      onOpenItem?.(index)
    }
  }

  const handleTouchEnd = (e) => {
    e.stopPropagation()
    if (touchStartRef.current.moved) return
    lastTouchRef.current = Date.now()
    triggerAction()
  }

  const handleClick = (e) => {
    e.stopPropagation()
    if (Date.now() - lastTouchRef.current < 450) return
    triggerAction()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      triggerAction()
    }
  }

  if (isVideo) {
    return (
      <div
        className={`behance-asset-card relative overflow-hidden rounded-xl bg-[#111115] border border-white/10 cursor-pointer group transition-all hover:border-[#d0ff00]/60 select-none ${colSpanClass}`}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="button"
        tabIndex={0}
        aria-label={`Open video ${item.title || 'Video'}`}
        onKeyDown={handleKeyDown}
      >
        <div className={`behance-media-ratio-box w-full ${aspectClass} overflow-hidden flex items-center justify-center bg-black/40 relative`}>
          <video
            src={cleanAssetUrl(url)}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            controls={false}
            className="w-full h-full object-cover pointer-events-none"
            onLoadedMetadata={(e) => {
              handleMediaDimensions(e.currentTarget.videoWidth, e.currentTarget.videoHeight)
              e.currentTarget.play().catch(() => {})
            }}
          />
          <div className="preview-media-hover-overlay">
            <span className="preview-expand-badge">
              <span>▶</span> WATCH VIDEO
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (isPdf) {
    return (
      <div
        className="preview-pdf-slot col-span-1 sm:col-span-2 md:col-span-6 w-full"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="button"
        tabIndex={0}
        aria-label={`Open PDF ${item.title || 'Document'}`}
        onKeyDown={handleKeyDown}
        style={{ cursor: 'pointer', margin: '0' }}
      >
        <div className="preview-pdf-info">
          <span className="preview-pdf-badge">PDF DOCUMENT</span>
          <span className="preview-pdf-title">{item.title || 'Verified Document'}</span>
          <span className="preview-pdf-sub">Click to inspect in fullscreen high-resolution viewer</span>
        </div>
        <button type="button" className="btn-pdf-view" aria-hidden="true" tabIndex={-1}>
          VIEW PDF ⤢
        </button>
      </div>
    )
  }

  if (isPpt) {
    return (
      <div
        className={`behance-asset-card relative overflow-hidden rounded-xl bg-[#111115] border border-white/10 cursor-pointer group transition-all hover:border-[#d0ff00]/60 select-none is-presentation ${colSpanClass}`}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="button"
        tabIndex={0}
        aria-label={`Open presentation deck: ${item.title}`}
        onKeyDown={handleKeyDown}
      >
        <div className={`behance-media-ratio-box w-full ${aspectClass} overflow-hidden flex items-center justify-center bg-black/40 relative`}>
          <img
            src={cleanAssetUrl(url)}
            alt={item.title || 'Presentation Deck'}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="preview-media-hover-overlay">
            <span
              className="preview-expand-badge"
              style={{ backgroundColor: '#d0ff00', color: '#000000', fontWeight: 'bold' }}
            >
              <span>▶</span> {item.badge || `VIEW PRESENTATION DECK (${item.slideCount || item.slides?.length || 0} SLIDES)`}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`behance-asset-card relative overflow-hidden rounded-xl bg-[#111115] border border-white/10 cursor-pointer group transition-all hover:border-[#d0ff00]/60 select-none ${colSpanClass}`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="button"
      tabIndex={0}
      aria-label={`Open ${item.title || 'Asset'}`}
      onKeyDown={handleKeyDown}
    >
      <div className={`behance-media-ratio-box w-full ${aspectClass} overflow-hidden flex items-center justify-center bg-black/40 relative`}>
        <img
          src={cleanAssetUrl(url)}
          alt={item.title || 'Asset'}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          onLoad={(e) => {
            handleMediaDimensions(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)
          }}
        />
        <div className="preview-media-hover-overlay">
          <span className="preview-expand-badge">
            <span>⤢</span> {(() => {
              const raw = item.badge || (item.label ? `VIEW ${item.label.toUpperCase()}` : 'VIEW IMAGE ⤢')
              const cleaned = raw.replace(/concept[\s_-]*board/gi, '').trim()
              return cleaned || 'VIEW IMAGE ⤢'
            })()}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Interactive Presentation Slide Viewer Component
 * Rendered directly under presentation section badges (e.g. "PITCH DECK", "CAMPAIGN DECK").
 * Allows interactive horizontal slide navigation (Prev/Next buttons, live counter, progress track)
 * as well as 1-click fullscreen slide deck launch.
 */
export function InteractiveSlideDeckViewer({
  section,
  onOpenFullscreen,
}) {
  const slides = section.slides || []
  const slideCount = slides.length
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  // Current slide URL
  const currentSlideUrl = typeof slides[currentSlideIndex] === 'string'
    ? slides[currentSlideIndex]
    : (slides[currentSlideIndex]?.baseJpeg || slides[currentSlideIndex]?.src || section.thumbnail)

  const handlePrev = (e) => {
    e?.stopPropagation()
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : slideCount - 1))
  }

  const handleNext = (e) => {
    e?.stopPropagation()
    setCurrentSlideIndex((prev) => (prev < slideCount - 1 ? prev + 1 : 0))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      handlePrev(e)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      handleNext(e)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpenFullscreen?.(slides)
    }
  }

  // Touch tracking for mobile swipe
  const touchStartRef = useRef({ x: 0, y: 0 })
  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }
  }
  const handleTouchEnd = (e) => {
    if (!e.changedTouches || e.changedTouches.length === 0) return
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) handlePrev(e)
      else handleNext(e)
    }
  }

  return (
    <div
      className="interactive-slide-deck-viewer"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label={`${section.title} Presentation Deck`}
    >
      {/* 16:9 Slide Display Container */}
      <div
        className="slide-deck-main-card"
        onClick={() => onOpenFullscreen?.(slides)}
      >
        <img
          src={cleanAssetUrl(currentSlideUrl)}
          alt={`${section.title} Slide ${currentSlideIndex + 1}`}
          className="slide-deck-img"
          loading="lazy"
          decoding="async"
        />

        {/* Previous Button */}
        {slideCount > 1 && (
          <button
            type="button"
            className="slide-nav-btn slide-nav-prev"
            onClick={handlePrev}
            aria-label="Previous Slide"
          >
            ‹
          </button>
        )}

        {/* Next Button */}
        {slideCount > 1 && (
          <button
            type="button"
            className="slide-nav-btn slide-nav-next"
            onClick={handleNext}
            aria-label="Next Slide"
          >
            ›
          </button>
        )}

        {/* Bottom Bar: Slide Counter & Fullscreen Action */}
        <div className="slide-deck-overlay-bar">
          <div className="slide-deck-counter">
            <span className="slide-counter-dot" />
            <span>
              SLIDE {String(currentSlideIndex + 1).padStart(2, '0')} / {String(slideCount).padStart(2, '0')}
            </span>
          </div>

          <button
            type="button"
            className="slide-deck-fullscreen-btn"
            onClick={(e) => {
              e.stopPropagation()
              onOpenFullscreen?.(slides)
            }}
          >
            <span>Fullscreen Deck</span>
            <span className="btn-icon">↗</span>
          </button>
        </div>
      </div>

      {/* Slide Navigation Progress Bar / Strip */}
      {slideCount > 1 && (
        <div className="slide-deck-track-container">
          <div
            className="slide-deck-track-fill"
            style={{ width: `${((currentSlideIndex + 1) / slideCount) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Universal Project Preview Content Component:
 * 1. General Images / Videos / Concept Boards rendered FIRST in adaptive Behance grid
 * 2. Presentation Deck rendered with strict aspect-ratio and explicit CTA Button
 */
export function UniversalProjectPreviewContent({
  project,
  onOpenFullscreen,
  onOpenPresentationViewer,
  onOpenModalItem,
}) {
  const slides = Array.isArray(project?.presentationSlides) ? project.presentationSlides : []
  const assets =
    Array.isArray(project?.assets) && project.assets.length > 0
      ? project.assets
      : Array.isArray(project?.generalAssets)
      ? project.generalAssets
      : []

  const presentationThumbnail =
    project?.thumbnail ||
    (typeof slides[0] === 'string' ? slides[0] : slides[0]?.baseJpeg) ||
    project?.pptThumbnail

  const openFullscreenPresentation = (slideDeck) => {
    onOpenPresentationViewer?.(slideDeck || project?.presentationSlides || slides)
  }

  const hasPresentation = Boolean(
    project?.isUniversalPresentation ||
    project?.hasSlides ||
    (slides && slides.length > 0)
  )

  // If project has numbered sections pipeline (e.g. 01 Print ad, 02 Film, 04 Pitch deck)
  if (Array.isArray(project?.sections) && project.sections.length > 0) {
    return (
      <div
        className="modal-content-wrapper w-full max-w-5xl mx-auto p-4 md:p-8 overflow-y-auto"
        style={{
          maxHeight: '85vh',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          pointerEvents: 'auto',
        }}
      >
        <div className="project-sections-container w-full flex flex-col gap-8 py-2">
          {project.sections.map((section, sIdx) => (
            <div key={section.id || `universal-sec-${sIdx}`} className="project-section-block w-full">
              {section.title && section.title.trim() && !/concept[\s_-]*board/i.test(section.title) && (
                <div className="project-section-header">
                  <div className="project-section-badge">
                    <span className="section-badge-dot" />
                    <span className="section-badge-text">{section.title}</span>
                    {section.isPresentation && (
                      <span className="section-badge-count">{section.slideCount} SLIDES</span>
                    )}
                  </div>
                  <div className="project-section-line" />
                </div>
              )}

              {section.isPresentation ? (
                <InteractiveSlideDeckViewer
                  section={section}
                  onOpenFullscreen={() => openFullscreenPresentation(section.slides)}
                />
              ) : (
                <div className="behance-gallery-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-start w-full">
                  {(section.items || []).map((item, itemIdx) => (
                    <AdaptiveModalGridItem
                      key={item.id || `universal-sec-item-${sIdx}-${itemIdx}`}
                      item={item}
                      index={item.globalIndex !== undefined ? item.globalIndex : itemIdx}
                      onOpenItem={(idx) => {
                        const targetIdx = item.globalIndex !== undefined ? item.globalIndex : idx
                        if (onOpenModalItem) {
                          onOpenModalItem(targetIdx)
                        } else {
                          onOpenFullscreen?.(targetIdx)
                        }
                      }}
                      onOpenFullscreenPresentation={openFullscreenPresentation}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // If project has structured modal items (e.g. Hero XOOM, Hero Xtreme, AMFI, etc.), render strictly in adaptive grid
  if (Array.isArray(project?.modalItems) && project.modalItems.length > 0) {
    return (
      <div
        className="modal-content-wrapper w-full max-w-5xl mx-auto p-4 md:p-8 overflow-y-auto"
        style={{
          maxHeight: '85vh',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          pointerEvents: 'auto',
        }}
      >
        <div className="behance-gallery-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-start w-full">
          {project.modalItems.map((item, itemIdx) => (
            <AdaptiveModalGridItem
              key={item.id || `universal-item-${itemIdx}`}
              item={item}
              index={itemIdx}
              onOpenItem={(idx) => {
                if (onOpenModalItem) {
                  onOpenModalItem(idx)
                } else {
                  onOpenFullscreen?.(idx)
                }
              }}
              onOpenFullscreenPresentation={openFullscreenPresentation}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className="modal-content-wrapper w-full max-w-4xl mx-auto p-4 md:p-8 overflow-y-auto"
      style={{
        maxHeight: '85vh',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        pointerEvents: 'auto',
      }}
    >
      {/* Standard Assets / Concept Boards */}
      {assets && assets.length > 0 && (
        <div className="general-assets-section w-full">
          <SafeProjectGallery
            project={project}
            assets={assets}
            onOpenFullscreen={onOpenFullscreen}
          />
        </div>
      )}

      {/* Optional PDF Specimen Preview Card */}
      {(project?.hasPdf || (project?.pdfFiles && project.pdfFiles.length > 0)) && (
        <div
          className="preview-pdf-slot"
          onClick={() => {
            const pdfUrl = project.pdfUrl || project.pdfFiles?.[0]
            if (pdfUrl) {
              onOpenFullscreen?.(pdfUrl)
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Open fullscreen PDF view of ${project.title}`}
          style={{ width: '100%', marginTop: '1.5rem', cursor: 'pointer' }}
        >
          <div className="preview-pdf-info">
            <span className="preview-pdf-badge">PDF DOCUMENT</span>
            <span className="preview-pdf-title">{project.cleanTitle || project.title} — Verified Document</span>
            <span className="preview-pdf-sub">
              Click to inspect in fullscreen high-resolution viewer
            </span>
          </div>
          <button type="button" className="btn-pdf-view" aria-hidden="true" tabIndex={-1}>
            VIEW PDF ⤢
          </button>
        </div>
      )}

      {/* Multiple Presentation Decks inside one project */}
      {Array.isArray(project?.presentationDecks) && project.presentationDecks.length > 1 ? (
        <div className="w-full mt-6 flex flex-col gap-5 items-center">
          {project.presentationDecks.map((deck, dIdx) => (
            <div
              key={deck.id || `universal-deck-${dIdx}`}
              className="w-full aspect-video rounded-xl overflow-hidden relative bg-black/40 border border-white/10 group shadow-lg cursor-pointer"
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 9',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              }}
              onClick={(e) => {
                e.stopPropagation()
                openFullscreenPresentation(deck.slides)
              }}
              onTouchEnd={(e) => {
                e.stopPropagation()
                openFullscreenPresentation(deck.slides)
              }}
            >
              <img
                src={cleanAssetUrl(deck.thumbnail || deck.slides?.[0])}
                alt={deck.title}
                className="w-full h-full object-cover"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
                loading="lazy"
                decoding="async"
              />
              <div
                className="preview-media-hover-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  padding: '16px',
                }}
              >
                <span
                  className="preview-expand-badge"
                  style={{ backgroundColor: '#d0ff00', color: '#000000', fontWeight: 'bold' }}
                >
                  <span>▶</span> VIEW PRESENTATION DECK • {deck.cleanTitle ? deck.cleanTitle.toUpperCase() : `DECK ${dIdx + 1}`} ({deck.slideCount} SLIDES)
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (project?.isUniversalPresentation || hasPresentation) && (
        <div
          className="w-full mt-6 flex flex-col items-center"
          style={{
            width: '100%',
            marginTop: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            className="w-full aspect-video rounded-xl overflow-hidden relative bg-black/40 border border-white/10 group shadow-lg cursor-pointer"
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 9',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => {
              e.stopPropagation()
              openFullscreenPresentation(project.presentationSlides)
            }}
            onTouchEnd={(e) => {
              e.stopPropagation()
              openFullscreenPresentation(project.presentationSlides)
            }}
          >
            <img
              src={cleanAssetUrl(
                project?.thumbnail ||
                project?.presentationSlides?.[0]?.baseJpeg ||
                (typeof project?.presentationSlides?.[0] === 'string'
                  ? project?.presentationSlides?.[0]
                  : presentationThumbnail)
              )}
              alt={project?.title || 'Presentation Deck'}
              className="w-full h-full object-cover"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              loading="lazy"
              decoding="async"
            />

            {/* PERFECTLY CENTERED OVERLAY BUTTON */}
            <div
              className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 cursor-pointer"
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                padding: '16px',
                cursor: 'pointer',
                pointerEvents: 'auto',
                zIndex: 10,
              }}
              onClick={(e) => {
                e.stopPropagation()
                openFullscreenPresentation(project.presentationSlides)
              }}
              onTouchEnd={(e) => {
                e.stopPropagation()
                openFullscreenPresentation(project.presentationSlides)
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  openFullscreenPresentation(project.presentationSlides)
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation()
                  openFullscreenPresentation(project.presentationSlides)
                }}
                className="px-6 py-3 rounded-full bg-[#d0ff00] text-black font-bold text-xs uppercase tracking-wider shadow-2xl hover:scale-105 active:scale-95 transition-transform pointer-events-auto cursor-pointer"
                style={{
                  padding: '12px 24px',
                  borderRadius: '9999px',
                  backgroundColor: '#d0ff00',
                  color: '#000000',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  border: 'none',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  touchAction: 'manipulation',
                  zIndex: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Open Fullscreen Presentation ↗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


/**
 * ProjectPreview Modal / Panel Component (Behance-Style Adaptive Grid & Lightbox)
 */
export default function ProjectPreview({
  project,
  projects = [],
  onClose,
  onSelectProject,
}) {
  const currentIndex = projects.findIndex((p) => p.id === project?.id)
  const totalProjects = projects.length

  // Media definitions for this project (declared early for use in all handlers)
  const isPdf = Boolean(project?.pdfUrl)
  const isBehanceCard =
    Boolean(project?.isBehance) ||
    project?.id === 'behance' ||
    (project?.title || '').toLowerCase().includes('behance') ||
    (project?.cleanTitle || '').toLowerCase().includes('behance')

  const isAmazonOnly =
    project?.id === 'amazon-project' ||
    (project?.id || '').includes('amazon') ||
    (project?.folder || '').toLowerCase().includes('amazon') ||
    (project?.title || '').toLowerCase().includes('amazon') ||
    (project?.cleanTitle || '').toLowerCase().includes('amazon')

  const isPresentationProject =
    Boolean(project?.isPresentation) ||
    Boolean(project?.isPresentationDeck) ||
    isAmazonOnly

  // Lightbox state for true Fullscreen Media View
  const [activeLightboxMedia, setActiveLightboxMedia] = useState(null)
  const lightboxOpenTimeRef = useRef(0)
  const pptScrollRef = useRef(null)

  // Scroll tracking state for the slim orange indicator pill
  const scrollContainerRef = useRef(null)
  const [thumbPercent, setThumbPercent] = useState(0)

  const handlePrev = useCallback(
    (e) => {
      e?.stopPropagation()
      if (currentIndex > 0) {
        onSelectProject(projects[currentIndex - 1])
      } else {
        onSelectProject(projects[totalProjects - 1])
      }
    },
    [currentIndex, projects, totalProjects, onSelectProject]
  )

  const handleNext = useCallback(
    (e) => {
      e?.stopPropagation()
      if (currentIndex < totalProjects - 1) {
        onSelectProject(projects[currentIndex + 1])
      } else {
        onSelectProject(projects[0])
      }
    },
    [currentIndex, projects, totalProjects, onSelectProject]
  )

  // Safe memoized extraction of active assets array
  const activeAssets = useMemo(() => {
    let list = []
    if (Array.isArray(project?.assets) && project.assets.length > 0) {
      list = project.assets
    } else if (project?.heroMedia) {
      list = [project.heroMedia]
    } else if (project?.thumbnail) {
      list = [project.thumbnail]
    }

    if (
      project?.id?.includes('eaaa') ||
      project?.folder?.toLowerCase().includes('eaaa') ||
      project?.title?.toLowerCase().includes('eaaa')
    ) {
      const conceptBoard = list.filter((file) => {
        const url = getAssetUrl(file)
        return url.toLowerCase().includes('concept') || url.toLowerCase().includes('board')
      })
      const remainingAssets = list.filter((file) => {
        const url = getAssetUrl(file)
        return !url.toLowerCase().includes('concept') && !url.toLowerCase().includes('board')
      })
      return [...conceptBoard, ...remainingAssets]
    }

    if (
      project?.id?.includes('amazon') ||
      project?.folder?.toLowerCase().includes('amazon') ||
      project?.title?.toLowerCase().includes('amazon')
    ) {
      if (Array.isArray(project?.previewAssets) && project.previewAssets.length > 0) {
        return project.previewAssets
      }
      const conceptBoard = list.filter((file) => {
        const url = getAssetUrl(file)
        return url.toLowerCase().includes('concept') || url.toLowerCase().includes('board')
      })
      const remainingAssets = list.filter((file) => {
        const url = getAssetUrl(file)
        return !url.toLowerCase().includes('concept') && !url.toLowerCase().includes('board')
      }).sort((a, b) => {
        const strA = getAssetUrl(a)
        const strB = getAssetUrl(b)
        return strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' })
      })
      const firstSlide = remainingAssets[0] || conceptBoard[0]
      return [conceptBoard[0] || list[0], firstSlide].filter(Boolean)
    }

    return list
  }, [project?.id, project?.folder, project?.title, project?.assets, project?.previewAssets, project?.heroMedia, project?.thumbnail])

  // Track current image index in fullscreen modal
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Fullscreen Scrollable PPT Presentation Viewer State
  const [isPPTViewerOpen, setIsPPTViewerOpen] = useState(false)

  // All presentation slides for the vertical sequence viewer
  const presentationSlides = useMemo(() => {
    if (Array.isArray(project?.presentationSlides) && project.presentationSlides.length > 0) {
      return project.presentationSlides
    }
    if (Array.isArray(project?.fullPresentationSlides) && project.fullPresentationSlides.length > 0) {
      return project.fullPresentationSlides
    }
    if (Array.isArray(project?.allAssets) && project.allAssets.length > 2) {
      return project.allAssets.filter((f) => !getAssetUrl(f).toLowerCase().includes('concept'))
    }
    if (isAmazonOnly) {
      return Array.from({ length: 68 }, (_, i) => {
        const num = String(i + 1).padStart(2, '0')
        return `/projects/07%20Amazon%20Prime%20-%20Gold%20Digger/Slide%20${num}.webp`
      })
    }
    return []
  }, [project?.presentationSlides, project?.fullPresentationSlides, project?.allAssets, isAmazonOnly])

  // Reset image index and PPT viewer state when switching projects
  useEffect(() => {
    setCurrentImageIndex(0)
    setIsPPTViewerOpen(false)
  }, [project?.id])

  const hasConceptBoard = useMemo(() => {
    return Boolean(
      activeAssets.some((a) => {
        const url = getAssetUrl(a).toLowerCase()
        return url.includes('concept') || url.includes('board')
      })
    )
  }, [activeAssets])

  // Helper for universal & general assets navigation list
  const modalItems = useMemo(() => {
    if (Array.isArray(project?.modalItems) && project.modalItems.length > 0) {
      return project.modalItems
    }
    return null
  }, [project?.modalItems])

  const currentAssetList = useMemo(() => {
    if (modalItems && modalItems.length > 0) {
      return modalItems.map((item) => item.src || item.thumbnail)
    }
    if (project?.isUniversal && project?.hasGeneralAssets && Array.isArray(project.generalAssets)) {
      return project.generalAssets
    }
    return activeAssets
  }, [modalItems, project, activeAssets])

  // Dedicated Open Modal Item Trigger for strict ordered project items
  const openModalItem = useCallback(
    (index) => {
      const items = modalItems || project?.modalItems
      if (!items || !items[index]) return
      const item = items[index]
      setCurrentImageIndex(index)

      if (item.type === 'ppt') {
        const deckSlides = item.slides || project?.presentationSlides || []
        const deckTitle = item.title || `${project?.cleanTitle || project?.title || 'Presentation'} — Presentation Deck`

        setActiveLightboxMedia({
          type: 'ppt',
          src: item.thumbnail || deckSlides[0],
          title: deckTitle,
          cleanTitle: item.cleanTitle || project?.cleanTitle || project?.title,
          caption: item.caption || `${deckSlides.length} Widescreen Slides`,
          slides: deckSlides,
          slideMeta: item.slideMeta || deckSlides,
          deckIndex: index,
          itemIndex: index,
        })

        setTimeout(() => {
          const scroller = pptScrollRef.current || document.getElementById('ppt-fullscreen-scroller')
          if (scroller) scroller.scrollTop = 0
        }, 10)
      } else if (item.type === 'pdf') {
        setActiveLightboxMedia({
          type: 'pdf',
          src: item.src || item.pdfUrl || project?.pdfUrl,
          title: item.title || `${project?.cleanTitle || project?.title} — Verified Document`,
          caption: item.caption || 'Full high-resolution PDF document viewer.',
          itemIndex: index,
        })
      } else {
        const isVideoAsset = item.type === 'video' || checkIsVideo(item.src)
        setActiveLightboxMedia({
          type: isVideoAsset ? 'video' : 'image',
          src: item.src,
          title: item.title || `${project?.cleanTitle || project?.title || 'Project'} — Asset ${String(index + 1).padStart(2, '0')}`,
          caption: item.caption || project?.description || project?.summary,
          itemIndex: index,
        })
      }
      lightboxOpenTimeRef.current = Date.now()
    },
    [modalItems, project]
  )

  // Dedicated Presentation Mode Trigger for presentation decks
  const openPresentationViewer = useCallback(
    (deckIdxOrSlides = 0) => {
      let deckSlides = presentationSlides
      let deckIdx = 0

      if (Array.isArray(deckIdxOrSlides) && deckIdxOrSlides.length > 0) {
        deckSlides = deckIdxOrSlides
      } else if (typeof deckIdxOrSlides === 'number') {
        deckIdx = deckIdxOrSlides
      } else if (
        deckIdxOrSlides &&
        typeof deckIdxOrSlides === 'object' &&
        Array.isArray(deckIdxOrSlides.slides)
      ) {
        deckSlides = deckIdxOrSlides.slides
      }

      if (!deckSlides || deckSlides.length === 0) {
        if (Array.isArray(project?.presentationSlides) && project.presentationSlides.length > 0) {
          deckSlides = project.presentationSlides
        } else if (Array.isArray(project?.fullPresentationSlides) && project.fullPresentationSlides.length > 0) {
          deckSlides = project.fullPresentationSlides
        }
      }

      const deckTitle = `${project?.cleanTitle || project?.title || 'Presentation'} — Presentation Deck`

      setActiveLightboxMedia({
        type: 'ppt',
        src:
          typeof deckSlides[0] === 'string'
            ? deckSlides[0]
            : (deckSlides[0]?.baseJpeg || project?.thumbnail),
        title: deckTitle,
        cleanTitle: project?.cleanTitle || project?.title,
        caption: `${deckSlides.length} Widescreen Slides`,
        slides: deckSlides,
        slideMeta: project?.slideMeta || deckSlides,
        deckIndex: typeof deckIdx === 'number' ? deckIdx : 0,
      })

      setTimeout(() => {
        const scroller = pptScrollRef.current || document.getElementById('ppt-fullscreen-scroller')
        if (scroller) scroller.scrollTop = 0
      }, 10)
      lightboxOpenTimeRef.current = Date.now()
    },
    [presentationSlides, project]
  )

  // Dedicated Lightbox Trigger for general images and videos
  const openGeneralAsset = useCallback(
    (index) => {
      if (modalItems && modalItems.length > 0) {
        openModalItem(index)
        return
      }
      const assetList = currentAssetList
      if (!assetList || assetList.length === 0) return
      setCurrentImageIndex(index)
      const asset = assetList[index]
      const assetUrl = getAssetUrl(asset)
      const isVideoAsset = checkIsVideo(assetUrl)

      setActiveLightboxMedia({
        type: isVideoAsset ? 'video' : 'image',
        src: assetUrl,
        title: `${project?.cleanTitle || project?.title || 'Project'} — Asset ${String(index + 1).padStart(2, '0')}`,
        caption: project?.description || project?.summary,
      })
      lightboxOpenTimeRef.current = Date.now()
    },
    [currentAssetList, modalItems, openModalItem, project]
  )

  // Open Fullscreen Lightbox for specific asset index (existing projects)
  const openFullscreen = useCallback(
    (index) => {
      if (modalItems && modalItems.length > 0) {
        openModalItem(index)
        return
      }
      setCurrentImageIndex(index)

      const hasDecks = Array.isArray(project?.presentationDecks) && project.presentationDecks.length > 0
      const currentDeck = hasDecks ? (project.presentationDecks[index] || project.presentationDecks[0]) : null

      const isPptClick =
        isPresentationProject &&
        (hasDecks || !hasConceptBoard || index === 1 || activeAssets.length === 1)

      if (isPptClick) {
        const deckSlides = currentDeck?.slides || presentationSlides
        const deckTitle = currentDeck?.title || `${project?.cleanTitle || project?.title || 'Presentation'} — Presentation Deck`

        setActiveLightboxMedia({
          type: 'ppt',
          src: currentDeck?.thumbnail || activeAssets[index] || deckSlides[0],
          title: deckTitle,
          cleanTitle: currentDeck?.cleanTitle || project?.cleanTitle || project?.title,
          caption: `${deckSlides.length} Widescreen Slides`,
          slides: deckSlides,
          slideMeta: currentDeck?.slideMeta || project?.slideMeta,
          deckIndex: index,
        })

        setTimeout(() => {
          const scroller = pptScrollRef.current || document.getElementById('ppt-fullscreen-scroller')
          if (scroller) scroller.scrollTop = 0
        }, 10)
      } else {
        const asset = activeAssets[index]
        const assetUrl = getAssetUrl(asset)
        const isVideoAsset = checkIsVideo(assetUrl)

        setActiveLightboxMedia({
          type: isVideoAsset ? 'video' : 'image',
          src: assetUrl,
          title: `${project?.title || 'Project'} — Asset ${String(index + 1).padStart(2, '0')}`,
          caption: project?.description || project?.summary,
        })
      }
      lightboxOpenTimeRef.current = Date.now()
    },
    [modalItems, openModalItem, activeAssets, project, isPresentationProject, hasConceptBoard, presentationSlides]
  )

  const handlePrevItem = useCallback(
    (e) => {
      e?.stopPropagation()
      if (modalItems && modalItems.length > 1) {
        const nextIdx = currentImageIndex > 0 ? currentImageIndex - 1 : modalItems.length - 1
        openModalItem(nextIdx)
        return
      }
      if (currentAssetList.length <= 1) return
      const nextIdx = currentImageIndex > 0 ? currentImageIndex - 1 : currentAssetList.length - 1
      if (project?.isUniversal && project?.hasGeneralAssets) {
        openGeneralAsset(nextIdx)
      } else {
        openFullscreen(nextIdx)
      }
    },
    [modalItems, currentAssetList.length, currentImageIndex, openModalItem, openFullscreen, openGeneralAsset, project]
  )

  const handleNextItem = useCallback(
    (e) => {
      e?.stopPropagation()
      if (modalItems && modalItems.length > 1) {
        const nextIdx = currentImageIndex < modalItems.length - 1 ? currentImageIndex + 1 : 0
        openModalItem(nextIdx)
        return
      }
      if (currentAssetList.length <= 1) return
      const nextIdx = currentImageIndex < currentAssetList.length - 1 ? currentImageIndex + 1 : 0
      if (project?.isUniversal && project?.hasGeneralAssets) {
        openGeneralAsset(nextIdx)
      } else {
        openFullscreen(nextIdx)
      }
    },
    [modalItems, currentAssetList.length, currentImageIndex, openModalItem, openFullscreen, openGeneralAsset, project]
  )

  const handlePrevImage = handlePrevItem
  const handleNextImage = handleNextItem

  // Dedicated Presentation Mode Trigger for Amazon PPT Slides
  const openFullscreenPPT = useCallback(() => {
    setIsPPTViewerOpen(true)
  }, [])

  const handleCloseLightbox = (e) => {
    e?.stopPropagation()
    // Guard against accidental closure if tap or synthetic click fires right upon opening
    if (Date.now() - lightboxOpenTimeRef.current < 350) return
    setActiveLightboxMedia(null)
  }

  // Active state refs to avoid stale closures in event listeners
  const activeLightboxMediaRef = useRef(activeLightboxMedia)
  activeLightboxMediaRef.current = activeLightboxMedia

  const isPPTViewerOpenRef = useRef(isPPTViewerOpen)
  isPPTViewerOpenRef.current = isPPTViewerOpen

  // Strict Body Scroll Lock: freeze page scroll triggers & section transitions
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    document.body.dataset.modalOpen = 'true'

    // Prevent background wheel and touch scrolling while allowing internal panel scroll & PPT scroll
    const handleWheelLock = (e) => {
      if (
        document.getElementById('ppt-fullscreen-scroller') ||
        e.target?.closest?.('#ppt-fullscreen-scroller') ||
        e.target.closest('.ppt-scroll-container') ||
        e.target.closest('.project-modal-scroll') ||
        e.target.closest('.ppt-scroll-viewport') ||
        e.target.closest('.media-fullscreen-lightbox') ||
        e.target.closest('.project-preview-panel') ||
        e.target.closest('.preview-panel-scroll') ||
        e.target.closest('.modal-content-wrapper') ||
        e.target.closest('.lightbox-scrollable') ||
        activeLightboxMediaRef.current ||
        isPPTViewerOpenRef.current
      ) {
        return // DO NOT call e.preventDefault()! Let native vertical scroll happen!
      }
      e.preventDefault()
    }

    const handleTouchLock = (e) => {
      if (
        document.getElementById('ppt-fullscreen-scroller') ||
        e.target?.closest?.('#ppt-fullscreen-scroller') ||
        e.target.closest('.ppt-scroll-container') ||
        e.target.closest('.project-modal-scroll') ||
        e.target.closest('.ppt-scroll-viewport') ||
        e.target.closest('.media-fullscreen-lightbox') ||
        e.target.closest('.project-preview-panel') ||
        e.target.closest('.preview-panel-scroll') ||
        e.target.closest('.modal-content-wrapper') ||
        e.target.closest('.lightbox-scrollable') ||
        activeLightboxMediaRef.current ||
        isPPTViewerOpenRef.current
      ) {
        return // DO NOT call e.preventDefault()! Let native vertical scroll happen!
      }
      e.preventDefault()
    }

    window.addEventListener('wheel', handleWheelLock, { passive: false })
    window.addEventListener('touchmove', handleTouchLock, { passive: false })

    return () => {
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
      delete document.body.dataset.modalOpen
      window.removeEventListener('wheel', handleWheelLock)
      window.removeEventListener('touchmove', handleTouchLock)
    }
  }, [])

  // Native capture-phase wheel and touch listener on the PPT fullscreen scroller
  // Stops propagation before any bubble listener on window / document can receive it
  useEffect(() => {
    if (activeLightboxMedia?.type !== 'ppt') return

    const scroller = pptScrollRef.current || document.getElementById('ppt-fullscreen-scroller')
    if (!scroller) return

    const handleCaptureWheel = (e) => {
      e.stopPropagation()
    }

    const handleCaptureTouch = (e) => {
      e.stopPropagation()
    }

    scroller.addEventListener('wheel', handleCaptureWheel, { capture: true, passive: true })
    scroller.addEventListener('touchmove', handleCaptureTouch, { capture: true, passive: true })

    return () => {
      scroller.removeEventListener('wheel', handleCaptureWheel, { capture: true })
      scroller.removeEventListener('touchmove', handleCaptureTouch, { capture: true })
    }
  }, [activeLightboxMedia?.type])

  // Keyboard controls: Escape closes PPT Viewer first, then Lightbox, then Preview Panel.
  // Left / Right arrow keys slide images when in fullscreen, or cycle projects when in preview drawer.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (isPPTViewerOpen) {
          setIsPPTViewerOpen(false)
        } else if (activeLightboxMedia) {
          setActiveLightboxMedia(null)
        } else {
          onClose()
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (activeLightboxMedia && activeLightboxMedia.type !== 'pdf') {
          handlePrevItem(e)
        } else if (!activeLightboxMedia && !isPPTViewerOpen) {
          handlePrev(e)
        }
      } else if (
        e.key === 'ArrowRight' ||
        (activeLightboxMedia && activeLightboxMedia.type !== 'ppt' && e.key === ' ')
      ) {
        e.preventDefault()
        if (activeLightboxMedia && activeLightboxMedia.type !== 'pdf') {
          handleNextItem(e)
        } else if (!activeLightboxMedia && !isPPTViewerOpen) {
          handleNext(e)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPPTViewerOpen, activeLightboxMedia, handlePrev, handleNext, handlePrevItem, handleNextItem, handlePrevImage, handleNextImage, onClose])

  // Custom scroll tracking for slim scrollbar thumb (matching Ref 3)
  const handleScroll = (e) => {
    const el = e.currentTarget
    const maxScroll = el.scrollHeight - el.clientHeight
    if (maxScroll > 0) {
      setThumbPercent(Math.min(Math.max(el.scrollTop / maxScroll, 0), 1))
    } else {
      setThumbPercent(0)
    }
  }

  // Reset scroll position when switching project
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
      setThumbPercent(0)
    }
  }, [project?.id])

  if (!project) return null

  const openPdfLightbox = () => {
    setActiveLightboxMedia({
      type: 'pdf',
      src: project.pdfUrl || '/cv/Final_Final_CV_Approved.pdf',
      title: `${project.title} — Verified Dossier`,
      caption: 'Full high-resolution PDF document viewer.',
    })
    lightboxOpenTimeRef.current = Date.now()
  }

  return (
    <>
      {/* Semi-translucent backdrop: 3x3 grid remains visible behind it */}
      <div
        className="project-preview-backdrop"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`${project.title} Preview Panel`}
      >
        {/* Right-Side Cinematic Preview Panel (Matching Reference 3) */}
        <div
          className="project-preview-panel"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sharp Circular Lime Close Button with Electric Blue "✕" (Pinned top-right) */}
          <button
            type="button"
            className="preview-circle-close-btn has-transform-box"
            onClick={onClose}
            aria-label="Close project preview"
          >
            <span className="preview-close-icon">✕</span>
            <TransformBoundingBox />
          </button>

          {/* Panel Top Header: Orange display title */}
          <div className="preview-panel-header">
            <h2 className="preview-panel-title">{project.title}</h2>
          </div>

          {/* Scrollable Panel Body */}
          <div
            className="preview-panel-scroll"
            ref={scrollContainerRef}
            onScroll={handleScroll}
            style={{
              touchAction: 'pan-y',
              WebkitOverflowScrolling: 'touch',
              pointerEvents: 'auto',
            }}
          >
            {/* If Behance Project: Dedicated High-Fidelity Curated Showcase Hub */}
            {isBehanceCard ? (
              <BehanceShowcaseModal onClose={onClose} />
            ) : Array.isArray(project?.sections) && project.sections.length > 0 ? (
              <div className="project-sections-container w-full flex flex-col gap-8 py-2">
                {project.sections.map((section, sIdx) => (
                  <div key={section.id || `preview-sec-${sIdx}`} className="project-section-block w-full">
                    {/* Highlighted Section Badge (omitted if title is empty or contains concept board) */}
                    {section.title && section.title.trim() && !/concept[\s_-]*board/i.test(section.title) && (
                      <div className="project-section-header">
                        <div className="project-section-badge">
                          <span className="section-badge-dot" />
                          <span className="section-badge-text">{section.title}</span>
                          {section.isPresentation && (
                            <span className="section-badge-count">{section.slideCount} SLIDES</span>
                          )}
                        </div>
                        <div className="project-section-line" />
                      </div>
                    )}

                    {section.isPresentation ? (
                      <InteractiveSlideDeckViewer
                        section={section}
                        onOpenFullscreen={() => openPresentationViewer(section.slides)}
                      />
                    ) : (
                      <div className="behance-gallery-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-start w-full">
                        {(section.items || []).map((item, itemIdx) => (
                          <AdaptiveModalGridItem
                            key={item.id || `item-${sIdx}-${itemIdx}`}
                            item={item}
                            index={item.globalIndex !== undefined ? item.globalIndex : itemIdx}
                            onOpenItem={(idx) => openModalItem(item.globalIndex !== undefined ? item.globalIndex : idx)}
                            onOpenFullscreenPresentation={openPresentationViewer}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : Array.isArray(project?.modalItems) && project.modalItems.length > 0 ? (
              <div className="behance-gallery-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-start w-full py-4">
                {project.modalItems.map((item, itemIdx) => (
                  <AdaptiveModalGridItem
                    key={item.id || `item-${itemIdx}`}
                    item={item}
                    index={itemIdx}
                    onOpenItem={openModalItem}
                    onOpenFullscreenPresentation={openPresentationViewer}
                  />
                ))}
              </div>
            ) : (project?.isUniversal || project?.isUniversalPresentation) ? (
              <UniversalProjectPreviewContent
                project={project}
                onOpenFullscreen={openGeneralAsset}
                onOpenPresentationViewer={openPresentationViewer}
                onOpenModalItem={openModalItem}
              />
            ) : isPresentationProject ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px 0' }}>
                {/* Case 1: Multiple presentation decks inside one project (e.g. Hero XOOM Fix & Games) */}
                {Array.isArray(project?.presentationDecks) && project.presentationDecks.length > 1 ? (
                  project.presentationDecks.map((deck, dIdx) => (
                    <div
                      key={deck.id || `deck-${dIdx}`}
                      className="behance-asset-card"
                      style={{ width: '100%' }}
                      onClick={() => openFullscreen(dIdx)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open Fullscreen Presentation Viewer for ${deck.title}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openFullscreen(dIdx)
                        }
                      }}
                    >
                      <div className="behance-media-ratio-box behance-aspect-horizontal">
                        <img
                          src={cleanAssetUrl(deck.thumbnail || deck.slides?.[0])}
                          alt={`${deck.title} - Presentation Deck`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="preview-media-hover-overlay">
                          <span
                            className="preview-expand-badge"
                            style={{ backgroundColor: '#d0ff00', color: '#000000', fontWeight: 'bold' }}
                          >
                            <span>▶</span> VIEW PRESENTATION DECK {dIdx + 1} • {deck.cleanTitle ? deck.cleanTitle.toUpperCase() : `DECK ${dIdx + 1}`} ({deck.slideCount || deck.slides?.length} SLIDES)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    {/* Case 2: Deck with Concept Board (if present in project, e.g. Amazon Prime) */}
                    {hasConceptBoard && (
                      <div
                        className="behance-asset-card"
                        style={{ width: '100%' }}
                        onClick={() => openFullscreen(0)}
                        role="button"
                        tabIndex={0}
                        aria-label={`View ${project.cleanTitle || project.title} Key Visual in Fullscreen Lightbox`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openFullscreen(0)
                          }
                        }}
                      >
                        <div className="behance-media-ratio-box behance-aspect-horizontal">
                          <img
                            src={cleanAssetUrl(activeAssets[0] || project.thumbnail)}
                            alt={`${project.cleanTitle || project.title} - Key Visual`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="preview-media-hover-overlay">
                            <span className="preview-expand-badge">
                              <span>⤢</span> VIEW IMAGE
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Single Presentation Thumbnail Card (Full-width 16:9 block, opens Fullscreen Presentation Viewer on 1st click) */}
                    <div
                      className="behance-asset-card"
                      style={{ width: '100%' }}
                      onClick={() => openFullscreen(hasConceptBoard ? 1 : 0)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open Fullscreen Presentation Viewer for ${project.cleanTitle || project.title}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openFullscreen(hasConceptBoard ? 1 : 0)
                        }
                      }}
                    >
                      <div className="behance-media-ratio-box behance-aspect-horizontal">
                        <img
                          src={cleanAssetUrl(
                            (hasConceptBoard ? activeAssets[1] : activeAssets[0]) ||
                            (typeof presentationSlides[0] === 'string'
                              ? presentationSlides[0]
                              : presentationSlides[0]?.baseJpeg) ||
                            project.thumbnail
                          )}
                          alt={`${project.cleanTitle || project.title} - Presentation Deck`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="preview-media-hover-overlay">
                          <span
                            className="preview-expand-badge"
                            style={{ backgroundColor: '#d0ff00', color: '#000000', fontWeight: 'bold' }}
                          >
                            <span>▶</span> VIEW PRESENTATION DECK ({presentationSlides.length} SLIDES)
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Safe Behance-Style Adaptive Preview Grid */}
                <SafeProjectGallery
                  project={project}
                  onOpenFullscreen={openFullscreen}
                />

                {/* Optional Presentation Deck Card for projects with slide decks (e.g. Hero Xtreme) */}
                {Array.isArray(project?.presentationSlides) && project.presentationSlides.length > 0 && !isAmazonOnly && (
                  <div
                    className="behance-asset-card"
                    style={{ width: '100%', marginTop: '20px' }}
                    onClick={() => openPresentationViewer(project.presentationSlides)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open Presentation Deck for ${project.cleanTitle || project.title}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openPresentationViewer(project.presentationSlides)
                      }
                    }}
                  >
                    <div className="behance-media-ratio-box behance-aspect-horizontal">
                      <img
                        src={cleanAssetUrl(
                          project.pptThumbnail ||
                          (typeof project.presentationSlides[0] === 'string'
                            ? project.presentationSlides[0]
                            : project.presentationSlides[0]?.baseJpeg) ||
                          project.thumbnail
                        )}
                        alt={`${project.cleanTitle || project.title} - Presentation Deck`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="preview-media-hover-overlay">
                        <span
                          className="preview-expand-badge"
                          style={{ backgroundColor: '#d0ff00', color: '#000000', fontWeight: 'bold' }}
                        >
                          <span>▶</span> VIEW PRESENTATION DECK ({project.presentationSlides.length} SLIDES)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Optional PDF Specimen Preview Card */}
                {(isPdf || project.hasPdf) && (
                  <div
                    className="preview-pdf-slot"
                    onClick={openPdfLightbox}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open fullscreen PDF view of ${project.title}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openPdfLightbox()
                      }
                    }}
                  >
                    <div className="preview-pdf-info">
                      <span className="preview-pdf-badge">PDF SPECIMEN</span>
                      <span className="preview-pdf-title">Verified Project Dossier & Deck</span>
                      <span className="preview-pdf-sub">
                        Click to inspect in fullscreen high-resolution viewer
                      </span>
                    </div>
                    <button type="button" className="btn-pdf-view" aria-hidden="true" tabIndex={-1}>
                      VIEW PDF ⤢
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Previous / Next Navigation Controls (Retained with clean spacing) */}
            <div className="preview-nav-controls">
              <button
                type="button"
                className="btn-nav-prev has-transform-box"
                onClick={handlePrev}
                aria-label="Previous project"
              >
                ← PREVIOUS
                <TransformBoundingBox />
              </button>

              <span className="preview-step-counter">
                {String(currentIndex + 1).padStart(2, '0')} / {String(totalProjects).padStart(2, '0')}
              </span>

              <button
                type="button"
                className="btn-nav-next has-transform-box"
                onClick={handleNext}
                aria-label="Next project"
              >
                NEXT →
                <TransformBoundingBox />
              </button>
            </div>
          </div>

          {/* Custom Slim Scrollbar with Orange Indicator Pill (Matching Ref 3) */}
          <div className="preview-custom-scrollbar" aria-hidden="true">
            <div className="preview-scroll-track">
              <div
                className="preview-scroll-thumb"
                style={{
                  top: `calc(${thumbPercent * 100}% - ${thumbPercent * 32}px)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* If PPT: Render independent unconstrained Fullscreen Scroll Container via portal */}
      {activeLightboxMedia?.type === 'ppt' ? (
        createPortal(
          <div
            ref={(el) => {
              pptScrollRef.current = el
              if (el && !el._hasWheelCapture) {
                el._hasWheelCapture = true
                el.addEventListener('wheel', (e) => e.stopPropagation(), { capture: true, passive: true })
                el.addEventListener('touchmove', (e) => e.stopPropagation(), { capture: true, passive: true })
              }
            }}
            id="ppt-fullscreen-scroller"
            data-lenis-prevent="true"
            className="ppt-scroll-container project-modal-scroll"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              display: 'block', /* CRITICAL: MUST BE BLOCK, NOT FLEX CENTER! */
              overflowY: 'scroll',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              zIndex: 99999,
              pointerEvents: 'auto',
              backgroundColor: '#050508',
              padding: '60px 80px 140px 80px',
              boxSizing: 'border-box',
            }}
          >
            {/* Side Navigation Buttons fixed on left and right edges */}
            {(modalItems?.length || activeAssets.length) > 1 && (
              <>
                {/* PREVIOUS ITEM BUTTON (←) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrevItem()
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation()
                    handlePrevItem()
                  }}
                  style={{
                    position: 'fixed',
                    left: '24px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 100005,
                    width: '48px',
                    height: '48px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(20, 20, 28, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#d0ff00',
                    fontSize: '22px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                  }}
                  aria-label="Previous asset"
                >
                  &#8592;
                </button>

                {/* NEXT ITEM BUTTON (→) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNextItem()
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation()
                    handleNextItem()
                  }}
                  style={{
                    position: 'fixed',
                    right: '24px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 100005,
                    width: '48px',
                    height: '48px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(20, 20, 28, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#d0ff00',
                    fontWeight: 'bold',
                    fontSize: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                  }}
                  aria-label="Next asset"
                >
                  &#8594;
                </button>
              </>
            )}

            {/* Dedicated Fullscreen Close Button at top-right */}
            <button
              type="button"
              onClick={handleCloseLightbox}
              onTouchEnd={handleCloseLightbox}
              style={{
                position: 'fixed',
                top: '24px',
                right: '28px',
                zIndex: 100006,
                width: '48px',
                height: '48px',
                borderRadius: '9999px',
                backgroundColor: '#d8ff00',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                color: '#004af2',
                fontSize: '20px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                pointerEvents: 'auto',
                boxShadow: '0 4px 20px rgba(216, 255, 0, 0.4), 0 8px 30px rgba(0, 0, 0, 0.8)',
              }}
              aria-label="Close fullscreen presentation"
            >
              ✕
            </button>

            {/* Active Asset Counter Pill at bottom */}
            {(modalItems?.length || activeAssets.length) > 1 && (
              <div
                style={{
                  position: 'fixed',
                  bottom: '24px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 10005,
                  pointerEvents: 'none',
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(20, 20, 28, 0.92)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {(() => {
                  if (modalItems && modalItems.length > 0) {
                    const currentItem = modalItems[currentImageIndex] || modalItems[0]
                    return (
                      <span style={{ color: '#d0ff00', fontWeight: 'bold' }}>
                        {String(currentImageIndex + 1).padStart(2, '0')} / {String(modalItems.length).padStart(2, '0')} • {(currentItem.label || currentItem.cleanTitle || currentItem.title || 'ITEM').toUpperCase()}
                      </span>
                    )
                  }
                  const currentDeckSlides =
                    Array.isArray(activeLightboxMedia?.slides) && activeLightboxMedia.slides.length > 0
                      ? activeLightboxMedia.slides
                      : presentationSlides
                  const hasDecks = Array.isArray(project?.presentationDecks) && project.presentationDecks.length > 1
                  return (
                    <span style={{ color: '#d0ff00', fontWeight: 'bold' }}>
                      {hasDecks
                        ? `DECK ${currentImageIndex + 1} • ${(activeLightboxMedia?.cleanTitle || '').toUpperCase()} (${currentDeckSlides.length} SLIDES)`
                        : `${hasConceptBoard ? '02 • ' : ''}PRESENTATION DECK (${currentDeckSlides.length} SLIDES)`}
                    </span>
                  )
                })()}
              </div>
            )}

            {/* Floating Top Pill for PPT */}
            {(() => {
              const currentDeckSlides =
                Array.isArray(activeLightboxMedia?.slides) && activeLightboxMedia.slides.length > 0
                  ? activeLightboxMedia.slides
                  : presentationSlides
              const hasDecks = Array.isArray(project?.presentationDecks) && project.presentationDecks.length > 1
              let displayDeckTitle = hasDecks
                ? (activeLightboxMedia?.title || `${project?.cleanTitle || project?.title} - Deck ${currentImageIndex + 1}`).toUpperCase()
                : `${project?.cleanTitle || project?.title || 'PRESENTATION DECK'} • PRESENTATION DECK`

              if (modalItems && modalItems[currentImageIndex]) {
                const currentItem = modalItems[currentImageIndex]
                displayDeckTitle = (currentItem.title || currentItem.label || project?.cleanTitle || project?.title).toUpperCase()
              }

              return (
                <div
                  style={{
                    position: 'sticky',
                    top: '0px',
                    zIndex: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 'fit-content',
                    maxWidth: '1050px',
                    margin: '0 auto 28px auto',
                    padding: '10px 24px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(20, 20, 28, 0.92)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.7)',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#d0ff00',
                        display: 'inline-block',
                        boxShadow: '0 0 10px #d0ff00',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        color: '#d0ff00',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {displayDeckTitle}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: 'rgba(255, 255, 255, 0.6)',
                      }}
                    >
                      • {currentDeckSlides.length} Widescreen Slides (16:9)
                    </span>
                  </div>
                </div>
              )
            })()}

            <div
              style={{
                width: '100%',
                maxWidth: '1050px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '28px',
              }}
            >
              {/* Render the presentation slides here */}
              {(() => {
                const currentDeckSlides =
                  Array.isArray(activeLightboxMedia?.slides) && activeLightboxMedia.slides.length > 0
                    ? activeLightboxMedia.slides
                    : presentationSlides

                return currentDeckSlides.map((slideUrl, idx) => {
                  const slideNum = idx + 1
                  const isAmazonDeck = isAmazonOnly || (project?.folder || '').toLowerCase().includes('amazon')
                  const slideMeta =
                    (isAmazonDeck && Array.isArray(pptData) ? pptData[idx] : null) ||
                    project?.slideMeta?.[idx] ||
                    activeLightboxMedia?.slideMeta?.[idx] ||
                    (typeof slideUrl === 'object' && slideUrl ? slideUrl : {}) ||
                    {}
                  const slideElements =
                    slideMeta.elements ||
                    (Array.isArray(slideMeta.media)
                      ? slideMeta.media.map((m, mIdx) => {
                          const isVid = typeof m === 'object' && m.isVideo !== undefined ? m.isVideo : checkIsVideo(typeof m === 'string' ? m : m?.src)
                          const mediaSrc = typeof m === 'string' ? m : m?.src
                          return {
                            id: `elem-${slideNum}-${mIdx + 1}`,
                            type: isVid ? 'video' : 'gif',
                            src: mediaSrc,
                            isVideo: isVid,
                            x: 0,
                            y: 0,
                            w: 100,
                            h: 100,
                            zIndex: 15,
                            objectFit: 'contain',
                          }
                        })
                      : [])
                  const slideBg = slideMeta.backgroundColor || '#0d0d12'

                return (
                  <div
                    key={`ppt-slide-${slideNum}`}
                    id={`slide-${slideNum}`}
                    style={{
                      width: '100%',
                      aspectRatio: '16 / 9',
                      position: 'relative',
                      backgroundColor: slideBg,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                    }}
                  >
                    {/* Base Slide Image */}
                    <img
                      src={cleanAssetUrl(typeof slideUrl === 'string' ? slideUrl : (slideUrl?.baseJpeg || slideUrl?.baseImage || ''))}
                      alt={`Slide ${slideNum}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        border: 'none',
                        outline: 'none',
                      }}
                      loading={idx < 4 ? 'eager' : 'lazy'}
                      decoding="async"
                      draggable={false}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />

                    {/* Animated GIFs, Videos & Dynamic Slide Overlays */}
                    {slideElements.map((element, elIdx) => {
                      const isSlide20Or50 =
                        isAmazonDeck &&
                        (idx === 19 ||
                          idx === 49 ||
                          slideNum === 20 ||
                          slideNum === 50 ||
                          slideMeta.slideNumber === 20 ||
                          slideMeta.slideNumber === 50 ||
                          String(slideUrl || '').includes('Slide%2020') ||
                          String(slideUrl || '').includes('Slide%2050') ||
                          String(slideUrl || '').includes('Slide 20') ||
                          String(slideUrl || '').includes('Slide 50'));

                      // Force GIF and phone frame to the left side on Slide 20 and Slide 50
                      const leftPos = isSlide20Or50
                        ? (String(element.src || '').includes('image27') ? 5.972 : 6)
                        : (element.x ?? 6);

                      if (element.type === 'video') {
                        return (
                          <video
                            key={`slide-${slideNum}-el-${elIdx}`}
                            src={cleanAssetUrl(element.src)}
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="metadata"
                            style={{
                              position: 'absolute',
                              left: `${leftPos}%`,
                              top: `${element.y ?? 0}%`,
                              width: `${element.w ?? 100}%`,
                              height: `${element.h ?? 100}%`,
                              objectFit: element.objectFit || 'contain',
                              border: 'none',
                              outline: 'none',
                              zIndex: element.zIndex || 10,
                              pointerEvents: 'none',
                            }}
                          />
                        )
                      }

                      return (
                        <img
                          key={`slide-${slideNum}-el-${elIdx}`}
                          src={cleanAssetUrl(element.src)}
                          alt=""
                          loading="eager" /* CRITICAL: Eager loading ensures GIFs animate immediately and don't stall */
                          onError={(e) => {
                            // Immediately hide any image that fails to load so broken image icons & white boxes NEVER appear
                            e.currentTarget.style.display = 'none';
                          }}
                          style={{
                            position: 'absolute',
                            left: `${leftPos}%`,
                            top: `${element.y ?? 0}%`,
                            width: `${element.w ?? 100}%`,
                            height: `${element.h ?? 100}%`,
                            objectFit: element.objectFit || 'contain',
                            border: 'none',
                            outline: 'none',
                            zIndex: element.zIndex || 10,
                            pointerEvents: 'none',
                          }}
                        />
                      )
                    })}

                    {/* Slide Corner Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                        userSelect: 'none',
                        zIndex: 25,
                      }}
                    >
                      SLIDE {String(slideNum).padStart(2, '0')} / {String(currentDeckSlides.length).padStart(2, '0')}
                    </div>
                  </div>
                )
              })
            })()}
            </div>
          </div>,
          document.body
        )
      ) : activeLightboxMedia ? (
        <div
          className="media-fullscreen-lightbox"
          onClick={handleCloseLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen Media Lightbox"
        >
          {/* Side Navigation Buttons fixed on left and right edges for ALL projects with multiple assets */}
          {(modalItems?.length || currentAssetList.length) > 1 && (
            <>
              {/* PREVIOUS ITEM BUTTON (←) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrevItem()
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation()
                  handlePrevItem()
                }}
                style={{
                  position: 'fixed',
                  left: '24px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10005,
                  width: '48px',
                  height: '48px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(20, 20, 28, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#d0ff00',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                }}
                aria-label="Previous asset"
              >
                &#8592;
              </button>

              {/* NEXT ITEM BUTTON (→) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleNextItem()
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation()
                  handleNextItem()
                }}
                style={{
                  position: 'fixed',
                  right: '24px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10005,
                  width: '48px',
                  height: '48px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(20, 20, 28, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#d0ff00',
                  fontWeight: 'bold',
                  fontSize: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                }}
                aria-label="Next asset"
              >
                &#8594;
              </button>
            </>
          )}

          {/* Dedicated Fullscreen Close Button at top-right */}
          <button
            type="button"
            onClick={handleCloseLightbox}
            onTouchEnd={handleCloseLightbox}
            style={{
              position: 'fixed',
              top: '24px',
              right: '28px',
              zIndex: 10006,
              width: '48px',
              height: '48px',
              borderRadius: '9999px',
              backgroundColor: '#d8ff00',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              color: '#004af2',
              fontSize: '20px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              pointerEvents: 'auto',
              boxShadow: '0 4px 20px rgba(216, 255, 0, 0.4), 0 8px 30px rgba(0, 0, 0, 0.8)',
            }}
            aria-label="Close fullscreen lightbox"
          >
            ✕
          </button>

          {/* Active Asset Counter Pill at bottom */}
          {(modalItems?.length || currentAssetList.length) > 1 && (
            <div
              style={{
                position: 'fixed',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10005,
                pointerEvents: 'none',
                padding: '8px 20px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(20, 20, 28, 0.92)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: '#ffffff',
                fontSize: '12px',
                fontFamily: 'monospace',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: '#d0ff00', fontWeight: 'bold' }}>
                {modalItems && modalItems.length > 0
                  ? (() => {
                      const currentItem = modalItems[currentImageIndex] || modalItems[0]
                      return `${String(currentImageIndex + 1).padStart(2, '0')} / ${String(modalItems.length).padStart(2, '0')} • ${(currentItem.label || currentItem.cleanTitle || currentItem.title || 'ITEM').toUpperCase()}`
                    })()
                  : isPresentationProject && !project?.isUniversal
                  ? Array.isArray(project?.presentationDecks) && project.presentationDecks.length > 1
                    ? `DECK ${currentImageIndex + 1} • ${(project.presentationDecks[currentImageIndex]?.cleanTitle || `DECK ${currentImageIndex + 1}`).toUpperCase()}`
                    : hasConceptBoard && currentImageIndex === 0
                    ? '01 • KEY VISUAL (CLICK → FOR PPT DECK)'
                    : `${hasConceptBoard ? '02 • ' : ''}PRESENTATION DECK (${presentationSlides.length} SLIDES)`
                  : `${String(currentImageIndex + 1).padStart(2, '0')} / ${String(currentAssetList.length).padStart(2, '0')}`}
              </span>
            </div>
          )}

          {/* Lightbox Media Container for normal image/video/pdf */}
          <div
            className="lightbox-media-container"
            onClick={(e) => e.stopPropagation()}
          >
            {activeLightboxMedia.type === 'pdf' ? (
              <div className="lightbox-pdf-wrapper">
                <iframe
                  src={activeLightboxMedia.src}
                  title={activeLightboxMedia.title}
                  className="lightbox-media-pdf"
                />
                <div className="lightbox-pdf-actions">
                  <a
                    href={activeLightboxMedia.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-lightbox-pdf-open has-transform-box"
                  >
                    Open PDF In New Window ↗
                    <TransformBoundingBox />
                  </a>
                </div>
              </div>
            ) : (() => {
              const currentAsset = (modalItems && modalItems[currentImageIndex]?.src) || activeAssets[currentImageIndex] || activeAssets[0] || activeLightboxMedia.src
              const currentAssetUrl = getAssetUrl(currentAsset) || activeLightboxMedia.src
              const isCurrentVideo = checkIsVideo(currentAssetUrl)

              if (isCurrentVideo) {
                return (
                  <video
                    key={currentAssetUrl}
                    src={cleanAssetUrl(currentAssetUrl)}
                    controls
                    autoPlay
                    preload="metadata"
                    className="lightbox-media-video"
                  />
                )
              }
              if (currentAssetUrl) {
                return (
                  <img
                    key={currentAssetUrl}
                    src={cleanAssetUrl(currentAssetUrl)}
                    alt={`${project.title} - ${currentImageIndex + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="lightbox-media-img"
                  />
                )
              }
              return (
                <div className="lightbox-placeholder-card">
                  <div className="lightbox-placeholder-graphic">
                    <span className="lightbox-placeholder-tag">{project.category}</span>
                    <h3 className="lightbox-placeholder-title">{project.title}</h3>
                    <p className="lightbox-placeholder-sub">{project.description || project.summary}</p>
                  </div>
                </div>
              )
            })()}

            {/* Lightbox Caption Bar */}
            <div className="lightbox-caption-bar">
              <h3 className="lightbox-caption-title">
                {(modalItems && modalItems[currentImageIndex]?.title) || project.title}
                {(modalItems?.length || activeAssets.length) > 1 && (
                  <span
                    className="lightbox-caption-counter"
                    style={{ opacity: 0.65, fontSize: '0.82em', marginLeft: '0.5rem', fontWeight: 500 }}
                  >
                    ({currentImageIndex + 1} / {modalItems ? modalItems.length : activeAssets.length})
                  </span>
                )}
              </h3>
              <p className="lightbox-caption-desc">
                {(modalItems && modalItems[currentImageIndex]?.caption) || project.description || project.summary}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

/**
 * Fullscreen Scrollable PPT Presentation Viewer Component
 * Renders all slides of the PPT sequentially in vertical order so the user can smoothly scroll.
 */
export function FullscreenPPTViewer({
  slides = [],
  title = 'AMAZON PRIME - GOLD DIGGER',
  subtitle = 'Pitch Presentation Deck • 68 Widescreen Slides',
  pptxUrl = '',
  onClose,
  onSwitchToConceptBoard,
}) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const scrollRef = useRef(null)
  const slideRefs = useRef([])

  // Ensure Escape closes presentation viewer, ArrowLeft switches to Concept Board, and home/end scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose?.()
      } else if (e.key === 'ArrowLeft') {
        if (onSwitchToConceptBoard) {
          e.preventDefault()
          onSwitchToConceptBoard()
        }
      } else if (e.key === 'Home') {
        e.preventDefault()
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      } else if (e.key === 'End') {
        e.preventDefault()
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onSwitchToConceptBoard])

  // Track scroll progress and current visible slide
  const handleScroll = (e) => {
    const container = e.currentTarget
    const maxScroll = container.scrollHeight - container.clientHeight
    if (maxScroll > 0) {
      const pct = Math.min(Math.max(container.scrollTop / maxScroll, 0), 1)
      setScrollProgress(pct)
    }

    const containerTop = container.scrollTop
    const containerCenter = containerTop + container.clientHeight / 2

    for (let i = 0; i < slides.length; i++) {
      const el = slideRefs.current[i]
      if (el) {
        const top = el.offsetTop
        const height = el.offsetHeight
        if (containerCenter >= top && containerCenter <= top + height) {
          setActiveSlideIndex(i)
          break
        }
      }
    }
  }

  return (
    <div
      className="fullscreen-ppt-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} Fullscreen Presentation`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Sticky Top Header Bar */}
      <header className="ppt-viewer-header">
        {/* Left: Back button + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.75rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            aria-label="Back to project preview"
          >
            <span>←</span> Back
          </button>

          {onSwitchToConceptBoard && (
            <button
              type="button"
              onClick={onSwitchToConceptBoard}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.75rem',
                borderRadius: '8px',
                background: 'rgba(216, 255, 0, 0.15)',
                border: '1px solid rgba(216, 255, 0, 0.4)',
                color: '#d8ff00',
                fontFamily: 'var(--font-body)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Switch to Key Visual Fullscreen Lightbox"
              aria-label="Switch to Key Visual"
            >
              <span>🖼</span> Key Visual
            </button>
          )}

          <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.15)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <h2
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 800,
                fontSize: 'clamp(0.85rem, 1.4vw, 1.1rem)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#ffffff',
                margin: 0,
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </h2>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.68rem',
                color: 'rgba(255, 255, 255, 0.55)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {subtitle} • {slides.length} Slides
            </span>
          </div>
        </div>

        {/* Center: Live Slide Tracker Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.9rem',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#d8ff00',
            letterSpacing: '0.05em',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#d8ff00',
              display: 'inline-block',
              boxShadow: '0 0 8px #d8ff00',
            }}
          />
          <span>
            SLIDE {String(activeSlideIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </span>
        </div>

        {/* Right: Actions (Close) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
          <button
            type="button"
            onClick={onClose}
            className="lightbox-close-btn"
            style={{
              position: 'static',
              width: '38px',
              height: '38px',
            }}
            aria-label="Close presentation viewer"
          >
            <span className="lightbox-close-icon" style={{ fontSize: '1rem' }}>✕</span>
          </button>
        </div>

        {/* Animated Live Progress Track along bottom edge of header */}
        <div className="ppt-viewer-progress-track">
          <div
            className="ppt-viewer-progress-bar"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
      </header>

      {/* Vertical Sequence Scrollable Slides Container */}
      <main
        ref={scrollRef}
        onScroll={handleScroll}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        className="ppt-viewer-scroll-body lightbox-scrollable ppt-scroll-viewport ppt-scroll-container project-modal-scroll"
        tabIndex={0}
      >
        <div className="ppt-viewer-deck-stream">
          {slides.map((slideUrl, idx) => {
            const slideNum = idx + 1
            const isAmazonDeck = String(title || '').toLowerCase().includes('amazon')
            const slideMeta =
              (isAmazonDeck && Array.isArray(pptData) ? pptData[idx] : null) ||
              project?.slideMeta?.[idx] ||
              activeLightboxMedia?.slideMeta?.[idx] ||
              {}
            const slideElements = slideMeta.elements || []
            const slideBg = slideMeta.backgroundColor || '#0d0d12'

            return (
              <article
                key={`deck-slide-${idx}`}
                ref={(el) => (slideRefs.current[idx] = el)}
                id={`slide-${slideNum}`}
                className="ppt-slide-card"
                style={{ position: 'relative', backgroundColor: slideBg }}
              >
                {/* Slide Floating Corner Pill */}
                <div className="ppt-slide-badge" style={{ zIndex: 25 }}>
                  SLIDE {String(slideNum).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                </div>

                {/* 16:9 Slide Image */}
                <img
                  src={cleanAssetUrl(typeof slideUrl === 'string' ? slideUrl : (slideUrl?.baseJpeg || slideUrl?.baseImage || ''))}
                  alt={`Slide ${slideNum}`}
                  loading={idx < 4 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="ppt-slide-img"
                  draggable={false}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  style={{ border: 'none', outline: 'none' }}
                />

                {/* Dynamic Overlay Elements (Animated GIFs, videos, phone frames) */}
                {slideElements.map((element, elIdx) => {
                  const isSlide20Or50 =
                    isAmazonDeck &&
                    (idx === 19 ||
                      idx === 49 ||
                      slideNum === 20 ||
                      slideNum === 50 ||
                      slideMeta.slideNumber === 20 ||
                      slideMeta.slideNumber === 50 ||
                      String(slideUrl || '').includes('Slide%2020') ||
                      String(slideUrl || '').includes('Slide%2050') ||
                      String(slideUrl || '').includes('Slide 20') ||
                      String(slideUrl || '').includes('Slide 50'));

                  // Force GIF and phone frame to the left side on Slide 20 and Slide 50
                  const leftPos = isSlide20Or50
                    ? (String(element.src || '').includes('image27') ? 5.972 : 6)
                    : (element.x ?? 6);

                  if (element.type === 'video') {
                    return (
                      <video
                        key={`deck-slide-${slideNum}-el-${elIdx}`}
                        src={cleanAssetUrl(element.src)}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        style={{
                          position: 'absolute',
                          left: `${leftPos}%`,
                          top: `${element.y ?? 0}%`,
                          width: `${element.w ?? 100}%`,
                          height: `${element.h ?? 100}%`,
                          objectFit: element.objectFit || 'contain',
                          border: 'none',
                          outline: 'none',
                          zIndex: element.zIndex || 10,
                          pointerEvents: 'none',
                        }}
                      />
                    )
                  }
                  return (
                    <img
                      key={`deck-slide-${slideNum}-el-${elIdx}`}
                      src={cleanAssetUrl(element.src)}
                      alt=""
                      loading="eager"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      style={{
                        position: 'absolute',
                        left: `${leftPos}%`,
                        top: `${element.y ?? 0}%`,
                        width: `${element.w ?? 100}%`,
                        height: `${element.h ?? 100}%`,
                        objectFit: element.objectFit || 'contain',
                        border: 'none',
                        outline: 'none',
                        zIndex: element.zIndex || 10,
                        pointerEvents: 'none',
                      }}
                    />
                  )
                })}
              </article>
            )
          })}
        </div>

        {/* End of Deck Card */}
        <div
          style={{
            maxWidth: '1100px',
            margin: '3rem auto 0 auto',
            paddingTop: '2.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#d8ff00',
            }}
          >
            End of Presentation
          </span>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.82rem',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0,
            }}
          >
            All {slides.length} slides viewed
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontFamily: 'var(--font-body)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ↑ Back to Top
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                background: '#d8ff00',
                border: 'none',
                color: '#000000',
                fontFamily: 'var(--font-body)',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              ✕ Close Viewer
            </button>
          </div>
        </div>
      </main>

      {/* Floating Quick Jump to Top Button */}
      <button
        type="button"
        onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'rgba(10, 11, 16, 0.85)',
          border: '1.5px solid rgba(216, 255, 0, 0.4)',
          color: '#d8ff00',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '1rem',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
          zIndex: 110,
          transition: 'all 0.2s ease',
        }}
        title="Scroll to top"
        aria-label="Scroll to top"
      >
        ↑
      </button>
    </div>
  )
}
