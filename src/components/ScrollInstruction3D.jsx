import React, { useRef } from 'react'
import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'

/**
 * ScrollInstruction3D
 *
 * 3D SCROLL TEXT WITH RESPONSIVE SIZING FOR DESKTOP & MOBILE VIEWPORTS
 *
 * - Font Asset: /fonts/DelaGothicOne-Regular.ttf
 * - Desktop 3D Position: [x: 0.65, y: 1.78, z: -0.55]
 * - Mobile 3D Position: [x: 0, y: 1.45, z: -0.55] (horizontally centered)
 * - Desktop Line 1: fontSize: 0.185
 * - Desktop Line 2: fontSize: 0.21
 * - Mobile (< 768px): Exactly 20% reduction (multiplier: 0.8)
 * - Alignment: anchorX="center", anchorY="middle" (preserved for horizontal centering)
 * - Material: Solid crisp white (#FFFFFF) & Neon lime green (#B4F82B) with matte chiseled bevel & #0D061A outline (no glow/plastic)
 */
export function ScrollInstruction3D({
  line1 = "TOTAL MESS RIGHT NOW.",
  line2 = "SCROLL TO FIX ME.",
  position = [0.65, 1.78, -0.55],
  rotation = [-0.015, 0, 0.055],
  scrollProgress,
  isDesktop = true,
}) {
  const { size } = useThree()
  const isMobile = size?.width ? size.width < 768 : (typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const mobileScaleMultiplier = isMobile ? 0.8 : 1.0

  const FONT_PATH = '/fonts/DelaGothicOne-Regular.ttf'
  const groupRef = useRef()

  // Dynamic chapter copy or default user-provided props (DO NOT change or revert these text contents)
  let activeLine1 = line1
  let activeLine2 = line2

  if (scrollProgress !== undefined && scrollProgress !== null) {
    if (scrollProgress < 0.18) {
      activeLine1 = "TOTAL MESS RIGHT NOW."
      activeLine2 = "SCROLL TO FIX ME."
    } else if (scrollProgress < 0.52) {
      activeLine1 = "FINALLY COLOURS ALIGNING,"
      activeLine2 = "KEEP SCROLLING"
    } else if (scrollProgress < 0.82) {
      activeLine1 = "DON'T LEAVE ME HANGING"
      activeLine2 = "LIKE A 7 PM BRIEF."
    }
  }

  // Active position: desktop defaults to [0.65, 1.78, -0.55], mobile horizontally centered to prevent clipping
  const activeBasePosition = isMobile ? [0, 1.45, -0.55] : position
  const activeRotation = isMobile ? [0, 0, 0] : rotation

  useFrame((state) => {
    if (!groupRef.current) return

    // Hide completely on Contact section (>= 0.84)
    if (scrollProgress !== undefined && scrollProgress >= 0.84) {
      groupRef.current.visible = false
      return
    }

    groupRef.current.visible = true

    // Subtle organic idle levitation oscillation around calibrated Y anchor
    const floatY = Math.sin(state.clock.elapsedTime * 1.5) * 0.008
    groupRef.current.position.y = activeBasePosition[1] + floatY
  })

  // Desktop font sizes: 0.185 & 0.21. In mobile viewport (< 768px), reduced by exactly 20% (multiplier: 0.8).
  const font1Size = 0.185 * mobileScaleMultiplier
  const font2Size = 0.21 * mobileScaleMultiplier

  return (
    <group ref={groupRef} position={activeBasePosition} rotation={activeRotation} scale={[1, 1, 1]}>
      {/* LINE 1: CLEAN MATTE OFF-WHITE WITH SUBTLE DEPTH */}
      <Text
        position={[0, 0.08 * mobileScaleMultiplier, 0]}
        font={FONT_PATH}
        fontSize={font1Size}
        lineHeight={0.65}
        letterSpacing={0.015}
        maxWidth={isMobile ? 2.6 : 3.5}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.003 * mobileScaleMultiplier}
        outlineColor="rgba(13, 6, 26, 0.55)"
        depthOffset={-1}
      >
        {activeLine1}
        <meshStandardMaterial
          color="#F8FAFC"
          emissive="#000000"
          emissiveIntensity={0}
          roughness={0.5}
          metalness={0.1}
        />
      </Text>

      {/* LINE 2: TONALLY BALANCED CITRON/LIME ACCENT WITH SUBTLE DEPTH */}
      <Text
        position={[0, -0.06 * mobileScaleMultiplier, 0]}
        font={FONT_PATH}
        fontSize={font2Size}
        lineHeight={0.65}
        letterSpacing={0.02}
        maxWidth={isMobile ? 2.6 : 3.5}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.003 * mobileScaleMultiplier}
        outlineColor="rgba(13, 6, 26, 0.55)"
        depthOffset={-1}
      >
        {activeLine2}
        <meshStandardMaterial
          color="#D4F868"
          emissive="#000000"
          emissiveIntensity={0}
          roughness={0.5}
          metalness={0.1}
        />
      </Text>
    </group>
  )
}

export default ScrollInstruction3D
