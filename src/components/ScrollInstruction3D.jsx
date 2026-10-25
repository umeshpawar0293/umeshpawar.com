import React, { useRef } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

/**
 * ScrollInstruction3D
 *
 * ADJUST 3D SCROLL TEXT SIZE, POSITION, AND COMPACT STACK TO MATCH REFERENCE (image_5.png)
 *
 * - Font Asset: /fonts/DelaGothicOne-Regular.ttf
 * - 3D Position: [x: 0.65, y: 1.78, z: -0.55] (shifted backward in Z and tightly above head)
 * - Base Rotation: [x: -0.015, y: 0, z: 0.055] (subtle manual pivot for perspective camera)
 * - Line 1: Rich Toy Purple (#a376f4), fontSize: 0.185, letterSpacing: 0.015, lineHeight: 0.65, position: [0, 0.08, 0]
 * - Line 2: True Puffy Green (#d0ff00), fontSize: 0.21, letterSpacing: 0.02, lineHeight: 0.65, position: [0, -0.06, 0]
 * - Tight Gap: 0.14 Y gap between lines for compact "puffy sausage tag" aesthetic
 * - Material: MeshPhysicalMaterial with wet toy-plastic sheen (roughness: 0.11, clearcoat: 1.0, reflectivity: 0.9)
 * - Desktop Viewport only (min-width: 1024px)
 */
export function ScrollInstruction3D({
  line1 = "TOTAL MESS RIGHT NOW.",
  line2 = "SCROLL TO FIX ME.",
  position = [0.65, 1.78, -0.55],
  rotation = [-0.015, 0, 0.055],
  scrollProgress,
  isDesktop = true,
}) {
  const FONT_PATH = '/fonts/DelaGothicOne-Regular.ttf'
  const groupRef = useRef()

  // Dynamic chapter copy or default user-provided props
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

  useFrame((state) => {
    if (!groupRef.current) return

    // Hide completely on Contact section (>= 0.84) or if not on desktop
    if (!isDesktop || (scrollProgress !== undefined && scrollProgress >= 0.84)) {
      groupRef.current.visible = false
      return
    }

    groupRef.current.visible = true

    // Subtle organic idle levitation oscillation around calibrated Y anchor
    const floatY = Math.sin(state.clock.elapsedTime * 1.5) * 0.008
    groupRef.current.position.y = position[1] + floatY
  })

  // Desktop only guard
  if (!isDesktop) return null

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* LINE 1: SOLID CRISP WHITE WITH MATTE CHISELED BEVEL & #0D061A OUTLINE */}
      <Text
        position={[0, 0.08, 0]}
        font={FONT_PATH}
        fontSize={0.185}
        lineHeight={0.65}
        letterSpacing={0.015}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.012}
        outlineColor="#0D061A"
      >
        {activeLine1}
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
        position={[0, -0.06, 0]}
        font={FONT_PATH}
        fontSize={0.21}
        lineHeight={0.65}
        letterSpacing={0.02}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.014}
        outlineColor="#0D061A"
      >
        {activeLine2}
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

export default ScrollInstruction3D
