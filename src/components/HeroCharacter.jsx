import React, { useRef, useLayoutEffect, useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import { RubikAnimator, CUBE_CENTER } from '../utils/rubikAnimator'
import useMediaQuery from '../hooks/useMediaQuery'

const MODEL_PATH = '/models/Character_Hero.glb'

// Configuration for the 6 secondary floating props with distinct organic motion & parallax parameters
const FLOATING_PROPS_CONFIG = [
  {
    name: 'Bulb',
    phaseOffset: 0.0,
    speed: 1.5,
    amplitude: 0.0009,
    maxTiltX: 0.18,
    maxTiltY: 0.22,
    shiftX: 0.0010,
    shiftZ: 0.0008,
    baseRotZ: -0.32, // Subtle organic drift tilt along Z-axis (~ -18.3°, within ±15° to ±25° / ±0.25 to 0.4 rad)
    parallaxDepth: 0.0042,
    rotInertia: 0.18,
  },
  {
    name: 'Color',
    phaseOffset: 1.1,
    speed: 1.3,
    amplitude: 0.0010,
    maxTiltX: 0.20,
    maxTiltY: 0.24,
    shiftX: 0.0012,
    shiftZ: 0.0009,
    parallaxDepth: -0.0035,
    rotInertia: -0.22,
  },
  {
    name: 'Keyboard',
    phaseOffset: 2.2,
    speed: 1.7,
    amplitude: 0.0008,
    maxTiltX: 0.16,
    maxTiltY: 0.20,
    shiftX: 0.0009,
    shiftZ: 0.0007,
    parallaxDepth: 0.0048,
    rotInertia: 0.15,
  },
  {
    name: 'Monitor',
    phaseOffset: 3.3,
    speed: 1.2,
    amplitude: 0.0011,
    maxTiltX: 0.22,
    maxTiltY: 0.25,
    shiftX: 0.0013,
    shiftZ: 0.0010,
    offsetX: 0.0045,  // moved closer to character center on horizontal plane
    offsetY: -0.0040, // upper back / shoulder blade height
    offsetZ: -0.0060, // shifted behind character along negative Z-axis, tucked just behind silhouette
    parallaxDepth: -0.0038,
    rotInertia: 0.12,
  },
  {
    name: 'Pen',
    phaseOffset: 4.4,
    speed: 1.9,
    amplitude: 0.0008,
    maxTiltX: 0.24,
    maxTiltY: 0.26,
    shiftX: 0.0011,
    shiftZ: 0.0008,
    parallaxDepth: 0.0055,
    rotInertia: -0.25,
  },
  {
    name: 'Video',
    phaseOffset: 5.5,
    speed: 1.4,
    amplitude: 0.0010,
    maxTiltX: 0.19,
    maxTiltY: 0.23,
    shiftX: 0.0012,
    shiftZ: 0.0009,
    offsetX: 0.0050,
    offsetY: -0.0015,
    parallaxDepth: -0.0040,
    rotInertia: -0.16,
  },
]

export default function HeroCharacter({
  scrollProgress = 0,
  characterDragRef,
  currentRoute,
  activePage,
}) {
  const { scene, animations } = useGLTF(MODEL_PATH, true, true)
  const group = useRef()
  const groupRef = group
  const { actions, names, mixer } = useAnimations(animations, group)
  const { gl, viewport, size } = useThree()
  const isMobileQuery = useMediaQuery('(max-width: 768px)')
  const isMobile = isMobileQuery || (size?.width ? size.width <= 768 : false)

  // Dynamic reflection uniforms:
  // On mobile: steep vertical falloff (fadeEnd ~ 0.016) - only shoes & subtle lower legs visible, torso/jacket completely masked out
  // On desktop: graceful gradual falloff (fadeEnd ~ 0.065)
  const reflectionUniformsRef = useRef({
    uFadeStart: { value: isMobile ? 0.003 : 0.005 },
    uFadeEnd: { value: isMobile ? 0.016 : 0.065 },
    uMixStrength: { value: isMobile ? 0.18 : 0.32 },
    uIsMobile: { value: isMobile ? 1.0 : 0.0 },
  })

  // References for animation and interaction
  const rigRef = useRef(null)
  const characterRef = rigRef
  const headBoneRef = useRef(null)
  const headScreenPosRef = useRef(new THREE.Vector3())
  const pieceGroupsRef = useRef([])
  const animatorRef = useRef(null)
  const isInitializedRef = useRef(false)
  const floatingPropsRef = useRef([])
  // References for mirrored reflection clone & soft contact shadow
  const cloneMixerRef = useRef(null)
  const cloneActionRef = useRef(null)
  const cloneRigRef = useRef(null)

  // Mirrored inverted clone reflection instance with translucent fade & depth falloff
  const cloneScene = useMemo(() => {
    if (!scene) return null
    try {
      const cloned = SkeletonUtils.clone(scene)

      // Hide upper floating props and cube master in the reflection clone
      // so only the character and lower elements cast the grounded reflection
      const hideNames = ['Bulb', 'Color', 'Keyboard', 'Monitor', 'Pen', 'Video', 'CubeHead_Master']
      hideNames.forEach((name) => {
        const obj = cloned.getObjectByName(name)
        if (obj) obj.visible = false
      })

      // Apply translucent fade & vertical gradient alpha falloff shader to cloned materials
      cloned.traverse((child) => {
        child.raycast = () => {}
        if (child.isMesh) {
          child.frustumCulled = false
          child.castShadow = false
          child.receiveShadow = false

          if (child.material) {
            child.material = child.material.clone()
            child.material.transparent = true
            child.material.opacity = isMobile ? 0.22 : 0.32
            child.material.depthWrite = false
            child.material.roughness = 0.82
            child.material.metalness = 0.1
            child.material.customProgramCacheKey = () => 'cloneFloorReflectionShader'
            child.material.needsUpdate = true

            // Vertical gradient alpha falloff shader:
            // Dynamic mask: steep falloff on mobile (shoes/lower legs only) vs smooth on desktop
            child.material.onBeforeCompile = (shader) => {
              shader.uniforms.uFadeStart = reflectionUniformsRef.current.uFadeStart
              shader.uniforms.uFadeEnd = reflectionUniformsRef.current.uFadeEnd
              shader.uniforms.uMixStrength = reflectionUniformsRef.current.uMixStrength
              shader.uniforms.uIsMobile = reflectionUniformsRef.current.uIsMobile

              shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>
                 varying float vMirrorY;`
              )
              shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
                 vMirrorY = position.y;`
              )
              shader.vertexShader = shader.vertexShader.replace(
                '#include <skinning_vertex>',
                `#include <skinning_vertex>
                 vMirrorY = transformed.y;`
              )
              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>
                 uniform float uFadeStart;
                 uniform float uFadeEnd;
                 uniform float uMixStrength;
                 uniform float uIsMobile;
                 varying float vMirrorY;`
              )
              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `#include <dithering_fragment>
                 // Steep vertical fade mask for floor reflection
                 float rawFade = 1.0 - smoothstep(uFadeStart, uFadeEnd, vMirrorY);
                 // On mobile: steep exponential cutoff prevents torso and jacket from rendering on floor
                 float mobileFade = pow(max(0.0, rawFade), 2.2);
                 float reflectionFade = mix(rawFade, mobileFade, uIsMobile);
                 gl_FragColor.a *= max(0.0, reflectionFade) * (uMixStrength / 0.32);`
              )
            }
          }
        }
      })

      return cloned
    } catch (err) {
      console.warn('Failed to clone scene for reflection:', err)
      return null
    }
  }, [scene])

  // Synchronize reflection uniforms and material opacity with mobile breakpoint
  useEffect(() => {
    if (reflectionUniformsRef.current) {
      reflectionUniformsRef.current.uFadeStart.value = isMobile ? 0.003 : 0.005
      reflectionUniformsRef.current.uFadeEnd.value = isMobile ? 0.016 : 0.065
      reflectionUniformsRef.current.uMixStrength.value = isMobile ? 0.18 : 0.32
      reflectionUniformsRef.current.uIsMobile.value = isMobile ? 1.0 : 0.0
    }
    if (cloneScene) {
      cloneScene.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.opacity = isMobile ? 0.22 : 0.32
          child.material.needsUpdate = true
        }
      })
    }
  }, [isMobile, cloneScene])

  // Pre-allocated Euler and Quaternion to eliminate GC allocations in useFrame
  const headEulerRef = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const headQuatRef = useRef(new THREE.Quaternion())

  // Scroll velocity tracking & spring-damped character/prop inertia refs
  const lastScrollProgressRef = useRef(scrollProgress)
  const smoothVelocityRef = useRef(0)
  const velocityTiltXRef = useRef(0)
  const velocityTiltZRef = useRef(0)

  // Procedurally generated high-resolution soft contact shadow texture
  const contactShadowTexture = useMemo(() => {
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Soft, natural radial gradient with gentle organic falloff
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    gradient.addColorStop(0, 'rgba(5, 6, 12, 0.72)')
    gradient.addColorStop(0.18, 'rgba(7, 9, 16, 0.58)')
    gradient.addColorStop(0.38, 'rgba(10, 12, 22, 0.36)')
    gradient.addColorStop(0.60, 'rgba(12, 15, 26, 0.18)')
    gradient.addColorStop(0.80, 'rgba(14, 18, 30, 0.06)')
    gradient.addColorStop(0.94, 'rgba(15, 20, 32, 0.015)')
    gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 256, 256)

    const texture = new THREE.CanvasTexture(canvas)
    texture.generateMipmaps = true
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.needsUpdate = true
    return texture
  }, [])

  // Procedurally generated blurred vertical floor reflection sheen
  const floorReflectionTexture = useMemo(() => {
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Oval reflection glow with vertical stretch
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    gradient.addColorStop(0, 'rgba(140, 170, 220, 0.30)')
    gradient.addColorStop(0.25, 'rgba(110, 140, 190, 0.18)')
    gradient.addColorStop(0.55, 'rgba(70, 95, 140, 0.07)')
    gradient.addColorStop(0.85, 'rgba(30, 45, 80, 0.02)')
    gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 256, 256)

    const texture = new THREE.CanvasTexture(canvas)
    texture.generateMipmaps = true
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.needsUpdate = true
    return texture
  }, [])

  // Window-wide cursor tracking (zero React re-renders, updates via ref)
  const cursorRef = useRef({ x: 0, y: 0, active: false })

  // Damped state for head-follow and cube solve progress
  const smoothYaw = useRef(0)
  const smoothPitch = useRef(0)
  const currentSolveProgress = useRef(0)
  const targetSolveProgress = useRef(0)

  // Controlled climax state machine:
  // 'SCRAMBLED' -> 'SOLVING' -> 'SHORT_HOLD' -> 'EXPLODING' -> 'REVEALED'
  const climaxStateRef = useRef('SCRAMBLED')
  const solveTimerRef = useRef(0)
  const solveStartProgressRef = useRef(0)
  const holdTimerRef = useRef(0)
  const burstTimerRef = useRef(0)

  // Damped rotation for character root group (drag-to-rotate)
  const INITIAL_YAW = -Math.PI / 4

  // Route-aware detection for "Let's Talk" / Contact page
  const pathOrHash =
    typeof window !== 'undefined'
      ? `${window.location.pathname} ${window.location.hash}`
      : ''
  const isContact =
    (pathOrHash || activePage || currentRoute || '').toLowerCase().includes('contact') ||
    currentRoute === '/contact' ||
    currentRoute === '#contact' ||
    activePage === 'contact' ||
    scrollProgress >= 0.833
  const isContactSection = isContact
  const CONTACT_BASE_ROTATION_Y = -0.25 // -0.25 rad (~ -14.3° towards website-right / opposite side)
  const isContactRef = useRef(isContact)
  isContactRef.current = isContact

  // Base rotation: On Contact page, ~ -14.3° towards opposite side (CONTACT_BASE_ROTATION_Y = -0.25 rad); elsewhere, INITIAL_YAW (-45°)
  const currentRotY = useRef(isContact ? CONTACT_BASE_ROTATION_Y : INITIAL_YAW)

  // 1. ROUTE-AWARE ROTATION TARGETING
  // When navigating to the Contact page ("Let's Talk"), smoothly lerp/damp the character group's Y rotation
  // to CONTACT_BASE_ROTATION_Y (-0.25 rad) as its default neutral stance, and reset contact drag offset to 0.
  useEffect(() => {
    if (isContact) {
      if (characterDragRef?.current) {
        characterDragRef.current.targetRotY = CONTACT_BASE_ROTATION_Y
        characterDragRef.current.contactDragOffset = 0
        characterDragRef.current.startRotY = CONTACT_BASE_ROTATION_Y
        characterDragRef.current.velocityX = 0
      }
    } else {
      if (characterDragRef?.current && characterDragRef.current.targetRotY === CONTACT_BASE_ROTATION_Y) {
        characterDragRef.current.targetRotY = INITIAL_YAW
        characterDragRef.current.startRotY = INITIAL_YAW
        characterDragRef.current.contactDragOffset = 0
        characterDragRef.current.velocityX = 0
      }
    }
  }, [isContact, characterDragRef])

  // Damped position and scale for smooth Hero -> About -> Work -> Contact transitions
  const currentPosX = useRef(null)
  const currentPosY = useRef(null)
  const currentPosZ = useRef(null)
  const currentScale = useRef(null)

  // Deterministic Narrative Cube Solve Progression:
  // 1. HERO [0.00, 0.10]: Scrambled state S8 (0.0) - mixed colors on all visible front faces
  // 2. ABOUT [0.26, 0.40]: Partially solved state S5 (0.375) - bottom cross/layer aligned, contrasting top
  // 3. WORK [0.58, 0.74]: Almost-solved state S2 (0.750) - 2 complete layers resolved, only final orientation remaining
  // 4. CONTACT [0.90+]: Solves final 2 front twists to 100% solid faces and bursts ONLY after character settles at center
  useEffect(() => {
    let target = 0
    if (scrollProgress <= 0.10) {
      target = 0
    } else if (scrollProgress < 0.26) {
      // 3 distinct visible slice twists in transit Hero -> About
      const t = (scrollProgress - 0.10) / 0.16
      target = t * 0.375
    } else if (scrollProgress <= 0.40) {
      target = 0.375
    } else if (scrollProgress < 0.58) {
      // 3 distinct visible slice twists in transit About -> Work
      const t = (scrollProgress - 0.40) / 0.18
      target = 0.375 + t * (0.750 - 0.375)
    } else if (scrollProgress < 0.90) {
      // Holds intact at almost-solved (0.750) while gliding to center on Contact
      target = 0.750
    } else {
      target = 1.00
    }
    targetSolveProgress.current = target
  }, [scrollProgress])

  // Track window-wide cursor position so head follows mouse everywhere in viewport
  useEffect(() => {
    const handlePointerMove = (e) => {
      cursorRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      cursorRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
      cursorRef.current.active = true
    }

    const handlePointerLeave = () => {
      cursorRef.current.active = false
    }

    const handlePointerEnter = () => {
      cursorRef.current.active = true
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.addEventListener('mouseleave', handlePointerLeave)
    document.addEventListener('mouseenter', handlePointerEnter)
    window.addEventListener('blur', handlePointerLeave)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('mouseleave', handlePointerLeave)
      document.removeEventListener('mouseenter', handlePointerEnter)
      window.removeEventListener('blur', handlePointerLeave)
    }
  }, [])

  // Mobile & canvas touch-drag rotation controls bound directly to gl.domElement
  // Uses passive listeners for smooth mobile responsiveness
  useEffect(() => {
    const dom = gl?.domElement
    if (!dom || !characterDragRef) return

    const state = characterDragRef.current
    if (!state) return

    const onTouchStart = (e) => {
      if (document.body.dataset.modalOpen === 'true') return
      if (!e.touches || e.touches.length === 0) return
      // Ignore if user tapped on interactive controls outside the 3D scene
      if (
        e.target?.closest?.(
          'a, button, input, textarea, select, [role="button"], .work-mobile-deck-container, .work-coverflow-card'
        )
      ) {
        return
      }

      const touch = e.touches[0]
      state.isDragging = true
      state.startX = touch.clientX
      state.startY = touch.clientY
      state.startRotY = state.targetRotY
      state.lastX = touch.clientX
      state.lastTime = performance.now()
      state.velocityX = 0
      state.touchDirection = null
    }

    const onTouchMove = (e) => {
      if (!state.isDragging || !e.touches || e.touches.length === 0) return
      const touch = e.touches[0]
      const deltaX = touch.clientX - state.startX
      const deltaY = touch.clientY - state.startY

      if (state.touchDirection === null) {
        if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
          state.touchDirection = Math.abs(deltaX) >= Math.abs(deltaY) ? 'horizontal' : 'vertical'
        }
      }

      if (state.touchDirection === 'horizontal') {
        const now = performance.now()
        const dt = Math.max(now - state.lastTime, 1)
        state.velocityX = (touch.clientX - state.lastX) / dt
        state.lastX = touch.clientX
        state.lastTime = now

        const sensitivity = isContactRef.current ? 0.008 : 0.0085
        // Smooth 360-degree rotation on touch drag
        state.targetRotY = state.startRotY + deltaX * sensitivity
        if (isContactRef.current) {
          state.contactDragOffset = state.targetRotY - CONTACT_BASE_ROTATION_Y
        }
      }
    }

    const onTouchEnd = () => {
      if (!state.isDragging) return
      state.isDragging = false
      if (state.touchDirection === 'horizontal' && Math.abs(state.velocityX) > 0.04) {
        const sensitivity = isContactRef.current ? 0.008 : 0.0085
        const inertiaDelta = state.velocityX * (isContactRef.current ? 80 : 90) * sensitivity
        state.targetRotY = state.targetRotY + inertiaDelta
        if (isContactRef.current) {
          state.contactDragOffset = state.targetRotY - CONTACT_BASE_ROTATION_Y
        }
      }
      state.touchDirection = null
    }

    dom.addEventListener('touchstart', onTouchStart, { passive: true })
    dom.addEventListener('touchmove', onTouchMove, { passive: true })
    dom.addEventListener('touchend', onTouchEnd, { passive: true })
    dom.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      dom.removeEventListener('touchstart', onTouchStart)
      dom.removeEventListener('touchmove', onTouchMove)
      dom.removeEventListener('touchend', onTouchEnd)
      dom.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [gl, characterDragRef])

  // Helper functions to reliably locate NLA actions regardless of exact naming / casing
  const getLevitationAction = (acts) => {
    if (!acts) return null
    return (
      acts['levitation'] ||
      acts['Action.001'] ||
      acts['Action'] ||
      acts['Levitation'] ||
      Object.values(acts).find((a) => /levitat|action/i.test(a?.getClip()?.name || '')) ||
      acts[Object.keys(acts)[0]] ||
      null
    )
  }

  const getHeroPoseAction = (acts) => {
    if (!acts) return null
    return (
      acts['hero pose'] ||
      acts['Hero pose'] ||
      acts['Hero Pose'] ||
      acts['Hero_pose'] ||
      acts['hero_pose'] ||
      acts['HeroPose'] ||
      Object.values(acts).find((a) => /hero|pose/i.test(a?.getClip()?.name || '')) ||
      acts[Object.keys(acts)[1]] ||
      null
    )
  }

  const currentActionRef = useRef(null)

  // 1. ANIMATION INITIALIZATION & MOUNT FIX
  // Ensure animations play immediately upon page load without showing a frozen or rest pose
  useEffect(() => {
    // Log available clips to console to verify clean names
    console.log('Clean Animation Names:', names)

    // Initial check: determine target action based on current route
    const pathOrHash =
      typeof window !== 'undefined'
        ? `${window.location.pathname} ${window.location.hash}`
        : ''
    const isContactMount =
      (pathOrHash || activePage || currentRoute || '').toLowerCase().includes('contact') ||
      scrollProgress >= 0.833

    // Initial check: determine target action based on current route
    const isContact =
      currentRoute === '/contact' ||
      currentRoute === '#contact' ||
      activePage === 'contact' ||
      (typeof window !== 'undefined' &&
        (window.location.hash === '#contact' || window.location.pathname === '/contact')) ||
      scrollProgress >= 0.833

    const initialAction = isContact
      ? actions['Hero Pose'] || actions['hero pose'] || getHeroPoseAction(actions)
      : actions['Levitation'] || actions['levitation'] || getLevitationAction(actions)

    if (initialAction) {
      initialAction.reset().fadeIn(0.2).play()
      currentActionRef.current = initialAction
    }

    return () => {
      Object.values(actions).forEach((a) => a?.stop())
    }
  }, [])

  // 2. CLEAN ANIMATION CROSSFADING & BONE RESET ON SECTION CHANGE
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return

    const currentAction = isContactSection
      ? actions['Hero Pose'] || actions['hero pose'] || getHeroPoseAction(actions)
      : actions['Levitation'] || actions['levitation'] || getLevitationAction(actions)
    const previousAction = isContactSection
      ? actions['Levitation'] || actions['levitation'] || getLevitationAction(actions)
      : actions['Hero Pose'] || actions['hero pose'] || getHeroPoseAction(actions)

    if (!currentAction) return
    if (currentActionRef.current === currentAction && currentAction.isRunning()) return

    if (mixer) {
      mixer.timeScale = 1.0
    }

    // Clean fade out of previous action to prevent bone blending conflicts
    if (previousAction && previousAction !== currentAction && previousAction.isRunning()) {
      previousAction.fadeOut(0.4)
    }

    // Clean reset of current action with full weight and timescale
    currentAction
      .reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(0.4)
      .play()

    currentActionRef.current = currentAction

    // Synchronize cloned reflection mixer for grounded shadow & reflection
    if (cloneMixerRef.current && animations && animations.length > 0) {
      const activeClip = currentAction.getClip()
      const cloneAction = cloneMixerRef.current.clipAction(activeClip)
      if (cloneAction) {
        if (cloneActionRef.current && cloneActionRef.current !== cloneAction) {
          cloneActionRef.current.fadeOut(0.4)
        }
        cloneAction
          .reset()
          .setEffectiveTimeScale(1)
          .setEffectiveWeight(1)
          .fadeIn(0.4)
          .play()
        cloneActionRef.current = cloneAction
      }
    }
  }, [isContactSection, actions, animations, mixer])

  // Synchronize cloned reflection mixer & initial action
  useEffect(() => {
    if (!cloneScene || !animations || animations.length === 0) return
    const cloneMixer = new THREE.AnimationMixer(cloneScene)
    cloneMixerRef.current = cloneMixer

    const targetAction = isContactSection ? getHeroPoseAction(actions) : getLevitationAction(actions)
    const activeClip = targetAction?.getClip() || animations[0]

    if (activeClip) {
      const cloneAction = cloneMixer.clipAction(activeClip)
      cloneAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.3).play()
      cloneAction.setLoop(THREE.LoopRepeat, Infinity)
      cloneActionRef.current = cloneAction
    }

    const cloneRig = cloneScene.getObjectByName('rig')
    if (cloneRig) {
      cloneRigRef.current = cloneRig
      cloneRig.rotation.y = isContact ? CONTACT_BASE_ROTATION_Y : INITIAL_YAW
      cloneRig.rotation.x = 0
      cloneRig.rotation.z = 0
    }

    return () => {
      cloneMixer.stopAllAction()
    }
  }, [cloneScene, animations])

  // 2. Setup materials, shadow properties, and Rubik's cube piece hierarchy
  useLayoutEffect(() => {
    if (!scene || isInitializedRef.current) return

    // Configure materials: ensure doubleSided stickers, vibrant PBR colors, no shadow artifacts
    scene.traverse((child) => {
      child.raycast = () => {}
      if (child.isMesh) {
        child.frustumCulled = false

        if (child.material && child.material.name === 'pbr_material') {
          child.material.roughness = Math.max(child.material.roughness ?? 0.45, 0.35)
          child.material.needsUpdate = true
          child.castShadow = true
          child.receiveShadow = true
        } else if (child.material && child.material.name.startsWith('Sticker_')) {
          child.material.side = THREE.DoubleSide
          child.material.roughness = 0.28
          child.material.metalness = 0.0
          child.material.needsUpdate = true
          child.receiveShadow = false
          child.castShadow = true
        } else if (child.material && child.material.name === 'Rubik_Black_Body') {
          child.material.side = THREE.DoubleSide
          child.material.roughness = 0.4
          child.material.metalness = 0.0
          child.material.needsUpdate = true
        }
      }
    })

    const headBone = scene.getObjectByName('c_head.x') || scene.getObjectByName('head.x')
    headBoneRef.current = headBone

    // 1. Initial 45° Yaw Orientation (Landing State):
    // Character root group ("rig") set to a stylish, cinematic three-quarters profile
    // rotation.y = -Math.PI / 4 (~ -45°) facing toward the left hero copy.
    const rig = scene.getObjectByName('rig')
    if (rig) {
      rigRef.current = rig
      rig.rotation.y = isContact ? CONTACT_BASE_ROTATION_Y : INITIAL_YAW
      rig.rotation.x = 0
      rig.rotation.z = 0
    }

    // Explicit raycast disable guardrail on target mesh "Mesh_0"
    const mesh0 = scene.getObjectByName('Mesh_0')
    if (mesh0) {
      mesh0.raycast = () => {}
    }

    // Extract & setup the 6 secondary floating props ("Bulb", "Color", "Keyboard", "Monitor", "Pen", "Video")
    const floatingProps = []
    FLOATING_PROPS_CONFIG.forEach((cfg) => {
      const mesh = scene.getObjectByName(cfg.name)
      if (mesh && mesh.isMesh) {
        mesh.raycast = () => {}
        mesh.frustumCulled = false
        mesh.castShadow = true
        mesh.receiveShadow = true

        // Center geometry so rotation tilt and levitation happen around the prop's geometric center
        if (mesh.geometry) {
          mesh.geometry.computeBoundingBox()
          const center = new THREE.Vector3()
          mesh.geometry.boundingBox.getCenter(center)
          mesh.geometry.center()
          const initX = center.x + (cfg.offsetX || 0)
          const initY = center.y + (cfg.offsetY || 0)
          const initZ = center.z + (cfg.offsetZ || 0)
          mesh.position.set(initX, initY, initZ)
          mesh.rotation.set(cfg.baseRotX || 0, cfg.baseRotY || 0, cfg.baseRotZ || 0)

          floatingProps.push({
            mesh,
            config: cfg,
            initialX: initX,
            initialY: initY,
            initialZ: initZ,
            initialRotX: cfg.baseRotX || 0,
            initialRotY: cfg.baseRotY || 0,
            initialRotZ: cfg.baseRotZ || 0,
            currentTiltX: 0,
            currentTiltY: 0,
            currentShiftX: 0,
            currentShiftZ: 0,
          })
        }
      }
    })
    floatingPropsRef.current = floatingProps

    // Find CubeHead_Master
    const cubeMaster = scene.getObjectByName('CubeHead_Master')
    if (cubeMaster) {
      const groups = []

      // Group each of the 27 pieces with its sticker meshes
      for (let i = 1; i <= 27; i++) {
        const pad = String(i).padStart(2, '0')
        const baseName = `CubePiece_${pad}`
        const baseMesh = cubeMaster.getObjectByName(baseName)
        if (!baseMesh) continue

        const stickers = cubeMaster.children.filter((c) =>
          c.name.startsWith(baseName + '_')
        )

        // Dedicated container for this piece unit inside CubeHead_Master
        const group = new THREE.Group()
        group.name = `Group_${baseName}`
        group.position.copy(baseMesh.position)
        // Group quaternion MUST remain IDENTITY (0,0,0,1) so attached stickers preserve exact exterior offsets
        cubeMaster.add(group)

        scene.updateMatrixWorld(true)

        group.attach(baseMesh)
        stickers.forEach((s) => group.attach(s))
        groups.push(group)
      }

      pieceGroupsRef.current = groups
      animatorRef.current = new RubikAnimator()
      isInitializedRef.current = true

      // Initialize cube in its scrambled configuration (progress = 0)
      const initialScrambled = animatorRef.current.evaluate(0)
      groups.forEach((g, idx) => {
        g.position.copy(initialScrambled[idx].pos)
        g.quaternion.copy(initialScrambled[idx].quat)
        g.scale.setScalar(1.0)
        g.visible = true
      })
    }
  }, [scene])

  // Responsive breakpoints
  const isTablet = !isMobile && size.width < 1024
  const BASE_CHARACTER_HEIGHT = 0.078

  // Mobile Viewport Character Scale Adjustment:
  // Reduced by exactly 10% (0.88 * 0.90 = 0.792) for refined visual balance with background.
  const MOBILE_SCALE_FACTOR = 0.792
  const heroDesiredFraction = isMobile ? 0.70 : isTablet ? 0.62 : 0.69
  const CHARACTER_SCALE_TUNING = 0.93
  const heroScale =
    ((viewport.height * heroDesiredFraction) / BASE_CHARACTER_HEIGHT) *
    CHARACTER_SCALE_TUNING *
    (isMobile ? MOBILE_SCALE_FACTOR : 1.0)

  // Y-Elevation: Fine-tuned vertical elevation on mobile (incremented upward by ~+0.34 Three.js units)
  // so the character, ground shadow, and reflection sit comfortably above the lower fold & gradient
  // while keeping the Rubik's cube head and upper floating props (Bulb, Monitor) neatly below the mobile header.
  const heroPosY = isMobile
    ? -viewport.height / 2 + viewport.height * 0.30
    : -viewport.height / 2 + viewport.height * (isTablet ? 0.095 : 0.11)

  // Desktop Hero composition: Re-centered with ~7% to 8% leftward shift
  // to balance with the left typography container in the desktop viewport.
  const MAX_HERO_COMPOSITION_WIDTH = 1440
  const heroCompWidth = Math.min(size.width, MAX_HERO_COMPOSITION_WIDTH)
  // Character sits comfortably right of the re-centered hero typography
  const heroPixelOffsetX = heroCompWidth * 0.235
  const desktopHeroPosX = (heroPixelOffsetX / size.width) * viewport.width - viewport.width * 0.02

  // Responsive composition:
  // Desktop (min-width: 1024px): Balanced midpoint centering with left text block
  // Mobile (max-width: 768px): position.x = 0 strictly centers combined ensemble horizontally
  const heroPosX = isMobile
    ? 0
    : isTablet
    ? viewport.width * 0.20
    : desktopHeroPosX

  // Desktop Contact composition: Character stays on the RIGHT side of the card stack,
  // creating a balanced composite assembly whose visual center of mass sits directly in the viewport center!
  const contactPixelOffsetX = heroCompWidth * 0.175 // ~240px right of center
  const desktopContactPosX = (contactPixelOffsetX / size.width) * viewport.width
  const contactPosX = isMobile
    ? 0
    : isTablet
    ? viewport.width * 0.18
    : desktopContactPosX

  // 3. Per-frame loop: Baked Animation + Head Follow + Real Cube Solve + Drag Rotation + Scene Transitions
  useFrame((state, delta) => {
    // Keep reflection uniforms synchronized continuously
    if (reflectionUniformsRef.current) {
      reflectionUniformsRef.current.uFadeStart.value = isMobile ? 0.003 : 0.005
      reflectionUniformsRef.current.uFadeEnd.value = isMobile ? 0.016 : 0.065
      reflectionUniformsRef.current.uMixStrength.value = isMobile ? 0.18 : 0.32
      reflectionUniformsRef.current.uIsMobile.value = isMobile ? 1.0 : 0.0
    }

    // Track scroll/transition velocity (scrollDelta) for organic character tilt & prop inertia
    const scrollDelta = scrollProgress - lastScrollProgressRef.current
    lastScrollProgressRef.current = scrollProgress
    const instantVelocity = scrollDelta / Math.max(delta, 0.001)

    smoothVelocityRef.current = THREE.MathUtils.damp(
      smoothVelocityRef.current,
      instantVelocity,
      6.0,
      delta
    )

    // Scroll Velocity Character Tilt (pitch and bank tilt, max ±0.06 rad):
    // Pitch (X): subtle forward/backward tilt based on velocity
    // Bank (Z): subtle side-to-side bank based on movement
    const targetTiltX = THREE.MathUtils.clamp(-smoothVelocityRef.current * 0.045, -0.06, 0.06)
    const targetTiltZ = THREE.MathUtils.clamp(-smoothVelocityRef.current * 0.035, -0.06, 0.06)

    velocityTiltXRef.current = THREE.MathUtils.damp(
      velocityTiltXRef.current,
      targetTiltX,
      5.0,
      delta
    )
    velocityTiltZRef.current = THREE.MathUtils.damp(
      velocityTiltZRef.current,
      targetTiltZ,
      5.0,
      delta
    )

    // A. Subtle procedural head cursor-follow strictly isolated to headBone (no shoulder/arm deformation)
    if (headBoneRef.current) {
      let targetYaw = 0
      let targetPitch = 0

      if (!isMobile && cursorRef.current.active) {
        // Gentle micro-rotation strictly isolated to the head (zero impact on shoulders/arms/clavicles)
        const isContactPage =
          (typeof window !== 'undefined' && window.location.hash === '#contact') ||
          scrollProgress >= 0.833
        const MAX_YAW = (isContactPage ? 8.0 : 7.0) * (Math.PI / 180)
        const MAX_PITCH = (isContactPage ? 4.5 : 4.0) * (Math.PI / 180)

        targetYaw = cursorRef.current.x * MAX_YAW
        targetPitch = -cursorRef.current.y * MAX_PITCH
      }

      smoothYaw.current = THREE.MathUtils.damp(
        smoothYaw.current,
        targetYaw,
        3.5,
        delta
      )
      smoothPitch.current = THREE.MathUtils.damp(
        smoothPitch.current,
        targetPitch,
        3.5,
        delta
      )

      headEulerRef.current.set(smoothPitch.current, smoothYaw.current, 0, 'YXZ')
      headQuatRef.current.setFromEuler(headEulerRef.current)
      headBoneRef.current.quaternion.multiply(headQuatRef.current)

      // Project 3D head bone position to 2D viewport coordinates for DesktopScrollInstructionOverlay
      if (!isMobile && headScreenPosRef.current) {
        headBoneRef.current.getWorldPosition(headScreenPosRef.current)
        headScreenPosRef.current.project(state.camera)
        const screenX = (headScreenPosRef.current.x * 0.5 + 0.5) * window.innerWidth
        const screenY = (-headScreenPosRef.current.y * 0.5 + 0.5) * window.innerHeight
        document.documentElement.style.setProperty('--char-head-x', `${screenX.toFixed(1)}px`)
        document.documentElement.style.setProperty('--char-head-y', `${screenY.toFixed(1)}px`)
      }
    }

    // B2. Floating Elements Hookup: Organic sine-wave levitation & Interactive Cursor Parallax
    if (floatingPropsRef.current.length > 0) {
      const pointerX = state.pointer?.x ?? cursorRef.current.x
      const pointerY = state.pointer?.y ?? cursorRef.current.y
      const lerpFactor = 0.065 // Silky smooth lag-free easing within 0.05 - 0.08

      floatingPropsRef.current.forEach((item) => {
        const { mesh, config } = item

        // Organic Floating Motion: Subtle sine-wave levitation on Y position with distinct phase offset
        const floatY =
          Math.sin(state.clock.elapsedTime * config.speed + config.phaseOffset) *
          config.amplitude

        // Interactive Cursor Parallax: Target rotation tilt (X and Y) & micro position offset (Z and X)
        const targetTiltX = -pointerY * config.maxTiltX
        const targetTiltY = pointerX * config.maxTiltY
        const targetShiftX = pointerX * config.shiftX
        const targetShiftZ = pointerY * config.shiftZ

        // Dampen with THREE.MathUtils.lerp
        item.currentTiltX = THREE.MathUtils.lerp(item.currentTiltX, targetTiltX, lerpFactor)
        item.currentTiltY = THREE.MathUtils.lerp(item.currentTiltY, targetTiltY, lerpFactor)
        item.currentShiftX = THREE.MathUtils.lerp(item.currentShiftX, targetShiftX, lerpFactor)
        item.currentShiftZ = THREE.MathUtils.lerp(item.currentShiftZ, targetShiftZ, lerpFactor)

        // Staggered vertical parallax and gentle rotational inertia driven by scroll velocity
        const parallaxMult = item.config.parallaxDepth || 0.003
        const inertiaRotMult = item.config.rotInertia || 0.15
        const targetParallaxY = parallaxMult * smoothVelocityRef.current
        const targetInertiaRotX = inertiaRotMult * smoothVelocityRef.current

        item.currentParallaxY = THREE.MathUtils.damp(item.currentParallaxY || 0, targetParallaxY, 5.0, delta)
        item.currentInertiaRotX = THREE.MathUtils.damp(item.currentInertiaRotX || 0, targetInertiaRotX, 5.0, delta)

        mesh.position.x = item.initialX + item.currentShiftX
        mesh.position.y = item.initialY + floatY + item.currentParallaxY
        mesh.position.z = item.initialZ + item.currentShiftZ
        mesh.rotation.x = item.initialRotX + item.currentTiltX + item.currentInertiaRotX
        mesh.rotation.y = item.initialRotY + item.currentTiltY
        mesh.rotation.z = item.initialRotZ
      })
    }

    // C. Smooth Character transitions across HERO -> ABOUT -> WORK -> CONTACT
    // REQUIREMENT 1: Mobile position, scale, and camera framing remain IDENTICAL and LOCKED
    // across all 4 sections (Hero, About, Work, Contact) during transitions.
    // Desktop layout and transitions remain 100% UNTOUCHED.
    let targetPosX = 0
    let targetPosY = heroPosY
    let targetPosZ = 0
    const targetScale = heroScale // NEVER SCALED DOWN!

    if (isMobile) {
      targetPosX = heroPosX
      targetPosY = heroPosY
      targetPosZ = 0
    } else {
      if (scrollProgress <= 0.10) {
        // Act 1: HERO (Character on the right, prominent)
        targetPosX = heroPosX
        targetPosY = heroPosY
        targetPosZ = 0
      } else if (scrollProgress < 0.26) {
        // Hero -> About transition (slides smoothly from heroPosX to contactPosX on the right)
        const t = (scrollProgress - 0.10) / 0.16
        const smoothT = t * t * (3 - 2 * t)
        targetPosX = THREE.MathUtils.lerp(heroPosX, contactPosX, smoothT)
        targetPosY = heroPosY
        targetPosZ = 0
      } else if (scrollProgress <= 0.40) {
        // Act 2: ABOUT (Character locked strictly in RIGHT-CENTER zone matching contactPosX and scale)
        targetPosX = contactPosX
        targetPosY = heroPosY
        targetPosZ = 0
      } else if (scrollProgress < 0.58) {
        // About -> Work transition (smoothly transitions from contactPosX to heroPosX)
        const t = (scrollProgress - 0.40) / 0.18
        const smoothT = t * t * (3 - 2 * t)
        targetPosX = THREE.MathUtils.lerp(contactPosX, heroPosX, smoothT)
        targetPosY = heroPosY
        targetPosZ = 0
      } else if (scrollProgress <= 0.74) {
        // Act 3: WORK (Character stays on the RIGHT side, projects on the left/center)
        targetPosX = heroPosX
        targetPosY = heroPosY
        targetPosZ = 0
      } else if (scrollProgress < 0.90) {
        // Work -> Contact transition (character moves smoothly from Work position to Contact position)
        const t = (scrollProgress - 0.74) / 0.16
        const smoothT = t * t * (3 - 2 * t)
        targetPosX = THREE.MathUtils.lerp(heroPosX, contactPosX, smoothT)
        targetPosY = heroPosY
        targetPosZ = 0
      } else {
        // Act 4: CONTACT & CLIMAX (Character on the right side of the card stack, center-right)
        targetPosX = contactPosX
        targetPosY = heroPosY
        targetPosZ = 0
      }
    }

    if (currentPosX.current === null) {
      currentPosX.current = targetPosX
      currentPosY.current = targetPosY
      currentPosZ.current = targetPosZ
      currentScale.current = targetScale
    } else {
      currentPosX.current = THREE.MathUtils.damp(currentPosX.current, targetPosX, 8.0, delta)
      currentPosY.current = THREE.MathUtils.damp(currentPosY.current, targetPosY, 8.0, delta)
      currentPosZ.current = THREE.MathUtils.damp(currentPosZ.current, targetPosZ, 8.0, delta)
      currentScale.current = THREE.MathUtils.damp(currentScale.current, targetScale, 8.0, delta)
    }

    // D. Rubik's Cube deterministic solve & final climax explosion
    if (animatorRef.current && pieceGroupsRef.current.length === 27) {
      const isContactSection = scrollProgress >= 0.88
      // CRITICAL REQUIREMENT: Burst trigger is strictly conditioned on character
      // reaching, settling, and locking at target position on the Contact page
      const isCharacterSettled =
        currentPosX.current !== null &&
        Math.abs(currentPosX.current - targetPosX) < 0.008

      // State Lock: Only reset climax state if user scrolls well back into Work (< 0.74)
      if (scrollProgress < 0.74) {
        climaxStateRef.current = 'SOLVING'
        solveTimerRef.current = 0
        holdTimerRef.current = 0
        burstTimerRef.current = 0
      }

      // Enter Contact solve sequence ONLY when character has fully arrived & settled at target position on Contact
      if (
        isContactSection &&
        isCharacterSettled &&
        climaxStateRef.current !== 'CONTACT_SOLVING' &&
        climaxStateRef.current !== 'SHORT_HOLD' &&
        climaxStateRef.current !== 'EXPLODING' &&
        climaxStateRef.current !== 'REVEALED'
      ) {
        climaxStateRef.current = 'CONTACT_SOLVING'
        solveTimerRef.current = 0
        solveStartProgressRef.current = currentSolveProgress.current
      }

      const groups = pieceGroupsRef.current
      let transforms = null

      // Sequence Timeline (~1.35s total medium cinematic pace):
      // 1. CONTACT_SOLVING: Smooth, visible rotations (0.60s)
      if (climaxStateRef.current === 'CONTACT_SOLVING') {
        solveTimerRef.current += delta
        const SOLVE_DURATION = 0.60
        const solveT = Math.min(solveTimerRef.current / SOLVE_DURATION, 1.0)
        currentSolveProgress.current = THREE.MathUtils.lerp(
          solveStartProgressRef.current,
          1.0,
          solveT
        )
        transforms = animatorRef.current.evaluate(currentSolveProgress.current)

        if (solveT >= 1.0) {
          currentSolveProgress.current = 1.0
          climaxStateRef.current = 'SHORT_HOLD'
          holdTimerRef.current = 0
        }
      } else if (climaxStateRef.current === 'SHORT_HOLD') {
        // 2. SHORT_HOLD: Dramatic 0.25s (250ms) hold on 100% fully solved solid uniform cube
        transforms = animatorRef.current.evaluate(1.0)
        holdTimerRef.current += delta
        if (holdTimerRef.current >= 0.25) {
          climaxStateRef.current = 'EXPLODING'
          burstTimerRef.current = 0
        }
      } else if (climaxStateRef.current === 'EXPLODING' || climaxStateRef.current === 'REVEALED') {
        // Burst & face reveal handled below
      } else {
        // Pre-contact sections (Hero, About, Work, and while sliding into Contact):
        // Rubik's cube stays completely intact on the head at targetSolveProgress (e.g. 0.375 or 0.750)
        currentSolveProgress.current = THREE.MathUtils.damp(
          currentSolveProgress.current,
          targetSolveProgress.current,
          10.0,
          delta
        )
        transforms = animatorRef.current.evaluate(currentSolveProgress.current)
      }

      // 3. EXPLODING: 27 pieces burst outward with snappy easeOutCubic impact (0.55s)
      let burstProgress = 0
      if (climaxStateRef.current === 'EXPLODING') {
        burstTimerRef.current += delta
        const BURST_DURATION = 0.55
        burstProgress = Math.min(burstTimerRef.current / BURST_DURATION, 1.0)
        if (burstProgress >= 1.0) {
          climaxStateRef.current = 'REVEALED'
        }
      } else if (climaxStateRef.current === 'REVEALED') {
        burstProgress = 1.0
      }

      if (burstProgress <= 0.0001) {
        if (transforms) {
          for (let i = 0; i < 27; i++) {
            groups[i].position.copy(transforms[i].pos)
            groups[i].quaternion.copy(transforms[i].quat)
            groups[i].scale.setScalar(1.0)
            groups[i].visible = true
          }
        }
      } else {
        // Snappy impact with easeOutCubic: 1 - (1 - t)^3
        const easeBurst = 1 - Math.pow(1 - burstProgress, 3)
        const solvedState = animatorRef.current.states[0]

        for (let i = 0; i < 27; i++) {
          const p0 = solvedState[i].pos
          const q0 = solvedState[i].quat

          // Radial outward vector away from cube center
          const dir = p0.clone().sub(CUBE_CENTER)
          if (dir.lengthSq() < 0.0001) {
            dir.set(0, 0.45, 0.9).normalize()
          } else {
            dir.normalize()
          }

          // Outward distance: up to 1.22 units (pieces fly well clear of the head silhouette)
          const burstDist = easeBurst * 1.22
          const burstPos = p0.clone().addScaledVector(dir, burstDist)
          burstPos.y += easeBurst * 0.06

          // Dispersal tumbling rotation
          const tumbleSpeed = i % 3 === 0 ? 5.2 : i % 3 === 1 ? -4.8 : 6.0
          const tumbleAxis = (
            i % 2 === 0 ? new THREE.Vector3(1, 1, 0) : new THREE.Vector3(0, 1, 1)
          ).normalize()
          const tumbleQuat = new THREE.Quaternion().setFromAxisAngle(
            tumbleAxis,
            easeBurst * tumbleSpeed
          )
          const burstQuat = q0.clone().multiply(tumbleQuat)

          // Pieces clearly visible during initial burst, scaling down smoothly as they clear the face
          let pieceScale = 1.0
          if (burstProgress > 0.25) {
            const fadeT = (burstProgress - 0.25) / 0.75
            pieceScale = Math.max(1.0 - Math.pow(fadeT, 1.4), 0.0)
          }

          groups[i].position.copy(burstPos)
          groups[i].quaternion.copy(burstQuat)
          groups[i].scale.setScalar(pieceScale)
          groups[i].visible = pieceScale > 0.001
        }
      }
    }

    // E. Route-aware rotation targeting & smooth interpolation:
    // When navigating to Contact ("Let's Talk"), smoothly damp to opposite base angle (-0.25 rad) + dragRotationOffset (damping speed: 8).
    // On other pages, smoothly damp to manual drag rotation or INITIAL_YAW (-45°).
    if (characterRef.current) {
      if (isContact) {
        const dragRotationOffset = characterDragRef?.current?.contactDragOffset ?? 0
        const targetRotationY = CONTACT_BASE_ROTATION_Y + dragRotationOffset

        // Smoothly lerp / damp the character's Y rotation to targetRotationY (damping speed: 8)
        characterRef.current.rotation.y = THREE.MathUtils.damp(
          characterRef.current.rotation.y,
          targetRotationY,
          8,
          delta
        )

        // Apply spring-damped velocity pitch & bank tilt (lerps smoothly back to 0 when resting)
        characterRef.current.rotation.x = THREE.MathUtils.damp(
          characterRef.current.rotation.x,
          velocityTiltXRef.current,
          5.0,
          delta
        )
        characterRef.current.rotation.z = THREE.MathUtils.damp(
          characterRef.current.rotation.z,
          velocityTiltZRef.current,
          5.0,
          delta
        )

        currentRotY.current = characterRef.current.rotation.y
      } else {
        const targetDragY = characterDragRef?.current?.targetRotY ?? INITIAL_YAW
        currentRotY.current = THREE.MathUtils.damp(
          currentRotY.current,
          targetDragY,
          8.0, // Smooth damping / inertia: glides gracefully to a stop on release
          delta
        )

        characterRef.current.rotation.y = currentRotY.current
        characterRef.current.rotation.x = THREE.MathUtils.damp(
          characterRef.current.rotation.x,
          velocityTiltXRef.current,
          5.0,
          delta
        )
        characterRef.current.rotation.z = THREE.MathUtils.damp(
          characterRef.current.rotation.z,
          velocityTiltZRef.current,
          5.0,
          delta
        )
      }
    }

    // F. Apply final transformed coordinates to group & character rig
    if (groupRef.current) {
      groupRef.current.position.x = currentPosX.current
      groupRef.current.position.y = currentPosY.current
      groupRef.current.position.z = currentPosZ.current
      groupRef.current.scale.setScalar(currentScale.current)
      groupRef.current.rotation.y = 0
      groupRef.current.rotation.x = 0
      groupRef.current.rotation.z = 0
    }

    // Sync cloned reflection animation mixer & time with active primary mixer
    if (cloneMixerRef.current) {
      cloneMixerRef.current.update(delta)
      if (cloneActionRef.current && currentActionRef.current) {
        cloneActionRef.current.time = currentActionRef.current.time
      }
    }

    // Sync cloned rig rotation with character rig
    if (cloneRigRef.current && characterRef.current) {
      cloneRigRef.current.rotation.y = characterRef.current.rotation.y
      cloneRigRef.current.rotation.x = characterRef.current.rotation.x
      cloneRigRef.current.rotation.z = characterRef.current.rotation.z
    }

  })

  // Floor grounding: soft, natural shadow opacity under sneakers
  const groundedShadowOpacity = isContactSection ? 0.62 : 0.50

  return (
    <group
      ref={groupRef}
      position={[heroPosX, heroPosY, 0]}
      scale={heroScale}
      visible={true}
    >
      {/* 1. Original Character Model */}
      <primitive object={scene} visible={true} />

      {/* 2. Inverted clone reflection (mirrored instance placed right at sneaker contact line) - UNTOUCHED */}
      {cloneScene && (
        <group scale={[1, -1, 1]} position={[0, 0, 0]}>
          <primitive object={cloneScene} />
        </group>
      )}

      {/* 3. Soft Local Ground Contact Shadow mesh locked to Character's local origin (feet level) */}
      {contactShadowTexture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0004, 0]} raycast={null}>
          <planeGeometry args={[0.048, 0.034]} />
          <meshBasicMaterial
            map={contactShadowTexture}
            transparent
            opacity={groundedShadowOpacity}
            depthWrite={false}
            depthTest={true}
          />
        </mesh>
      )}

      {/* 4. Local Ambient Soft Shadow Diffusion */}
      {contactShadowTexture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0002, 0]} raycast={null}>
          <planeGeometry args={[0.088, 0.058]} />
          <meshBasicMaterial
            map={contactShadowTexture}
            transparent
            opacity={groundedShadowOpacity * 0.40}
            depthWrite={false}
            depthTest={true}
          />
        </mesh>
      )}

      {/* 5. Local Floor Reflection Sheen - UNTOUCHED */}
      {floorReflectionTexture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0001, isMobile ? 0.002 : 0.005]} raycast={null}>
          <planeGeometry args={isMobile ? [0.030, 0.022] : [0.04, 0.06]} />
          <meshBasicMaterial
            map={floorReflectionTexture}
            transparent
            opacity={isMobile ? 0.12 : (isContactSection ? 0.35 : 0.20)}
            depthWrite={false}
            depthTest={true}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* 6. Soft Natural Ground Shadow locked to Character's local origin (feet level) */}
      <group scale={1 / heroScale} position={[0, 0.0001, 0]}>
        <ContactShadows
          position={[0, 0.01, 0]}
          scale={2.6}
          blur={2.6}
          far={2}
          opacity={0.46}
          color="#060710"
          raycast={null}
        />
      </group>
    </group>
  )
}

useGLTF.preload(MODEL_PATH, true, true)
