import React from 'react'
import { MeshReflectorMaterial } from '@react-three/drei'
import { useMediaQuery } from '../hooks/useMediaQuery'

/**
 * Ground Reflector Material Component
 * Implements steep vertical falloff for mobile reflection:
 * - Aggressively fades reflection height on mobile screens (max-width: 768px)
 * - Restricts visible reflection to shoes and subtle lower legs trace
 * - Suppresses torso and upper jacket reflections from spilling onto floor
 */
export function GroundReflectorMaterial(props) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <MeshReflectorMaterial
      blur={[isMobile ? 256 : 512, 100]}
      resolution={isMobile ? 256 : 512}
      mixBlur={1}
      mixStrength={isMobile ? 0.1 : 0.6}
      roughness={1}
      depthScale={isMobile ? 0.4 : 1.4}
      minDepthThreshold={isMobile ? 0.35 : 0.8}
      maxDepthThreshold={isMobile ? 0.4 : 1.2}
      color="#0e0e15"
      metalness={0.5}
      {...props}
    />
  )
}

export default GroundReflectorMaterial
