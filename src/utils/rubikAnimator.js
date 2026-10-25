import * as THREE from 'three'

/**
 * Center coordinate of the Rubik's cube in CubeHead_Master local space.
 * Computed from the 3D piece cluster center inside the GLB model.
 */
export const CUBE_CENTER = new THREE.Vector3(-0.002866, -0.000152, 0.000800)

const X_MID = -0.002866
const Y_MID = -0.000152
const Z_MID = 0.000800

/**
 * Mathematically verified solved positions and orientations for all 27 pieces.
 * At these exact coordinates and rotations, all 6 faces of the cube are 100% solid uniform colors:
 * - Front (+Z): Green
 * - Back (-Z): Blue
 * - Left (-X): Orange
 * - Right (+X): Red
 * - Top (+Y): White
 * - Bottom (-Y): Yellow
 */
export const SOLVED_TRANSFORMS = {
  CubePiece_01: { pos: [-0.076396, -0.073692, 0.074331], quat: [0, 0, 1, 0] },
  CubePiece_02: { pos: [-0.076396, -0.000152, 0.074331], quat: [0.707107, 0, 0.707107, 0] },
  CubePiece_03: { pos: [-0.076396, 0.073377, 0.074331], quat: [-0.707107, 0, 0.707107, 0] },
  CubePiece_04: { pos: [-0.076396, -0.073692, 0.0008], quat: [0, 0, 0, 1] },
  CubePiece_05: { pos: [-0.076396, -0.000152, 0.0008], quat: [-0.707107, 0, 0, 0.707107] },
  CubePiece_06: { pos: [-0.076396, 0.073377, 0.0008], quat: [0, -0.707107, 0, 0.707107] },
  CubePiece_07: { pos: [-0.076396, -0.073692, -0.072729], quat: [0, 0, 0, 1] },
  CubePiece_08: { pos: [-0.076396, -0.000152, -0.072729], quat: [0, 0, 0.707107, 0.707107] },
  CubePiece_09: { pos: [-0.076396, 0.073377, -0.072729], quat: [0, 0, 0, 1] },
  CubePiece_10: { pos: [-0.002866, -0.073692, 0.074331], quat: [-0.5, 0.5, 0.5, 0.5] },
  CubePiece_11: { pos: [-0.002866, -0.000152, 0.074331], quat: [0, 0, 0, 1] },
  CubePiece_12: { pos: [-0.002866, 0.073377, 0.074331], quat: [0, -0.707107, 0, 0.707107] },
  CubePiece_13: { pos: [-0.002866, -0.073692, 0.0008], quat: [0, 0.707107, 0, 0.707107] },
  CubePiece_14: { pos: [-0.002866, -0.000152, 0.0008], quat: [0, 0.707107, 0, 0.707107] },
  CubePiece_15: { pos: [-0.002866, 0.073377, 0.0008], quat: [0, 0.707107, 0, 0.707107] },
  CubePiece_16: { pos: [-0.002866, -0.073692, -0.072729], quat: [0.707107, 0.707107, 0, 0] },
  CubePiece_17: { pos: [-0.002866, -0.000152, -0.072729], quat: [0, 0, 0, 1] },
  CubePiece_18: { pos: [-0.002866, 0.073377, -0.072729], quat: [0, -0.707107, 0, 0.707107] },
  CubePiece_19: { pos: [0.070664, -0.073692, 0.074331], quat: [1, 0, 0, 0] },
  CubePiece_20: { pos: [0.070664, -0.000152, 0.074331], quat: [0, 0, 0, 1] },
  CubePiece_21: { pos: [0.070664, 0.073377, 0.074331], quat: [0, 0.707107, 0.707107, 0] },
  CubePiece_22: { pos: [0.070664, -0.073692, 0.0008], quat: [0, 0.707107, 0, 0.707107] },
  CubePiece_23: { pos: [0.070664, -0.000152, 0.0008], quat: [-0.707107, 0, 0, 0.707107] },
  CubePiece_24: { pos: [0.070664, 0.073377, 0.0008], quat: [0, 0, 0.707107, 0.707107] },
  CubePiece_25: { pos: [0.070664, -0.073692, -0.072729], quat: [0.707107, -0.707107, 0, 0] },
  CubePiece_26: { pos: [0.070664, -0.000152, -0.072729], quat: [-0.5, 0.5, 0.5, -0.5] },
  CubePiece_27: { pos: [0.070664, 0.073377, -0.072729], quat: [-0.707107, 0, 0.707107, 0] },
}

/**
 * 8 High-Visibility Front-Facing Rubik's Cube Layer Rotations.
 * Strictly front-visible layers directly facing the camera (Front 'F', Top 'U', Right 'R', Left 'L').
 * ZERO hidden back/bottom moves.
 *
 * Sequence of moves (forward from Solved State 0 -> Scrambled State 8):
 * - Move 0: 'U' (+90°) Top layer twist (Contact final click to 100% solved)
 * - Move 1: 'R' (+90°) Right column twist (Contact lead-in twist)
 * - Move 2: 'F' (+90°) Front face twist (Transit About -> Work)
 * - Move 3: 'L' (+90°) Left column twist (Transit About -> Work)
 * - Move 4: 'R' (+90°) Right column twist (Transit About -> Work)
 * - Move 5: 'L' (+90°) Left column twist (Transit Hero -> About)
 * - Move 6: 'R' (+90°) Right column twist (Transit Hero -> About)
 * - Move 7: 'U' (+90°) Top layer twist (Transit Hero -> About)
 */
const CUBE_MOVES = [
  { name: 'U', axis: 'y', cond: (p) => p.y - Y_MID > 0.03, angle: Math.PI / 2 },
  { name: 'R', axis: 'x', cond: (p) => p.x - X_MID > 0.03, angle: Math.PI / 2 },
  { name: 'F', axis: 'z', cond: (p) => p.z - Z_MID > 0.03, angle: Math.PI / 2 },
  { name: 'L', axis: 'x', cond: (p) => p.x - X_MID < -0.03, angle: Math.PI / 2 },
  { name: 'R', axis: 'x', cond: (p) => p.x - X_MID > 0.03, angle: Math.PI / 2 },
  { name: 'L', axis: 'x', cond: (p) => p.x - X_MID < -0.03, angle: Math.PI / 2 },
  { name: 'R', axis: 'x', cond: (p) => p.x - X_MID > 0.03, angle: Math.PI / 2 },
  { name: 'U', axis: 'y', cond: (p) => p.y - Y_MID > 0.03, angle: Math.PI / 2 },
]

/**
 * Deterministic Rubik's Cube Animator.
 *
 * Guarantees:
 * - Progress = 0.0: Initial scrambled state (vibrant mix of colors on all 6 faces).
 * - Intermediate progress: Predictable, deterministic Rubik's cube layer rotations.
 * - Progress = 1.0: 100% genuine solved state (all 6 faces solid uniform colors).
 * - Zero random rotations or arbitrary math.
 */
export class RubikAnimator {
  constructor() {
    this.moves = CUBE_MOVES
    this.states = []

    // State 0: Genuine solved state
    let curr = []
    for (let i = 1; i <= 27; i++) {
      const pad = String(i).padStart(2, '0')
      const d = SOLVED_TRANSFORMS[`CubePiece_${pad}`]
      curr.push({
        pos: new THREE.Vector3(...d.pos),
        quat: new THREE.Quaternion(...d.quat),
      })
    }
    this.states.push(curr)

    // Precalculate scrambled states S[1] to S[5] by applying the 5 genuine layer moves forward
    for (let m = 0; m < this.moves.length; m++) {
      const move = this.moves[m]
      const next = curr.map((c) => ({ pos: c.pos.clone(), quat: c.quat.clone() }))
      const axisVec =
        move.axis === 'x'
          ? new THREE.Vector3(1, 0, 0)
          : move.axis === 'y'
          ? new THREE.Vector3(0, 1, 0)
          : new THREE.Vector3(0, 0, 1)
      const q = new THREE.Quaternion().setFromAxisAngle(axisVec, move.angle)
      const moving = []

      curr.forEach((c, idx) => {
        if (move.cond(c.pos)) {
          moving.push(idx)
          const rel = c.pos.clone().sub(CUBE_CENTER)
          rel.applyQuaternion(q)
          next[idx].pos.copy(rel.add(CUBE_CENTER))
          next[idx].quat.premultiply(q)
        }
      })

      move.movingIndices = moving
      curr = next
      this.states.push(curr)
    }
  }

  /**
   * Evaluate transforms at solve progress `progress` (0 = scrambled, 1 = fully solved).
   * Returns array of 27 { pos: Vector3, quat: Quaternion } corresponding to CubePiece_01..CubePiece_27.
   */
  evaluate(progress) {
    if (progress >= 1.0) {
      return this.states[0] // 100% solved configuration
    }
    if (progress <= 0) {
      return this.states[this.moves.length] // Scrambled configuration
    }

    const p = Math.max(0, Math.min(1, progress))
    const N = this.moves.length
    const solveT = p * N
    const stepIdx = Math.min(Math.floor(solveT), N - 1)
    const localT = solveT - stepIdx

    // Snappy mechanical easing (power2.inOut with magnetic lock)
    const easedT =
      localT < 0.5 ? 2 * localT * localT : 1 - Math.pow(-2 * localT + 2, 2) / 2

    // Move being undone in this interval
    const moveIndex = N - 1 - stepIdx
    const move = this.moves[moveIndex]
    const stateStart = this.states[moveIndex + 1]

    const axisVec =
      move.axis === 'x'
        ? new THREE.Vector3(1, 0, 0)
        : move.axis === 'y'
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(0, 0, 1)

    // Undo rotation for this specific layer
    const undoQ = new THREE.Quaternion().setFromAxisAngle(axisVec, -move.angle * easedT)

    const result = []
    for (let i = 0; i < 27; i++) {
      if (move.movingIndices.includes(i)) {
        const pRel = stateStart[i].pos.clone().sub(CUBE_CENTER)
        pRel.applyQuaternion(undoQ)
        const pos = pRel.add(CUBE_CENTER)
        const quat = stateStart[i].quat.clone().premultiply(undoQ)
        result.push({ pos, quat })
      } else {
        result.push({ pos: stateStart[i].pos, quat: stateStart[i].quat })
      }
    }

    return result
  }
}
