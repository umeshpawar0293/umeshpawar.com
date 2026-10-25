import React, { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Draws ultra-crisp 3D molded glossy plastic typography onto an offscreen canvas
 * using Google Font 'Six Caps' with dual-tone hierarchy:
 * - Line 1 (Action Verb / Context): High-gloss Pure White (#FFFFFF)
 *   linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 60%, #94A3B8 100%)
 * - Line 2 (Action Target): Exact Signature Volt Green (#d8ff00)
 *   linear-gradient(180deg, #FFFFFF 0%, #d8ff00 35%, #a3d700 80%, #628200 100%)
 * - Hairline Specular Reflection Stroke: 1px rgba(255, 255, 255, 0.70)
 * - Deep 3D Shadow Layering:
 *   drop-shadow(0 2px 0px rgba(0, 0, 0, 0.50))
 *   drop-shadow(0 6px 12px rgba(0, 0, 0, 0.85))
 *   drop-shadow(0 12px 24px rgba(0, 0, 0, 0.60))
 * - Ultra-tight line leading (~0.82 - 0.85) in 'Six Caps'
 */
function drawMoldedPlasticText(ctx, text, cx, y, fontSize, variant = 'white') {
  ctx.font = `400 ${fontSize}px 'Six Caps', sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = '1px'
  }

  // 1. Deep 3D Shadow Layering (Clean separation from background environment)
  // Layer 3 (Deep ambient occlusion): drop-shadow(0 12px 24px rgba(0, 0, 0, 0.60))
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.60)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 12
  ctx.fillStyle = '#000000'
  ctx.fillText(text, cx, y)
  ctx.restore()

  // Layer 2 (Contact depth shadow): drop-shadow(0 6px 12px rgba(0, 0, 0, 0.85))
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 6
  ctx.fillStyle = '#000000'
  ctx.fillText(text, cx, y)
  ctx.restore()

  // Layer 1 (Bevel lip shadow): drop-shadow(0 2px 0px rgba(0, 0, 0, 0.50))
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.50)'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 2
  ctx.fillStyle = '#000000'
  ctx.fillText(text, cx, y)
  ctx.restore()

  // Ambient backlight glow halo
  ctx.save()
  if (variant === 'green') {
    ctx.shadowColor = 'rgba(216, 255, 0, 0.45)'
    ctx.shadowBlur = 20
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.fillStyle = '#d8ff00'
  } else {
    ctx.shadowColor = 'rgba(255, 255, 255, 0.22)'
    ctx.shadowBlur = 16
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.fillStyle = '#ffffff'
  }
  ctx.fillText(text, cx, y)
  ctx.restore()

  // 2. Text Fill & Gloss Gradients
  const fontHalf = fontSize * 0.52
  const grad = ctx.createLinearGradient(0, y - fontHalf, 0, y + fontHalf)
  if (variant === 'green') {
    // Green Lines: linear-gradient(180deg, #FFFFFF 0%, #d8ff00 35%, #a3d700 80%, #628200 100%)
    grad.addColorStop(0.0, '#FFFFFF')  // 0%: Top specular white highlight
    grad.addColorStop(0.35, '#d8ff00') // 35%: Exact Signature Volt Green
    grad.addColorStop(0.80, '#a3d700') // 80%: Glossy mid-body lime
    grad.addColorStop(1.0, '#628200')  // 100%: Deep shaded bevel base
  } else {
    // White Lines: linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 60%, #94A3B8 100%)
    grad.addColorStop(0.0, '#FFFFFF')  // 0%: High-gloss Pure White
    grad.addColorStop(0.60, '#E2E8F0') // 60%: Slate highlight / ceramic white
    grad.addColorStop(1.0, '#94A3B8')  // 100%: Deep shaded bevel base
  }

  ctx.save()
  ctx.fillStyle = grad
  ctx.fillText(text, cx, y)
  ctx.restore()

  // 3. Specular Top Reflection: Hairline bright glossy stroke (1px rgba(255, 255, 255, 0.70))
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.70)'
  ctx.lineWidth = 1.0
  ctx.strokeText(text, cx, y)
  ctx.restore()

  // 4. Curved Acrylic Lacquer Top Sheen Glint
  ctx.save()
  const glossGrad = ctx.createLinearGradient(0, y - fontHalf, 0, y)
  glossGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.65)')
  glossGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.18)')
  glossGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)')
  ctx.fillStyle = glossGrad
  ctx.fillText(text, cx, y)
  ctx.restore()
}

/**
 * Generates an ultra-crisp 1024x512 CanvasTexture with 'Six Caps' 3D molded plastic styling
 */
function createGlossyScrollTexture(line1, line2) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const cx = canvas.width / 2
  // Ultra-tight leading (~0.83 - 0.85): y1 = 200, y2 = 312 (112px delta for font size ~134px)
  const y1 = 200
  const y2 = 312

  // Helper for responsive font sizing within the 1024 canvas box
  const getFontSize = (text, targetSize) => {
    ctx.font = `400 ${targetSize}px 'Six Caps', sans-serif`
    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = '1px'
    }
    const measured = ctx.measureText(text).width
    const MAX_WIDTH = 920
    if (measured > MAX_WIDTH) {
      return Math.floor(targetSize * (MAX_WIDTH / measured))
    }
    return targetSize
  }

  // 1. Line 1: Action Verb / Context (High-gloss Pure White: #FFFFFF)
  const font1Size = getFontSize(line1, 134)
  drawMoldedPlasticText(ctx, line1, cx, y1, font1Size, 'white')

  // 2. Line 2: Action Target (Exact Signature Volt Green: #d8ff00)
  const font2Size = getFontSize(line2, 136)
  drawMoldedPlasticText(ctx, line2, cx, y2, font2Size, 'green')

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}

/**
 * SpatialHeadScrollCue3D Component
 *
 * DESKTOP ONLY: 3D Glossy Multi-Line Scroll Instruction Anchored Behind Character's Head
 * - Strict Viewport Isolation: Only rendered on desktop (min-width: 1024px).
 * - Typography: Google Font 'Six Caps' ultra-condensed & tall display typography.
 * - Dual-Tone Hierarchy:
 *     Line 1: High-gloss Pure White (#FFFFFF -> #E2E8F0 -> #94A3B8)
 *     Line 2: Signature Volt Green (#FFFFFF -> #d8ff00 -> #a3d700 -> #628200)
 * - Molded Plastic Gloss: Multi-layered physical drop-shadows (contact + ambient occlusion)
 *   + 1px specular reflection stroke + curved lacquer top sheen.
 * - Repositioned Crown Depth Zone: Lowered by ~0.17 units (headY + 0.37) to lock right
 *   behind the character's head crown / upper silhouette in a natural 3D depth zone.
 * - Idle Levitation Motion: Floats subtly in sync with character breathing oscillation.
 * - Smooth Chapter Cross-fades: Fluid opacity transitions between Act 1, 2, and 3.
 */
export default function SpatialHeadScrollCue3D({
  headBoneRef,
  currentPosX,
  currentPosY,
  currentPosZ,
  scrollProgress = 0,
  isDesktop = false,
}) {
  const groupRef = useRef()
  const mesh1Ref = useRef()
  const mesh2Ref = useRef()
  const mesh3Ref = useRef()
  const mat1Ref = useRef()
  const mat2Ref = useRef()
  const mat3Ref = useRef()

  const tempWorldPos = useMemo(() => new THREE.Vector3(), [])
  const [fontsLoaded, setFontsLoaded] = useState(false)

  // Ensure 'Six Caps' font is loaded before generating textures
  useEffect(() => {
    if (document.fonts) {
      Promise.all([
        document.fonts.load("400 134px 'Six Caps'"),
        document.fonts.ready,
      ])
        .then(() => {
          setFontsLoaded(true)
        })
        .catch(() => {
          setFontsLoaded(true)
        })
    } else {
      setFontsLoaded(true)
    }
  }, [])

  // Pre-generate crisp glossy textures for each act
  const textures = useMemo(() => {
    return {
      act1: createGlossyScrollTexture('TOTAL MESS RIGHT NOW.', 'SCROLL TO FIX ME. ↓'),
      act2: createGlossyScrollTexture('FINALLY COLOURS ALIGNING,', 'KEEP SCROLLING ↓'),
      act3: createGlossyScrollTexture("DON'T LEAVE ME HANGING", 'LIKE A 7 PM BRIEF. ↓'),
    }
  }, [fontsLoaded])

  // Ensure materials update immediately when textures regenerate
  useEffect(() => {
    if (mat1Ref.current) mat1Ref.current.needsUpdate = true
    if (mat2Ref.current) mat2Ref.current.needsUpdate = true
    if (mat3Ref.current) mat3Ref.current.needsUpdate = true
  }, [textures])

  // Animate position, smooth chapter cross-fade & idle levitation in sync with character
  useFrame((state) => {
    if (!groupRef.current) return

    // Contact section (>= 0.86) or non-desktop: completely hidden
    if (!isDesktop || scrollProgress >= 0.86) {
      groupRef.current.visible = false
      return
    }

    groupRef.current.visible = true

    // 1. Calculate smooth cross-fade opacities for each act
    let op1 = 0
    if (scrollProgress < 0.14) {
      op1 = 1
    } else if (scrollProgress < 0.18) {
      op1 = 1 - (scrollProgress - 0.14) / 0.04
    }

    let op2 = 0
    if (scrollProgress >= 0.14 && scrollProgress < 0.18) {
      op2 = (scrollProgress - 0.14) / 0.04
    } else if (scrollProgress >= 0.18 && scrollProgress < 0.48) {
      op2 = 1
    } else if (scrollProgress >= 0.48 && scrollProgress < 0.52) {
      op2 = 1 - (scrollProgress - 0.48) / 0.04
    }

    let op3 = 0
    if (scrollProgress >= 0.48 && scrollProgress < 0.52) {
      op3 = (scrollProgress - 0.48) / 0.04
    } else if (scrollProgress >= 0.52 && scrollProgress < 0.82) {
      op3 = 1
    } else if (scrollProgress >= 0.82 && scrollProgress < 0.86) {
      op3 = 1 - (scrollProgress - 0.82) / 0.04
    }

    if (mat1Ref.current && mesh1Ref.current) {
      mat1Ref.current.opacity = op1
      mesh1Ref.current.visible = op1 > 0.01
    }
    if (mat2Ref.current && mesh2Ref.current) {
      mat2Ref.current.opacity = op2
      mesh2Ref.current.visible = op2 > 0.01
    }
    if (mat3Ref.current && mesh3Ref.current) {
      mat3Ref.current.opacity = op3
      mesh3Ref.current.visible = op3 > 0.01
    }

    // 2. Head position tracking (via animated skeletal bone or smoothed character coords)
    let headX = currentPosX?.current || 0
    let headY = currentPosY?.current !== null ? currentPosY.current + 1.34 : 0.44
    let headZ = currentPosZ?.current || 0

    if (headBoneRef?.current) {
      headBoneRef.current.getWorldPosition(tempWorldPos)
      headX = tempWorldPos.x
      headY = tempWorldPos.y
      headZ = tempWorldPos.z
    }

    // 3. Idle breathing & levitation motion:
    // Subtle sine-wave oscillation synced with character float
    const floatY = Math.sin(state.clock.elapsedTime * 1.5) * 0.015

    // 4. Repositioned Crown Depth Zone (Lowered to headY + 0.20):
    // Locks the text naturally right behind the character's head crown / upper silhouette & neck,
    // avoiding awkward empty-space float while sitting strictly behind in 3D depth (Z: -0.28).
    groupRef.current.position.x = headX
    groupRef.current.position.y = headY + 0.20 + floatY
    groupRef.current.position.z = headZ - 0.28

    // Ensure plane strictly faces the camera (flat billboard orientation)
    groupRef.current.rotation.set(0, 0, 0)
  })

  // Completely unmounted on non-desktop viewports
  if (!isDesktop) return null

  // Sized plane: 1.05 x 0.525 Three.js units (2:1 aspect ratio matching 1024x512 texture)
  const planeGeo = <planeGeometry args={[1.05, 0.525]} />

  return (
    <group ref={groupRef}>
      {/* Act 1 Mesh */}
      <mesh ref={mesh1Ref} renderOrder={-1}>
        {planeGeo}
        <meshBasicMaterial
          ref={mat1Ref}
          map={textures.act1}
          transparent={true}
          depthTest={true}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* Act 2 Mesh */}
      <mesh ref={mesh2Ref} renderOrder={-1} visible={false}>
        {planeGeo}
        <meshBasicMaterial
          ref={mat2Ref}
          map={textures.act2}
          transparent={true}
          depthTest={true}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* Act 3 Mesh */}
      <mesh ref={mesh3Ref} renderOrder={-1} visible={false}>
        {planeGeo}
        <meshBasicMaterial
          ref={mat3Ref}
          map={textures.act3}
          transparent={true}
          depthTest={true}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
