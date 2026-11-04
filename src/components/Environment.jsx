import React, { useRef, useEffect, useState } from 'react'

/**
 * Environment Background Layer
 * Optimized HTML5 <video> with native MP4 & WebM sources, first-frame JPEG posters,
 * and bulletproof iOS Safari / Chrome loop recovery to prevent black screens and freezing.
 */
export default function Environment({ scrollProgress = 0, currentScene: propScene }) {
  const dayVideoRef = useRef(null)
  const nightVideoRef = useRef(null)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= 768
  })

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 4-chapter narrative scene mapping:
  // Hero (Day) -> About (Night) -> Work (Day) -> Contact (Night)
  const currentScene = propScene || (
    scrollProgress < 0.18 ? 'day' :
    scrollProgress < 0.52 ? 'night' :
    scrollProgress < 0.82 ? 'day' : 'night'
  )

  // Ensure both videos start playing immediately and loop continuously without freezing
  useEffect(() => {
    const playVideos = () => {
      if (dayVideoRef.current && dayVideoRef.current.paused) {
        dayVideoRef.current.play().catch(() => {})
      }
      if (nightVideoRef.current && nightVideoRef.current.paused) {
        nightVideoRef.current.play().catch(() => {})
      }
    }

    playVideos()

    // iOS WebKit interaction triggers to awaken video pipeline immediately
    window.addEventListener('pointerdown', playVideos, { passive: true })
    window.addEventListener('touchstart', playVideos, { passive: true })
    window.addEventListener('scroll', playVideos, { passive: true })
    document.addEventListener('visibilitychange', playVideos)

    // Watchdog timer: checks every 2.5s and immediately unfreezes video if iOS WebKit pauses it
    const watchdogInterval = setInterval(playVideos, 2500)

    return () => {
      window.removeEventListener('pointerdown', playVideos)
      window.removeEventListener('touchstart', playVideos)
      window.removeEventListener('scroll', playVideos)
      document.removeEventListener('visibilitychange', playVideos)
      clearInterval(watchdogInterval)
    }
  }, [])

  // Loop recovery helper for iOS WebKit
  const handleLoopRecovery = (e) => {
    const vid = e.currentTarget
    if (!vid) return
    vid.currentTime = 0
    vid.play().catch(() => {})
  }

  const handleTimeUpdateRecovery = (e) => {
    const vid = e.currentTarget
    if (vid && vid.duration && vid.currentTime >= vid.duration - 0.15) {
      vid.currentTime = 0
      vid.play().catch(() => {})
    }
  }

  const dayPoster = isMobile
    ? '/environment/hero-environment_mobile_poster.jpg'
    : '/environment/hero-environment_poster.jpg'

  const nightPoster = isMobile
    ? '/environment/hero_environment_night_mobile_poster.jpg'
    : '/environment/hero_environment_night_poster.jpg'

  return (
    <div
      className="environment-container bg-video-container transition-opacity duration-500 ease-out"
      style={{ backgroundColor: '#12092b' }}
      aria-hidden="true"
    >
      {/* DAY VIDEO */}
      <video
        ref={dayVideoRef}
        key={isMobile ? 'bg-day-mobile' : 'bg-day-desktop'}
        poster={dayPoster}
        autoPlay
        loop
        muted
        playsInline
        webkit-playsinline="true"
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        onEnded={handleLoopRecovery}
        onTimeUpdate={handleTimeUpdateRecovery}
        onPause={(e) => {
          if (!document.hidden) e.currentTarget?.play().catch(() => {})
        }}
        style={{
          backgroundColor: '#12092b',
          objectFit: 'cover',
        }}
        className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-700 ease-in-out z-0 ${
          currentScene === 'day' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <source
          src={isMobile ? '/environment/hero-environment_mobile.mp4' : '/environment/hero-environment.mp4'}
          type="video/mp4"
        />
        <source
          src={isMobile ? '/environment/hero-environment_mobile.webm' : '/environment/hero-environment.webm'}
          type="video/webm"
        />
      </video>

      {/* NIGHT VIDEO */}
      <video
        ref={nightVideoRef}
        key={isMobile ? 'bg-night-mobile' : 'bg-night-desktop'}
        poster={nightPoster}
        autoPlay
        loop
        muted
        playsInline
        webkit-playsinline="true"
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        onEnded={handleLoopRecovery}
        onTimeUpdate={handleTimeUpdateRecovery}
        onPause={(e) => {
          if (!document.hidden) e.currentTarget?.play().catch(() => {})
        }}
        style={{
          backgroundColor: '#12092b',
          objectFit: 'cover',
        }}
        className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-opacity duration-700 ease-in-out z-0 ${
          currentScene === 'night' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <source
          src={isMobile ? '/environment/hero_environment_night_mobile.mp4' : '/environment/hero_environment_night.mp4'}
          type="video/mp4"
        />
        <source
          src={isMobile ? '/environment/hero_environment_night_mobile.webm' : '/environment/hero_environment_night.webm'}
          type="video/webm"
        />
      </video>
    </div>
  )
}
