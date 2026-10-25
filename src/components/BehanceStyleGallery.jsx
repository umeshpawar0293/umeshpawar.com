import React, { useState, useRef, useEffect } from 'react'
import { cleanAssetUrl } from '../data/portfolioData'

/**
 * Helper to safely extract media URL from string or object asset
 */
export const getAssetUrl = (asset) => {
  if (!asset) return ''
  const raw = typeof asset === 'string' ? asset : (asset.url || asset.src || '')
  return cleanAssetUrl(raw)
}

/**
 * Helper to check if a URL represents a video file
 */
export const checkIsVideo = (url) => {
  if (typeof url !== 'string') return false
  const clean = url.toLowerCase().split('?')[0].split('#')[0]
  return clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.mov')
}

/**
 * Helper to detect aspect ratio orientation:
 * - Horizontal (16:9): ratio >= 1.25 -> 1 per row (col-span-6)
 * - Square (1:1): 0.85 <= ratio < 1.25 -> 2 per row (col-span-3)
 * - Vertical (4:5): ratio < 0.85 -> 3 per row (col-span-2)
 */
export const getAssetOrientation = (width, height) => {
  if (!width || !height) return 'horizontal'
  const ratio = width / height
  if (ratio >= 1.25) return 'horizontal'
  if (ratio >= 0.85) return 'square'
  return 'vertical'
}

/**
 * Global dimension cache to prevent layout shift across project previews
 */
export const DIMENSION_CACHE = new Map()

/**
 * Isolated Sub-component to prevent parent re-renders on dimension check
 */
export const GalleryItem = ({ url, isVideo, index, title, isPresentationDeck, onClick }) => {
  // Default to 16:9 horizontal, update locally without touching parent state
  const [colSpanClass, setColSpanClass] = useState(() => {
    if (isPresentationDeck) return 'behance-col-horizontal col-span-1 sm:col-span-2 md:col-span-6'
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
    if (isPresentationDeck) return 'behance-aspect-horizontal aspect-[16/9]'
    const cached = DIMENSION_CACHE.get(url)
    if (cached) {
      if (cached.ratio >= 1.25) return 'behance-aspect-horizontal aspect-[16/9]'
      if (cached.ratio >= 0.85) return 'behance-aspect-square aspect-square'
      return 'behance-aspect-vertical aspect-[4/5]'
    }
    if (/amfi.*kv/i.test(url)) return 'behance-aspect-vertical aspect-[4/5]'
    return 'behance-aspect-horizontal aspect-[16/9]'
  })

  const itemRef = useRef(null)
  const [isInView, setIsInView] = useState(true)

  // IntersectionObserver scroll-in choreography (fade-up + scale settle)
  useEffect(() => {
    const el = itemRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.05 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleMediaDimensions = (w, h) => {
    if (!w || !h) return
    const ratio = w / h
    DIMENSION_CACHE.set(url, { w, h, ratio })

    if (ratio >= 1.25) {
      // Horizontal / 16:9 -> 1 per row
      setColSpanClass('behance-col-horizontal col-span-1 sm:col-span-2 md:col-span-6')
      setAspectClass('behance-aspect-horizontal aspect-[16/9]')
    } else if (ratio >= 0.85) {
      // Square / 1:1 -> 2 per row
      setColSpanClass('behance-col-square col-span-1 sm:col-span-1 md:col-span-3')
      setAspectClass('behance-aspect-square aspect-square')
    } else {
      // Vertical / 4:5 -> 3 per row
      setColSpanClass('behance-col-vertical col-span-1 sm:col-span-1 md:col-span-2')
      setAspectClass('behance-aspect-vertical aspect-[4/5]')
    }
  }

  // Pre-load image dimensions immediately to guarantee zero lag in aspect ratio
  useEffect(() => {
    if (!url || isVideo || isPresentationDeck) return
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
  }, [url, isVideo, isPresentationDeck])

  // Mobile-safe tap tracking (ignores scroll drags)
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

  const handleTouchEnd = (e) => {
    e.stopPropagation()
    if (touchStartRef.current.moved) return
    lastTouchRef.current = Date.now()
    onClick?.()
  }

  const handleClick = (e) => {
    e.stopPropagation()
    if (Date.now() - lastTouchRef.current < 450) return
    onClick?.()
  }

  return (
    <div
      ref={itemRef}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="button"
      tabIndex={0}
      aria-label={`Open fullscreen view of ${title} asset ${index + 1}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      className={`behance-asset-card relative overflow-hidden rounded-xl bg-[#111115] border border-white/10 cursor-pointer group transition-all hover:border-[#d0ff00]/60 select-none ${colSpanClass} ${isPresentationDeck ? 'is-presentation' : ''}`}
      style={{
        touchAction: 'manipulation',
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease',
      }}
    >
      <div className={`behance-media-ratio-box w-full ${aspectClass} overflow-hidden flex items-center justify-center bg-black/40 relative`}>
        {isVideo ? (
          <video
            src={cleanAssetUrl(url)}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            controls={false}
            className={`w-full h-full pointer-events-none ${isPresentationDeck ? 'object-contain' : 'object-cover'}`}
            onLoadedMetadata={(e) => {
              handleMediaDimensions(e.currentTarget.videoWidth, e.currentTarget.videoHeight)
              e.currentTarget.play().catch(() => {})
            }}
          />
        ) : (
          <img
            src={cleanAssetUrl(url)}
            alt={`${title} asset ${index + 1}`}
            loading="lazy"
            decoding="async"
            onLoad={(e) => {
              handleMediaDimensions(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)
            }}
            className={`w-full h-full ${isPresentationDeck ? 'object-contain bg-black' : 'object-cover'} transition-transform duration-500 group-hover:scale-105`}
          />
        )}

        <div className="preview-media-hover-overlay">
          <span className="preview-expand-badge">
            <span>⤢</span> CLICK FOR FULLSCREEN
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Crash-Proof Safe Project Gallery Component
 */
export const SafeProjectGallery = ({ project, onOpenFullscreen }) => {
  // Safe extraction of assets array
  let rawAssets = Array.isArray(project?.assets) && project.assets.length > 0
    ? project.assets
    : (project?.heroMedia || project?.thumbnail ? [project.heroMedia || project.thumbnail] : [])

  // Ensure Concept Board is strictly at index 0 for EAAA project
  if (
    project?.id?.includes('eaaa') ||
    project?.folder?.toLowerCase().includes('eaaa') ||
    project?.title?.toLowerCase().includes('eaaa')
  ) {
    const conceptBoard = rawAssets.filter((file) => {
      const url = getAssetUrl(file)
      return url.toLowerCase().includes('concept') || url.toLowerCase().includes('board')
    })
    const remainingAssets = rawAssets.filter((file) => {
      const url = getAssetUrl(file)
      return !url.toLowerCase().includes('concept') && !url.toLowerCase().includes('board')
    })
    rawAssets = [...conceptBoard, ...remainingAssets]
  }

  // Ensure Amazon project strictly uses the 2 previewAssets (Concept Board + PPT First Slide)
  if (
    project?.id?.includes('amazon') ||
    project?.folder?.toLowerCase().includes('amazon') ||
    project?.title?.toLowerCase().includes('amazon')
  ) {
    if (Array.isArray(project?.previewAssets) && project.previewAssets.length > 0) {
      rawAssets = project.previewAssets
    } else {
      const conceptBoard = rawAssets.filter((file) => {
        const url = getAssetUrl(file)
        return url.toLowerCase().includes('concept') || url.toLowerCase().includes('board')
      })
      const remainingAssets = rawAssets.filter((file) => {
        const url = getAssetUrl(file)
        return !url.toLowerCase().includes('concept') && !url.toLowerCase().includes('board')
      }).sort((a, b) => {
        const strA = getAssetUrl(a)
        const strB = getAssetUrl(b)
        return strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' })
      })
      const firstSlide = remainingAssets[0] || conceptBoard[0]
      rawAssets = [conceptBoard[0] || rawAssets[0], firstSlide].filter(Boolean)
    }
  }

  const isPresentation =
    (!project?.isUniversal && Boolean(project?.isPresentationDeck)) ||
    project?.id?.includes('amazon') ||
    project?.folder?.toLowerCase().includes('amazon') ||
    project?.title?.toLowerCase().includes('amazon')

  if (!rawAssets.length) {
    return (
      <div className="w-full py-16 text-center text-white/50 text-sm">
        No preview assets available.
      </div>
    )
  }

  return (
    <div className="behance-gallery-wrapper w-full max-w-6xl mx-auto py-6 px-3 md:px-6">
      {/* 6-Column CSS Grid for Behance Layout:
          - Horizontal (16:9) -> col-span-6 (1 per row)
          - Square (1:1)       -> col-span-3 (2 per row)
          - Vertical (4:5)     -> col-span-2 (3 per row)
      */}
      <div className="behance-gallery-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-start">
        {rawAssets.map((asset, idx) => {
          const url = getAssetUrl(asset)
          const isVideo = checkIsVideo(url)

          const isSlideItem = isPresentation && (/\bslide/i.test(url) || /presentation/i.test(url))
          return (
            <GalleryItem
              key={`${url}-${idx}`}
              url={url}
              isVideo={isVideo}
              index={idx}
              title={project?.title || 'Project'}
              isPresentationDeck={isSlideItem}
              onClick={() => onOpenFullscreen?.(idx)}
            />
          )
        })}
      </div>
    </div>
  )
}

export { cleanAssetUrl }
export { scanProjectSubfolders } from '../data/portfolioData'
export const BehanceStyleGallery = SafeProjectGallery
export default SafeProjectGallery
