import React from 'react'
import ProjectPreview, {
  SafeProjectGallery,
  BehanceShowcaseModal,
  getAssetUrl,
  checkIsVideo,
  cleanAssetUrl,
  UniversalProjectPreviewContent,
  AdaptiveModalGridItem,
  InteractiveSlideDeckViewer,
  scanProjectSubfolders,
  formatSectionLabel,
  parseProjectSections,
} from './ProjectPreview'

export const PreviewVideo = ({
  src,
  assetUrl,
  className = '',
  style = {},
  onLoadedMetadata,
  ...props
}) => {
  const url = src || assetUrl
  return (
    <video
      src={cleanAssetUrl(url)}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      controls={false}
      className={`w-full h-full object-contain pointer-events-none ${className}`}
      style={style}
      onLoadedMetadata={(e) => {
        e.currentTarget.play().catch(() => {})
        onLoadedMetadata?.(e)
      }}
      {...props}
    />
  )
}

export const renderProjectPreviewContent = (project, options) => (
  <UniversalProjectPreviewContent project={project} {...options} />
)

export {
  SafeProjectGallery,
  BehanceShowcaseModal,
  getAssetUrl,
  checkIsVideo,
  cleanAssetUrl,
  UniversalProjectPreviewContent,
  AdaptiveModalGridItem,
  InteractiveSlideDeckViewer,
  scanProjectSubfolders,
  formatSectionLabel,
  parseProjectSections,
}
export default ProjectPreview
