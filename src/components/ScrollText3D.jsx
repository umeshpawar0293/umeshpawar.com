import React from 'react'
import { Text } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * ScrollText3D
 * Genuine 3D Drei <Text> inside the Three.js Canvas.
 * Supports responsive sizing for desktop and mobile viewports (< 768px: 20% reduction, multiplier: 0.8).
 * Renders on all routes EXCEPT contact.
 */
export function ScrollText3D({ currentRoute, activePage }) {
  const { size } = useThree()
  const isMobile = size.width < 768
  const mobileScaleMultiplier = isMobile ? 0.8 : 1.0

  // 1. Hide completely on Contact page
  const pagePath = (currentRoute || activePage || '').toLowerCase()
  if (pagePath.includes('contact')) return null

  // 2. Resolve Text content per route (DO NOT change or revert these text contents)
  let line1 = 'TOTAL MESS RIGHT NOW.'
  let line2 = 'SCROLL TO FIX ME.'

  if (pagePath.includes('work')) {
    line1 = "DON'T LEAVE ME HANGING"
    line2 = 'LIKE A 7 PM BRIEF.'
  } else if (pagePath.includes('about')) {
    line1 = 'FINALLY COLOURS ALIGNING,'
    line2 = 'KEEP SCROLLING'
  }

  const FONT_PATH = '/fonts/DelaGothicOne-Regular.ttf'

  // Position: desktop is offset [0.65, 1.88, -0.6], mobile is horizontally centered [0, 1.48, -0.6]
  // to ensure text does not clip outside mobile screen edges or overlap aggressively with 3D character/props.
  const position = isMobile ? [0, 1.48, -0.6] : [0.65, 1.88, -0.6]

  // Desktop font sizes: Line 1 = 0.155, Line 2 = 0.185. In mobile view, reduced by exactly 20% (multiplier: 0.8).
  const font1Size = 0.155 * mobileScaleMultiplier
  const font2Size = 0.185 * mobileScaleMultiplier

  return (
    <group position={position} rotation={[0, 0, 0]} scale={[1, 1, 1]}>
      {/* LINE 1: CLEAN MATTE OFF-WHITE WITH SUBTLE DEPTH */}
      <Text
        font={FONT_PATH}
        fontSize={font1Size}
        lineHeight={0.8}
        letterSpacing={0.015}
        maxWidth={isMobile ? 2.6 : 3}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        position={[0, 0.08 * mobileScaleMultiplier, 0]}
        outlineWidth={0.003 * mobileScaleMultiplier}
        outlineColor="rgba(13, 6, 26, 0.55)"
        depthOffset={-1}
      >
        {line1}
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
        font={FONT_PATH}
        fontSize={font2Size}
        lineHeight={0.8}
        letterSpacing={0.02}
        maxWidth={isMobile ? 2.6 : 3}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        position={[0, -0.07 * mobileScaleMultiplier, 0]}
        outlineWidth={0.003 * mobileScaleMultiplier}
        outlineColor="rgba(13, 6, 26, 0.55)"
        depthOffset={-1}
      >
        {line2}
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

export default ScrollText3D
