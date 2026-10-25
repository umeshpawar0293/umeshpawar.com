import React from 'react'

/**
 * getScrollText - Dynamic route / page scroll instruction text mapping:
 * - Home (Default): "SCROLL TO" / "FIX ME"
 * - Work: "SCROLL TO CRACK" / "THE LAST PIECE"
 * - About: "PIECES ALIGNING" / "SCROLL TO MEET ME"
 * - Contact: "SCROLL TO" / "SOLVE ME"
 */
export const getScrollText = (route, activePage) => {
  if (route === '/work' || activePage === 'work') {
    return { line1: "DON'T LEAVE ME HANGING", line2: "LIKE A 7 PM BRIEF." }
  }
  if (route === '/about' || activePage === 'about') {
    return { line1: "FINALLY COLOURS ALIGNING,", line2: "KEEP SCROLLING" }
  }
  if (route === '/contact' || activePage === 'contact') {
    return { line1: "", line2: "" }
  }
  return { line1: "TOTAL MESS RIGHT NOW.", line2: "SCROLL TO FIX ME." } // Default / Home
}

/**
 * DesktopScrollInstructionOverlay
 *
 * RESTORE & PIN SCROLL INSTRUCTION DIRECTLY ABOVE/BEHIND CHARACTER HEAD (IMAGE_5 REFERENCE EXACT REPLICA)
 * - Scope: Desktop Viewport (min-width: 1024px) across ALL pages (Home, Work, About, Contact).
 * - High-priority DOM overlay sitting directly above 3D Canvas (z-25).
 * - Anchored dynamically at character head coordinates (--char-head-x, --char-head-y).
 * - Puffy Toy Purple (#a376f4) & Puffy Toy Volt Green (#d0ff00) with specular gloss & 3D drop shadows.
 */
export default function DesktopScrollInstructionOverlay({
  scrollProgress = 0,
  activePage = 'hero',
  currentRoute = '/',
}) {
  const { line1, line2 } = getScrollText(currentRoute, activePage)

  return (
    <aside
      className="desktop-scroll-instruction-overlay"
      aria-hidden="true"
    >
      <span className="puffy-toy-line puffy-toy-purple">{line1}</span>
      <span className="puffy-toy-line puffy-toy-green">{line2}</span>
    </aside>
  )
}
