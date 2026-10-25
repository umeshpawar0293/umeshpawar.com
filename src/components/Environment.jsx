import React, { useRef, useEffect } from 'react'

/**
 * Pure WebM Video Environment Layer
 * Strictly HTML5 <video> elements with the exact .webm files from /environment/.
 * No static JPEG, JPG, or image fallbacks.
 *
 * 1. NIGHT SCENE:
 *    - Mobile (max-width: 768px): /environment/hero_environment_night_mobile.webm
 *    - Desktop (default):          /environment/hero_environment_night.webm
 *
 * 2. DAY SCENE:
 *    - Mobile (max-width: 768px): /environment/hero-environment_mobile.webm
 *    - Desktop (default):          /environment/hero-environment.webm
 */
export default function Environment({ scrollProgress = 0, currentScene: propScene }) {
  const dayVideoRef = useRef(null)
  const nightVideoRef = useRef(null)

  // 4-chapter narrative scene mapping:
  // Hero (Day) -> About (Night) -> Work (Day) -> Contact (Night)
  const currentScene = propScene || (
    scrollProgress < 0.18 ? 'day' :
    scrollProgress < 0.52 ? 'night' :
    scrollProgress < 0.82 ? 'day' : 'night'
  )

  // Ensure both videos start playing immediately and loop continuously
  useEffect(() => {
    const playVideos = () => {
      if (dayVideoRef.current) {
        dayVideoRef.current.play().catch(() => {})
      }
      if (nightVideoRef.current) {
        nightVideoRef.current.play().catch(() => {})
      }
    }

    playVideos()
    window.addEventListener('pointerdown', playVideos, { once: true })
    window.addEventListener('scroll', playVideos, { once: true })

    // Auto-swap source if viewport crosses 768px breakpoint
    const mql = window.matchMedia('(max-width: 768px)')
    const handleBreakpointChange = () => {
      if (dayVideoRef.current) {
        dayVideoRef.current.load()
        dayVideoRef.current.play().catch(() => {})
      }
      if (nightVideoRef.current) {
        nightVideoRef.current.load()
        nightVideoRef.current.play().catch(() => {})
      }
    }
    mql.addEventListener?.('change', handleBreakpointChange)

    return () => {
      window.removeEventListener('pointerdown', playVideos)
      window.removeEventListener('scroll', playVideos)
      mql.removeEventListener?.('change', handleBreakpointChange)
    }
  }, [])

  return (
    <div className="environment-container bg-video-container" aria-hidden="true">
      {/* DAY VIDEO */}
      <video
        ref={dayVideoRef}
        key="bg-day-webm"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-700 ease-in-out z-0 ${
          currentScene === 'day' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <source
          src="/environment/hero-environment_mobile.webm"
          type="video/webm"
          media="(max-width: 768px)"
        />
        <source
          src="/environment/hero-environment.webm"
          type="video/webm"
        />
      </video>

      {/* NIGHT VIDEO */}
      <video
        ref={nightVideoRef}
        key="bg-night-webm"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-700 ease-in-out z-0 ${
          currentScene === 'night' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <source
          src="/environment/hero_environment_night_mobile.webm"
          type="video/webm"
          media="(max-width: 768px)"
        />
        <source
          src="/environment/hero_environment_night.webm"
          type="video/webm"
        />
      </video>
    </div>
  )
}
