/**
 * Portfolio Data Re-export & Universal Presentation Registry
 * Enables importing from either portfolioData.js or projectsData.js
 */
export * from './projectsData'
export {
  PROJECTS_DATA as portfolioData,
  allProjects,
  existingManualProjects,
  loadUniversalPresentationFolders,
  parseUniversalProjectFolder,
  extractSlideNumberFromFilename,
  isExistingProjectFolder,
  checkIsVideo,
  cleanAssetUrl,
  isSlidePath,
  scanProjectSubfolders,
  formatSectionLabel,
  parseProjectSections,
} from './projectsData'
export { default } from './projectsData'
