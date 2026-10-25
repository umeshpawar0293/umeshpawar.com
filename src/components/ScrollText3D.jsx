import React from 'react'
import { Text } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * ScrollText3D
 * Genuine 3D Drei <Text> inside the Three.js Canvas featuring true thickness and wet-plastic material gloss.
 * (image_3.png / Toy Story Replica)
 * Desktop Viewport only (min-width: 1024px). Renders on all routes EXCEPT contact.
 */
export function ScrollText3D({ currentRoute, activePage }) {
  const { size } = useThree()
  const isDesktop = size.width >= 1024

  // Desktop Viewport only: Keep mobile entirely untouched
  if (!isDesktop) return null

  // 1. Hide completely on Contact page
  const pagePath = (currentRoute || activePage || '').toLowerCase()
  if (pagePath.includes('contact')) return null

  // 2. Resolve Text content per route
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

  return (
    /* Placed just slightly behind & above the 3D character's head, no tilt (0deg) */
    <group position={[0.65, 1.88, -0.6]} rotation={[0, 0, 0]} scale={[1, 1, 1]}>
      {/* LINE 1: SOLID CRISP WHITE WITH MATTE CHISELED BEVEL & #0D061A OUTLINE */}
      <Text
        font={FONT_PATH}
        fontSize={0.155}
        lineHeight={0.8}
        letterSpacing={0.015}
        maxWidth={3}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        position={[0, 0.08, 0]}
        outlineWidth={0.012}
        outlineColor="#0D061A"
        depthOffset={-2}
      >
        {line1}
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#000000"
          emissiveIntensity={0}
          roughness={0.75}
          metalness={0.0}
        />
      </Text>

      {/* LINE 2: SOLID NEON LIME GREEN (#B4F82B) WITH MATTE CHISELED BEVEL & #0D061A OUTLINE */}
      <Text
        font={FONT_PATH}
        fontSize={0.185}
        lineHeight={0.8}
        letterSpacing={0.02}
        maxWidth={3}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        position={[0, -0.07, 0]}
        outlineWidth={0.012}
        outlineColor="#0D061A"
        depthOffset={-2}
      >
        {line2}
        <meshStandardMaterial
          color="#B4F82B"
          emissive="#000000"
          emissiveIntensity={0}
          roughness={0.75}
          metalness={0.0}
        />
      </Text>
    </group>
  )
}

export default ScrollText3D
