import React from 'react'

/**
 * TransformBoundingBox Component
 * Reusable Photoshop Free Transform (Cmd+T) Bounding Box.
 * Features:
 * - 1px solid #d8ff00 outline border.
 * - 8 square anchor points/nodes (4 corners + 4 midpoints).
 * - Each anchor handle is 5px square, white fill with a 1px solid black border.
 * - Supports active state (always visible) and hover trigger state via .has-transform-box parent.
 */
export default function TransformBoundingBox({ active = false, className = '' }) {
  return (
    <span
      className={`transform-bounding-box ${active ? 'active' : ''} ${className}`}
      aria-hidden="true"
    >
      <span className="tb-handle nw" />
      <span className="tb-handle n" />
      <span className="tb-handle ne" />
      <span className="tb-handle e" />
      <span className="tb-handle se" />
      <span className="tb-handle s" />
      <span className="tb-handle sw" />
      <span className="tb-handle w" />
    </span>
  )
}
