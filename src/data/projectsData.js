/**
 * Dynamic Portfolio Projects Data Layer
 * Automatically parses, sorts, and maps numbered project folders from public/projects/
 * to the Work grid and preview modal, keeping Behance explicitly at the end.
 */
import scannedFolders from './scannedProjectFolders.json'

/**
 * Robust URL cleaner helper (Vite public directory rule)
 * Strips redundant workspace prefixes ('github/', 'public/'), ensures leading slash,
 * decodes any pre-encoded URI characters to avoid %2520 double-encoding,
 * and cleanly encodeURI() to safely handle spaces, dashes, and special characters.
 */
export const cleanAssetUrl = (rawPath) => {
  if (!rawPath || typeof rawPath !== 'string') return ''

  let clean = rawPath.trim()
  // Strip redundant workspace prefixes
  clean = clean.replace(/^(?:\.\/)?github\//i, '')
  clean = clean.replace(/^(?:\.\/)?public\//i, '')

  // Ensure leading slash
  if (!clean.startsWith('/') && !clean.startsWith('http')) {
    clean = '/' + clean
  }

  // Prevent double-encoding (%20 -> %2520) by decoding first if pre-encoded
  try {
    clean = decodeURI(clean)
  } catch (e) {
    // fallback if malformed sequence
  }

  // Encode URI to safely handle spaces, dashes, and special characters like '&'
  return encodeURI(clean).replace(/#/g, '%23')
}

/**
 * Title Cleaning Helper
 * Strips leading digits/delimiters, converts underscores/dashes, handles apostrophes,
 * and formats clean human-readable project titles.
 * Examples:
 * - "01_Echo_Culture_Festival" => "Echo Culture Festival"
 * - "02-McDonalds-Accessible-Packaging" => "McDonalds Accessible Packaging"
 * - "01 Volvo - Never Made an Impact (self-initiated)" => "Volvo - Never Made an Impact (self-initiated)"
 * - "06 Motilal Oswal - Not a Child_s Play" => "Motilal Oswal - Not a Child's Play"
 */
export function cleanProjectTitle(folderName) {
  if (!folderName) return ''

  // 1. Strip leading digits and initial separators (e.g. "01_", "02 - ", "03 ")
  const match = folderName.match(/^(\d+)[\s_-]*(.+)$/)
  const rawTitle = match ? match[2] : folderName

  let title = rawTitle

  // 2. Fix underscores representing apostrophes (e.g. Child_s => Child's)
  title = title.replace(/([a-zA-Z])_s\b/g, "$1's")

  // 3. If title has no spaces, hyphens and underscores were used as word delimiters
  if (!title.includes(' ')) {
    title = title.replace(/[_-]+/g, ' ')
  } else {
    // Title already has spaces: convert underscores to spaces, normalize spaced dashes " - "
    title = title.replace(/_+/g, ' ')
    title = title.replace(/\s+-\s+/g, ' - ')
  }

  // 4. Collapse consecutive spaces and trim
  title = title.replace(/\s+/g, ' ').trim()

  return title
}

/**
 * Curated metadata dictionary for known client / personal projects.
 * Enriches dynamically scanned folders with categories, roles, and creative summaries.
 * Any new folder added to public/projects/ without an entry here will use smart defaults.
 */
const PROJECT_METADATA_MAP = {
  volvo: {
    category: 'Brand & Industrial Design',
    year: '2024',
    role: 'Industrial Designer & Art Director',
    tools: ['Industrial Design', 'Visual Systems', 'Key Visuals', 'Craft'],
    accentColor: '#004af2',
    summary:
      'Self-initiated exploration translating Volvo’s iconic automotive safety heritage into playful domestic furniture objects engineered to cushion and protect.',
    description:
      'A series of conceptual home interior pieces (swing, teapoy, clothes rack, punching dummy, bin, lamp) designed with crash-test aesthetics and impact-absorbing materials.',
  },
  mcdonalds: {
    category: 'Packaging & Systems',
    year: '2023',
    role: 'Lead Packaging Designer & System Architect',
    tools: ['Structural Packaging', 'Universal Design', 'Typography', 'Sustainable Materials'],
    accentColor: '#ffbc0d',
    hasPdf: false,
    pdfUrl: null,
    summary:
      'Universal packaging system engineered for tactile accessibility, sensory clarity, and mass production sustainability across global high-volume franchises.',
    description:
      'Rethinking consumer packaging ergonomics with tactile debossing, high-contrast iconography, and zero-plastic folding mechanics for global scalability.',
  },
  volkswagen: {
    category: 'Digital Experience & 3D',
    year: '2023',
    role: 'Creative Technologist & Art Director',
    tools: ['WebGL', 'Interaction Design', '3D Simulation', 'Art Direction'],
    accentColor: '#001e50',
    summary:
      'Real-time interactive experiential simulator demonstrating collision avoidance, pedestrian detection, and autonomous emergency braking in extreme conditions.',
    description:
      'An engaging digital experience translating complex automotive safety telemetry into intuitive, hands-on interactive scenarios.',
  },
  samsung: {
    category: 'Digital Product & UI/UX',
    year: '2024',
    role: 'Lead UI/UX & Visual Designer',
    tools: ['Digital Product', 'UI/UX Architecture', 'Fintech', 'Design System'],
    accentColor: '#1428a0',
    summary:
      'Next-generation digital wallet experience streamlining credit cards, transit passes, biometric security, and contactless mobile commerce.',
    description:
      'Unified fintech mobile architecture providing instant access to payment credentials, boarding tickets, and digital keys with frictionless visual ergonomics.',
  },
  eaaa: {
    category: 'Brand Identity & Film',
    year: '2024',
    role: 'Creative Director & Film Director',
    tools: ['Film Direction', 'Brand Identity', 'Cinematography', 'Editorial'],
    accentColor: '#0d5c3a',
    summary:
      'Corporate manifesto film and comprehensive branding system framing sustainable alternative investment strategies for institutional stewards.',
    description:
      'Full corporate visual identity accompanied by a cinematic manifesto film that communicates stewardship, forward-looking responsibility, and ethical asset allocation.',
  },
  motilal: {
    category: 'Campaign & Film Direction',
    year: '2023',
    role: 'Creative Director / Campaign Lead',
    tools: ['Creative Direction', 'Film Campaign', 'Key Visuals', 'Storytelling'],
    accentColor: '#e65100',
    summary:
      'High-energy cinematic campaign contrasting amateur risk-taking with disciplined financial mastery through distinct high-octane personas.',
    description:
      'Multi-platform creative campaign starring character personas (the surgeon, pilot, F1 driver, barber, hibachi chef) to illustrate that financial growth is not child’s play.',
  },
  amazon: {
    id: 'amazon-project',
    title: 'AMAZON PRIME - GOLD DIGGER',
    cleanTitle: 'Amazon Prime - Gold Digger',
    category: 'Campaign & Pitch Presentation',
    year: '2024',
    role: 'Creative Director / Pitch Lead',
    tools: ['Campaign Strategy', 'Presentation Design', 'Pitch Deck', 'Key Visuals'],
    accentColor: '#00a8e1',
    thumbnailClass: 'aspect-video object-cover',
    isPresentationDeck: true,
    aspectRatio: '16/9',
    summary:
      'PowerPoint pitch presentation deck and visual campaign direction for Amazon Prime Video - Gold Digger.',
    description:
      'Comprehensive 68-slide pitch presentation deck featuring narrative strategy, visual concepts, character breakdowns, and multi-channel campaign rollouts.',
    pptxDownloadUrl: null,
  },
  xoom: {
    id: 'hero-xoom',
    title: 'HERO XOOM',
    cleanTitle: 'Hero XOOM',
    category: 'Campaign & Strategy Presentation',
    year: '2024',
    role: 'Creative Director / Presentation Lead',
    tools: ['Campaign Strategy', 'Presentation Design', 'Pitch Deck', 'Key Visuals'],
    accentColor: '#ff2d55',
    thumbnailClass: 'aspect-video object-cover',
    isPresentation: true,
    isPresentationDeck: true,
    aspectRatio: '16/9',
    summary:
      'Multi-folder presentation deck and campaign pitch strategy for Hero XOOM.',
    description:
      'Comprehensive 24-slide presentation deck covering campaign concepts, gameplay mechanics, and creative execution rollouts for Hero XOOM.',
  },
  xtreme: {
    id: 'hero-xtreme',
    title: 'HERO XTREME',
    cleanTitle: 'Hero Xtreme',
    category: 'Brand Campaign & Key Visuals',
    year: '2024',
    role: 'Creative Director / Lead Designer',
    tools: ['Campaign Direction', 'Key Visuals', 'Concept Design', 'Visual Systems'],
    accentColor: '#d8ff00',
    summary:
      'High-impact campaign key visuals and visual strategy showcase for Hero Xtreme.',
    description:
      'Dynamic key visual series and creative visual strategy developed for Hero Xtreme commute and performance launch.',
  },
  behance: {
    category: 'Creative Portfolio & Archive',
    year: '2024',
    role: 'Creative Director / Lead Designer',
    tools: ['Creative Direction', 'Visual Systems', 'Packaging', 'Editorial'],
    accentColor: '#0057ff',
    thumbnail: '/projects/behance/Behance-Thumbnail.webp',
    heroMedia: '/projects/behance/Behance-Thumbnail.webp',
    summary:
      'Direct portal to the primary Behance portfolio archive featuring full case studies, process sketches, client work, and selected creative experiments.',
    description:
      'Curated showcase of multidisciplinary design systems, high-impact brand identities, bespoke packaging craft, and global campaign direction.',
  },
}

/**
 * Dedicated Behance Portfolio showcase item.
 * Always maintained as the final item in the portfolio collection.
 */
export const BEHANCE_PROJECT = {
  id: 'behance-portfolio',
  order: 9999,
  number: '07',
  title: 'BEHANCE PORTFOLIO',
  cleanTitle: 'Behance Portfolio',
  category: 'Creative Portfolio & Archive',
  year: '2024',
  description:
    'Curated showcase of multidisciplinary design systems, high-impact brand identities, bespoke packaging craft, and global campaign direction.',
  role: 'Creative Director / Lead Designer',
  tools: ['Creative Direction', 'Visual Systems', 'Packaging', 'Editorial'],
  isBehance: true,
  projectUrl: 'https://www.behance.net/umeshpawar',
  behanceUrl: 'https://www.behance.net/umeshpawar',
  behanceEmbedUrl: 'https://www.behance.net/embed/project/216335191?ilo0=1',
  accentColor: '#ff5722',
  thumbnail: '/projects/behance/Behance-Thumbnail.webp',
  heroMedia: '/projects/behance/Behance-Thumbnail.webp',
  gallery: [],
  assets: [],
  media: [],
  slides: [],
  sections: [],
  hasPdf: false,
  pdfUrl: null,
  pdfFiles: [],
  summary:
    'Direct portal to the primary Behance portfolio archive featuring full case studies, process sketches, client work, and selected creative experiments.',
}

/**
 * Ensure Concept Board is strictly at index 0 for the EAAA project
 */
export const sortEaaaAssets = (assetsList) => {
  const conceptBoard = assetsList.filter((file) => {
    const name = typeof file === 'string' ? file : (file?.url || file?.src || '')
    return name.toLowerCase().includes('concept') || name.toLowerCase().includes('board')
  })
  const remainingAssets = assetsList.filter((file) => {
    const name = typeof file === 'string' ? file : (file?.url || file?.src || '')
    return !name.toLowerCase().includes('concept') && !name.toLowerCase().includes('board')
  })
  return [...conceptBoard, ...remainingAssets]
}

/**
 * Ensure Concept Board is strictly at index 0 for the Amazon project,
 * followed sequentially by all 16:9 presentation slides.
 */
export const sortAmazonAssets = (assetsList) => {
  const conceptBoard = assetsList.filter((file) => {
    const name = typeof file === 'string' ? file : (file?.url || file?.src || '')
    return name.toLowerCase().includes('concept') || name.toLowerCase().includes('board')
  })
  const remainingAssets = assetsList.filter((file) => {
    const name = typeof file === 'string' ? file : (file?.url || file?.src || '')
    return !name.toLowerCase().includes('concept') && !name.toLowerCase().includes('board')
  }).sort((a, b) => {
    const strA = typeof a === 'string' ? a : (a?.url || a?.src || '')
    const strB = typeof b === 'string' ? b : (b?.url || b?.src || '')
    return strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' })
  })
  return [...conceptBoard, ...remainingAssets]
}

/**
 * Known existing project identifier keywords.
 * Any project folder matching these keys will strictly use existing manual project parsing.
 */
export const EXISTING_PROJECT_KEYS = [
  'volvo',
  'mcdonalds',
  'volkswagen',
  'samsung',
  'eaaa',
  'motilal',
  'amazon',
  'nandghar',
  'xoom',
  'xtreme',
  'behance',
]

export function isExistingProjectFolder(folderName) {
  if (!folderName) return false
  const lower = folderName.toLowerCase()
  return EXISTING_PROJECT_KEYS.some((key) => lower.includes(key))
}

/**
 * Check if a filename/URL is a video format (.mp4, .webm, .mov)
 */
export function checkIsVideo(filename) {
  if (typeof filename !== 'string') return false
  const clean = filename.toLowerCase().split('?')[0].split('#')[0]
  return clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.mov')
}

/**
 * Extracts a slide number integer from filenames such as:
 * "slide-05.gif", "slide_5.mp4", "slide05.png", "05.gif", etc.
 */
export function extractSlideNumberFromFilename(filename) {
  if (!filename) return null
  const baseName = filename.split('/').pop().replace(/\.[^/.]+$/, '')
  // Match "slide-05", "slide_5", "slide 5", "slide5"
  const matchSlide = baseName.match(/slide[-_\s]*(\d+)/i)
  if (matchSlide) {
    return parseInt(matchSlide[1], 10)
  }
  // Match leading or standalone digits like "05" or "05-anim"
  const matchNum = baseName.match(/^(\d+)/) || baseName.match(/(\d+)/)
  if (matchNum) {
    return parseInt(matchNum[1], 10)
  }
  return null
}

/**
 * Universal Subfolder Slide-Deck Parser
 * Scans all project files and accurately groups slide decks and standard media.
 * Regex matches any folder path containing 'slide' or 'slides' with optional number prefix (e.g. "02 Slides", "02_Slides", "slides").
 */
export const scanProjectSubfolders = (projectFolder, allFiles) => {
  // Regex to match any folder path containing 'slide' or 'slides' with optional number prefix
  const slideFolderRegex = /(?:^|\/)(?:(\d+)[\s_-]*)?slides?(?:[\s_-]|\/|$)/i

  // Group files by slide deck folder
  const slideDecks = {}
  const standardMedia = []

  ;(allFiles || []).forEach((file) => {
    // Media overlay assets (e.g. media/Slides_03.gif) should not be grouped into a slide deck
    if (file.toLowerCase().includes('media/') && /slide/i.test(file)) {
      return
    }

    const match = file.match(slideFolderRegex)
    if (match) {
      const folderKey = match[0].replace(/^\/+|\/+$/g, '').trim() || 'slides'
      const orderPrefix = match[1] ? parseInt(match[1], 10) : 99
      if (!slideDecks[folderKey]) {
        slideDecks[folderKey] = {
          id: folderKey,
          order: orderPrefix,
          slides: [],
        }
      }
      if (/\.(webp|jpg|jpeg|png)$/i.test(file)) {
        slideDecks[folderKey].slides.push(file)
      }
    } else if (/\.(webp|jpg|jpeg|png|gif|mp4|webm|mov)$/i.test(file)) {
      // Standard asset outside slide folder
      standardMedia.push(file)
    }
  })

  // Filter out any slide deck with 0 image slides
  const cleanDecks = Object.values(slideDecks).filter((d) => d.slides.length > 0)

  // Sort slides inside each deck numerically
  cleanDecks.forEach((deck) => {
    deck.slides.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
  });

  // Sort decks by orderPrefix
  cleanDecks.sort((a, b) => a.order - b.order)

  return { slideDecks: cleanDecks, standardMedia }
}

/**
 * Detects whether a path belongs to a presentation slide or slide deck folder.
 * Accurately recognizes prefix-numbered folders (e.g. "02 Slides", "01_slides", "03-slides", "slides", "deck", "ppt")
 * as well as slide filename patterns (e.g. "Slide 01", "01_slide", "slide-01", etc.).
 */
export function isSlidePath(f) {
  if (!f || typeof f !== 'string') return false
  if (f.toLowerCase().includes('media/') && /slide/i.test(f)) return false
  const slideFolderRegex = /(?:^|\/)(?:(\d+)[\s_-]*)?slides?(?:[\s_-]|\/|$)/i
  if (slideFolderRegex.test(f)) return true
  const parts = f.split('/')
  if (parts.length > 1) {
    const subfolder = parts[0].toLowerCase()
    // Matches "slides", "02 slides", "01_slides", "02-slides", "deck", "presentation", "ppt", etc.
    if (/(?:^|\b)(?:\d+[\s_-]*)?(?:slides?|presentation|decks?|ppt)(?:[\s_-]|\b|$)/i.test(subfolder)) {
      return true
    }
  }
  const filename = parts[parts.length - 1].toLowerCase()
  return (
    /slides?[\/_\-\s.]|slide[-_\s]*\d+/i.test(filename) ||
    /(?:\d+[\s_-]*)?slides?(?:[-_\s.]|\b|$)/i.test(filename) ||
    /slide/i.test(filename)
  )
}

/**
 * Numbered Category & Section Pipeline Helper
 * Formats folder name into a high-contrast uppercase category label
 * (e.g. "01 Print ad" -> "PRINT AD", "04 Pitch deck" -> "PITCH DECK")
 */
export function formatSectionLabel(folderName) {
  if (!folderName) return ''
  // 1. Strip leading digits and initial separators (e.g. "01 ", "01-", "01_", "01 - ")
  let stripped = folderName.replace(/^\d+[\s_-]*/, '').trim()
  // 2. Strictly filter out/suppress "concept board" (case-insensitive)
  stripped = stripped.replace(/concept[\s_-]*board/gi, '').trim()
  return stripped
    .replace(/:/g, ' / ')
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

/**
 * Universal Numbered Category & Section Parser
 * Inspects all files in a project, detects numbered subfolders (e.g. 01 Print ad, 02 Film, 04 Pitch deck),
 * orders them strictly by leading digits, and categorizes into:
 * 1. Regular Media Folders (images/videos)
 * 2. Slide & Presentation Folders (decks)
 */
export function parseProjectSections(folderName, allFiles = []) {
  if (!allFiles || allFiles.length === 0) return []

  const subfolderMap = new Map()
  const rootFiles = []

  allFiles.forEach((file) => {
    if (file.startsWith('.') || file.toLowerCase().includes('dossier')) return
    const parts = file.split('/')
    if (parts.length > 1) {
      const topDir = parts[0]
      if (!subfolderMap.has(topDir)) subfolderMap.set(topDir, [])
      subfolderMap.get(topDir).push(file)
    } else {
      rootFiles.push(file)
    }
  })

  // Only activate section pipeline if project has numbered subfolders
  const hasNumberedSubfolders = Array.from(subfolderMap.keys()).some((k) => /^\d+/.test(k))
  if (!hasNumberedSubfolders) return []

  const sections = []
  let globalItemIndex = 0

  // 1. Group root files (e.g. "01 Tata_concept_Board.webp", "01 ConcepT-board.webp")
  if (rootFiles.length > 0) {
    const rootByNum = new Map()
    const unnumbered = []

    rootFiles.forEach((f) => {
      const match = f.match(/^(\d+)[\s_-]*/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (!rootByNum.has(num)) rootByNum.set(num, [])
        rootByNum.get(num).push(f)
      } else {
        unnumbered.push(f)
      }
    })

    if (rootByNum.size > 0) {
      rootByNum.forEach((files, num) => {
        const isConcept = files.some((f) => /concept|board/i.test(f))
        const firstBase = files[0].replace(/\.[^/.]+$/, '')
        const stripped = firstBase
          .replace(/^\d+[\s_-]*/, '')
          .replace(/concept[\s_-]*board/gi, '')
          .replace(/_+/g, ' ')
          .trim()
        const rawTitle = formatSectionLabel(stripped)
        const isConceptBoard = isConcept || /concept[\s_-]*board/i.test(firstBase) || /concept[\s_-]*board/i.test(rawTitle)
        // If concept board or empty, set title to '' so badge is omitted completely
        const title = isConceptBoard ? '' : (rawTitle || 'KEY VISUALS')

        const items = files.map((f, idx) => {
          const url = cleanAssetUrl(`/projects/${folderName}/${f}`)
          const isVid = checkIsVideo(f)
          const isPdf = /\.pdf$/i.test(f)
          return {
            type: isVid ? 'video' : isPdf ? 'pdf' : 'image',
            id: `root-${num}-item-${idx + 1}`,
            globalIndex: globalItemIndex++,
            src: url,
            thumbnail: url,
            title: `${cleanProjectTitle(folderName)} — Visual ${idx + 1}`,
            cleanTitle: `Visual ${idx + 1}`,
            badge: isVid ? 'WATCH VIDEO ▶' : isPdf ? 'VIEW PDF ⤢' : 'VIEW IMAGE ⤢',
            badgeIcon: isVid ? '▶' : '⤢',
            aspectRatio: null,
            caption: `${cleanProjectTitle(folderName)} production visual.`,
          }
        })

        sections.push({
          id: `section-root-${num}`,
          order: num,
          rawName: `Root ${num}`,
          title,
          isPresentation: false,
          items,
          files,
        })
      })
    }

    if (unnumbered.length > 0) {
      const isConcept = unnumbered.some((f) => /concept|board/i.test(f))
      const items = unnumbered.map((f, idx) => {
        const url = cleanAssetUrl(`/projects/${folderName}/${f}`)
        const isVid = checkIsVideo(f)
        const isPdf = /\.pdf$/i.test(f)
        return {
          type: isVid ? 'video' : isPdf ? 'pdf' : 'image',
          id: `root-extra-item-${idx + 1}`,
          globalIndex: globalItemIndex++,
          src: url,
          thumbnail: url,
          title: `${cleanProjectTitle(folderName)} — Asset ${idx + 1}`,
          cleanTitle: `Asset ${idx + 1}`,
          badge: isVid ? 'WATCH VIDEO ▶' : isPdf ? 'VIEW PDF ⤢' : 'VIEW IMAGE ⤢',
          badgeIcon: isVid ? '▶' : '⤢',
          aspectRatio: null,
          caption: `${cleanProjectTitle(folderName)} asset.`,
        }
      })

      sections.push({
        id: 'section-root-extra',
        order: isConcept ? 1 : 99,
        rawName: 'Root',
        title: isConcept ? '' : 'KEY VISUALS',
        isPresentation: false,
        items,
        files: unnumbered,
      })
    }
  }

  // 2. Process numbered subfolders
  subfolderMap.forEach((files, subfolderName) => {
    const match = subfolderName.match(/^(\d+)[\s_-]*(.*)$/)
    const order = match ? parseInt(match[1], 10) : 99
    const title = formatSectionLabel(subfolderName)

    // Detect if this folder is a Presentation / Slide Deck
    const hasSlideKeyword = /deck|pitch|slide|presentation|ppt/i.test(subfolderName)
    const hasInternalSlideFolder = files.some((f) => {
      const parts = f.split('/')
      return parts.length > 2 && /slide|deck/i.test(parts[1])
    })
    const slideFiles = files.filter((f) => isSlidePath(f) || (hasSlideKeyword && /\.(webp|jpe?g|png)$/i.test(f)))
    const isPresentation = hasSlideKeyword || hasInternalSlideFolder || (slideFiles.length >= 3)

    if (isPresentation) {
      const sortedSlides = [...slideFiles].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
      )
      const slideUrls = sortedSlides.map((f) => cleanAssetUrl(`/projects/${folderName}/${f}`))

      sections.push({
        id: `section-${order}-${subfolderName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        order,
        rawName: subfolderName,
        title: title || 'PRESENTATION DECK',
        isPresentation: true,
        slides: slideUrls,
        slideCount: slideUrls.length,
        thumbnail: slideUrls[0] || null,
        files,
      })
    } else {
      const mediaFiles = files
        .filter((f) => /\.(webp|jpe?g|png|gif|mp4|webm|mov|pdf)$/i.test(f))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

      const items = mediaFiles.map((f, idx) => {
        const url = cleanAssetUrl(`/projects/${folderName}/${f}`)
        const isVid = checkIsVideo(f)
        const isPdf = /\.pdf$/i.test(f)
        const isConcept = /concept|board/i.test(f)
        const baseName = f.split('/').pop().replace(/\.[^/.]+$/, '')
        const cleanName = baseName
          .replace(/^\d+[\s_-]*/, '')
          .replace(/concept[\s_-]*board/gi, '')
          .replace(/_+/g, ' ')
          .trim()

        return {
          type: isVid ? 'video' : isPdf ? 'pdf' : 'image',
          id: `sec-${order}-item-${idx + 1}`,
          globalIndex: globalItemIndex++,
          src: url,
          thumbnail: url,
          title: `${cleanProjectTitle(folderName)} — ${cleanName || `Asset ${idx + 1}`}`,
          cleanTitle: cleanName || `Asset ${idx + 1}`,
          badge: isVid ? 'WATCH VIDEO ▶' : isPdf ? 'VIEW PDF ⤢' : 'VIEW IMAGE ⤢',
          badgeIcon: isVid ? '▶' : '⤢',
          aspectRatio: isConcept ? '16/9' : null,
          caption: `${cleanProjectTitle(folderName)} — ${title || 'Production Visual'}`,
        }
      })

      sections.push({
        id: `section-${order}-${subfolderName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        order,
        rawName: subfolderName,
        title: /concept[\s_-]*board/i.test(title) ? '' : (title || 'MEDIA'),
        isPresentation: false,
        items,
        files: mediaFiles,
      })
    }
  })

  // Sort sections strictly by leading digits
  sections.sort((a, b) => a.order - b.order)
  return sections
}

/**
 * Parses existing manual project folders (Amazon, Hero XOOM, EAAA, Behance, Volvo, etc.)
 * Exactly preserves 100% of their existing logic, concept boards, multi-deck structures, and metadata.
 */
export function parseExistingProjectFolders(folders = scannedFolders) {
  const existingFolders = (folders || []).filter((item) =>
    isExistingProjectFolder(item.folder)
  )

  const parsedProjects = existingFolders
    .map((item) => {
      // 1. Extract leading number for strict sequential sorting
      const match = item.folder.match(/^(\d+)[\s_-]*(.+)$/)
      const order = match ? parseInt(match[1], 10) : 999
      const cleanTitle = cleanProjectTitle(item.folder)

      // 2. Sort media files naturally (filtering out any dossier entries)
      let sortedMedia = [...(item.media || [])]
        .filter((file) => !file.toLowerCase().includes('dossier'))
        .sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
        )

      // Ensure Concept Board is strictly at index 0 for EAAA and Amazon projects
      if (item.folder.toLowerCase().includes('eaaa')) {
        sortedMedia = sortEaaaAssets(sortedMedia)
      } else if (item.folder.toLowerCase().includes('amazon')) {
        sortedMedia = sortAmazonAssets(sortedMedia)
      }

      // 3. Build encoded asset URLs (safely normalized via cleanAssetUrl)
      let assets = sortedMedia.map(
        (file) => cleanAssetUrl(`/projects/${item.folder}/${file}`)
      )

      if (item.folder.toLowerCase().includes('eaaa')) {
        assets = sortEaaaAssets(assets)
      } else if (item.folder.toLowerCase().includes('amazon')) {
        assets = sortAmazonAssets(assets)
      }

      // Separate videos and images
      const videoAsset = assets.find((a) => /\.(mp4|webm|mov)$/i.test(a))
      const imageAssets = assets.filter((a) => /\.(jpe?g|png|webp|gif|svg)$/i.test(a))

      // Thumbnail is first image, or first asset
      let thumbnail = imageAssets[0] || assets[0] || null

      // Match custom metadata by folder name or clean title
      const folderKey = item.folder.toLowerCase()
      let metadata = null
      for (const [key, meta] of Object.entries(PROJECT_METADATA_MAP)) {
        if (folderKey.includes(key)) {
          metadata = meta
          break
        }
      }

      // Default smart metadata if not present in custom map
      const finalCategory = metadata?.category || 'Creative Direction & Design'
      const finalYear = metadata?.year || '2024'
      const finalRole = metadata?.role || 'Lead Designer & Art Director'
      const finalTools = metadata?.tools || ['Creative Direction', 'Visual Design']
      const finalAccent = metadata?.accentColor || '#d8ff00'
      const finalSummary =
        metadata?.summary ||
        `Curated case study and production assets for ${cleanTitle}.`
      const finalDescription =
        metadata?.description ||
        `High-impact creative project featuring comprehensive visual systems, assets, and design execution.`

      // PDF handling
      const rawMediaList = Array.isArray(item.media) ? item.media : []
      const pdfFiles = rawMediaList.filter((f) => /\.pdf$/i.test(f))
      const hasPdf = metadata?.hasPdf !== undefined ? Boolean(metadata.hasPdf) : (pdfFiles.length > 0)
      const pdfUrl = metadata?.pdfUrl || (pdfFiles.length > 0 ? cleanAssetUrl(`/projects/${item.folder}/${pdfFiles[0]}`) : null)

      // Automatic Presentation / PPT Deck Detection & Future Rule:
      let isPresentation =
        Boolean(metadata?.isPresentation) ||
        Boolean(metadata?.isPresentationDeck) ||
        /slide|ppt|deck/i.test(item.folder) ||
        sortedMedia.some((f) => isSlidePath(f))

      const isAmazon = item.folder.toLowerCase().includes('amazon')
      const isXoom = item.folder.toLowerCase().includes('xoom')
      const isXtreme = item.folder.toLowerCase().includes('xtreme')
      let previewAssets = assets
      let fullPresentationSlides = []
      let presentationSlides = []
      let pptThumbnail = null
      let presentationDecks = []
      let modalItems = null

      if (isXoom) {
        // Enforce the exact 4-step sequence for Hero XOOM:
        // 1. Concept Board: Xoom Games (Single 16:9 widescreen card, opens in lightbox)
        // 2. Presentation Deck: Xoom Games PPT (16:9 thumbnail, 1-click opens fullscreen vertical scrollable slides)
        // 3. Concept Board: Xoom Fix (Single 16:9 widescreen card, opens in lightbox)
        // 4. Presentation Deck: Xoom Fix PPT (16:9 thumbnail, 1-click opens fullscreen vertical scrollable slides)

        const gamesConceptFile = sortedMedia.find(
          (f) => /games/i.test(f) && (/concept/i.test(f) || /board/i.test(f))
        ) || sortedMedia.find(
          (f) => /games/i.test(f) && /\.(jpe?g|png|webp)$/i.test(f) && !/slide/i.test(f)
        )

        const gamesSlideFiles = sortedMedia
          .filter((f) => /games/i.test(f) && /slide/i.test(f))
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

        const fixConceptFile = sortedMedia.find(
          (f) => /fix/i.test(f) && (/concept/i.test(f) || /board/i.test(f))
        ) || sortedMedia.find(
          (f) => /fix/i.test(f) && /\.(jpe?g|png|webp)$/i.test(f) && !/slide/i.test(f)
        )

        const fixSlideFiles = sortedMedia
          .filter((f) => /fix/i.test(f) && /slide/i.test(f))
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

        const gamesConceptUrl = gamesConceptFile
          ? cleanAssetUrl(`/projects/${item.folder}/${gamesConceptFile}`)
          : null
        const gamesSlideUrls = gamesSlideFiles.map(
          (f) => cleanAssetUrl(`/projects/${item.folder}/${f}`)
        )
        const fixConceptUrl = fixConceptFile
          ? cleanAssetUrl(`/projects/${item.folder}/${fixConceptFile}`)
          : null
        const fixSlideUrls = fixSlideFiles.map(
          (f) => cleanAssetUrl(`/projects/${item.folder}/${f}`)
        )

        const gamesDeck = {
          id: 'deck-xoom-games',
          subfolder: 'Hero Xoom Games',
          title: 'Hero XOOM — Xoom Games',
          cleanTitle: 'Xoom Games',
          thumbnail: gamesSlideUrls[0] || null,
          slides: gamesSlideUrls,
          slideCount: gamesSlideUrls.length,
        }

        const fixDeck = {
          id: 'deck-xoom-fix',
          subfolder: 'Hero Xoom Fix',
          title: 'Hero XOOM — Xoom Fix',
          cleanTitle: 'Xoom Fix',
          thumbnail: fixSlideUrls[0] || null,
          slides: fixSlideUrls,
          slideCount: fixSlideUrls.length,
        }

        presentationDecks = [gamesDeck, fixDeck]

        const xoomModalItems = [
          gamesConceptUrl && {
            type: 'image',
            id: 'hero-xoom-games-concept',
            stepNumber: 1,
            title: 'Hero XOOM — Xoom Games',
            cleanTitle: 'Xoom Games',
            label: 'Xoom Games',
            badge: 'VIEW IMAGE • XOOM GAMES',
            badgeIcon: '⤢',
            src: gamesConceptUrl,
            thumbnail: gamesConceptUrl,
            aspectRatio: '16/9',
            caption: 'Hero XOOM Games — Visual Strategy',
          },
          gamesSlideUrls.length > 0 && {
            type: 'ppt',
            id: 'hero-xoom-games-deck',
            stepNumber: 2,
            title: 'Hero XOOM — Presentation Deck: Xoom Games',
            cleanTitle: 'Xoom Games PPT',
            label: `Presentation Deck: Xoom Games (${gamesSlideUrls.length} Slides)`,
            badge: `VIEW PRESENTATION DECK • XOOM GAMES (${gamesSlideUrls.length} SLIDES)`,
            badgeIcon: '▶',
            thumbnail: gamesSlideUrls[0],
            src: gamesSlideUrls[0],
            slides: gamesSlideUrls,
            slideCount: gamesSlideUrls.length,
            caption: `${gamesSlideUrls.length} Widescreen Presentation Slides`,
          },
          fixConceptUrl && {
            type: 'image',
            id: 'hero-xoom-fix-concept',
            stepNumber: 3,
            title: 'Hero XOOM — Xoom Fix',
            cleanTitle: 'Xoom Fix',
            label: 'Xoom Fix',
            badge: 'VIEW IMAGE • XOOM FIX',
            badgeIcon: '⤢',
            src: fixConceptUrl,
            thumbnail: fixConceptUrl,
            aspectRatio: '16/9',
            caption: 'Hero XOOM Fix — Visual Strategy',
          },
          fixSlideUrls.length > 0 && {
            type: 'ppt',
            id: 'hero-xoom-fix-deck',
            stepNumber: 4,
            title: 'Hero XOOM — Presentation Deck: Xoom Fix',
            cleanTitle: 'Xoom Fix PPT',
            label: `Presentation Deck: Xoom Fix (${fixSlideUrls.length} Slides)`,
            badge: `VIEW PRESENTATION DECK • XOOM FIX (${fixSlideUrls.length} SLIDES)`,
            badgeIcon: '▶',
            thumbnail: fixSlideUrls[0],
            src: fixSlideUrls[0],
            slides: fixSlideUrls,
            slideCount: fixSlideUrls.length,
            caption: `${fixSlideUrls.length} Widescreen Presentation Slides`,
          },
        ].filter(Boolean)

        modalItems = xoomModalItems
        previewAssets = xoomModalItems.map((item) => item.thumbnail || item.src)
        assets = xoomModalItems.map((item) => item.src || item.thumbnail)
        thumbnail = gamesConceptUrl || gamesSlideUrls[0] || assets[0]
        fullPresentationSlides = [...gamesSlideUrls, ...fixSlideUrls]
        pptThumbnail = gamesSlideUrls[0] || null
      } else if (isXtreme) {
        // Universal subfolder slide parser for Hero Xtreme ("02 Slides", concept board, visuals)
        const { slideDecks, standardMedia: xtremeStandard } = scanProjectSubfolders(
          item.folder,
          sortedMedia
        )

        const xtremeImages = xtremeStandard
          .filter((f) => /\.(webp|jpe?g|png|svg|gif)$/i.test(f))
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

        const xtremeAssetUrls = xtremeImages.map(
          (f) => cleanAssetUrl(`/projects/${item.folder}/${f}`)
        )

        const primaryDeck = slideDecks[0]
        const xtremeSlideFiles = primaryDeck ? primaryDeck.slides : sortedMedia.filter((f) => isSlidePath(f))
        const xtremeSlideUrls = xtremeSlideFiles.map(
          (f) => cleanAssetUrl(`/projects/${item.folder}/${f}`)
        )

        fullPresentationSlides = xtremeSlideUrls
        presentationSlides = xtremeSlideUrls
        pptThumbnail = xtremeSlideUrls[0] || null

        if (xtremeSlideUrls.length > 0) {
          const subfolderName = primaryDeck?.id || '02 Slides'
          const cleanSubTitle =
            subfolderName.replace(/^\d+[\s_-]*/, '').replace(/^hero\s*xtreme\s*/i, '').trim() || 'Slides'
          presentationDecks = [
            {
              id: 'deck-xtreme-slides',
              subfolder: subfolderName,
              title: `Hero Xtreme — ${cleanSubTitle}`,
              cleanTitle: cleanSubTitle,
              thumbnail: xtremeSlideUrls[0],
              slides: xtremeSlideUrls,
              slideCount: xtremeSlideUrls.length,
            },
          ]
        }

        // Build structured modalItems strictly in numbered order:
        // 01 Hero_Xtreme_Concept_Board.webp (order 1)
        // 02 Slides (order 2) -> PPT Deck
        // 03 Hero Xtreme KV_1-01.webp (order 3)
        // 04 Hero Xtreme KV_1-02.webp (order 4)
        // 05 Hero Xtreme KV_1-03.webp (order 5)
        const xtremeModalItems = []

        xtremeImages.forEach((f) => {
          const numMatch = f.match(/^(\d+)[\s_-]*/)
          const order = numMatch ? parseInt(numMatch[1], 10) : 99
          const url = cleanAssetUrl(`/projects/${item.folder}/${f}`)
          const isConcept = /concept|board/i.test(f)
          const baseName = f.replace(/\.[^/.]+$/, '')
          const cleanTitle =
            baseName.replace(/^\d+[\s_-]*/, '').replace(/^hero\s*xtreme\s*/i, '').replace(/concept[\s_-]*board/gi, '').trim() ||
            'Visual'

          xtremeModalItems.push({
            type: 'image',
            id: `xtreme-item-${order}-${cleanTitle.toLowerCase().replace(/\s+/g, '-')}`,
            order,
            title: `Hero Xtreme — ${cleanTitle}`,
            cleanTitle,
            label: cleanTitle,
            badge: 'VIEW IMAGE ⤢',
            badgeIcon: '⤢',
            src: url,
            thumbnail: url,
            aspectRatio: isConcept ? '16/9' : null,
            caption: `Hero Xtreme visual asset.`,
          })
        })

        if (xtremeSlideUrls.length > 0) {
          const deckOrder = primaryDeck?.order || 2
          xtremeModalItems.push({
            type: 'ppt',
            id: 'hero-xtreme-slides-deck',
            order: deckOrder,
            title: 'Hero Xtreme — Presentation Deck',
            cleanTitle: 'Presentation Deck',
            label: `Presentation Deck: Slides (${xtremeSlideUrls.length} Slides)`,
            badge: `VIEW PRESENTATION DECK (${xtremeSlideUrls.length} SLIDES)`,
            badgeIcon: '▶',
            thumbnail: xtremeSlideUrls[0],
            src: xtremeSlideUrls[0],
            slides: xtremeSlideUrls,
            slideCount: xtremeSlideUrls.length,
            caption: `${xtremeSlideUrls.length} Widescreen Presentation Slides`,
          })
        }

        xtremeModalItems.sort((a, b) => a.order - b.order)
        modalItems = xtremeModalItems
        assets = xtremeModalItems.map((i) => i.src || i.thumbnail)
        previewAssets = xtremeModalItems.map((i) => i.thumbnail || i.src)
        thumbnail = xtremeModalItems[0]?.thumbnail || xtremeAssetUrls[0] || null
        isPresentation = false
      } else if (isPresentation) {
        // Concept board file if present (e.g. Amazon)
        const conceptFile = sortedMedia.find(
          (f) => f.toLowerCase().includes('concept') || f.toLowerCase().includes('board')
        )
        const conceptBoardUrl = conceptFile
          ? cleanAssetUrl(`/projects/${item.folder}/${conceptFile}`)
          : null

        // Check for multiple distinct slide subfolders
        const subfolderNames = [
          ...new Set(
            sortedMedia
              .filter((f) => f.includes('/'))
              .map((f) => f.split('/')[0])
          ),
        ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

        if (subfolderNames.length > 1) {
          presentationDecks = subfolderNames.map((subfolder, sIdx) => {
            const deckFiles = sortedMedia
              .filter((f) => f.startsWith(`${subfolder}/`) && isSlidePath(f))
              .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

            const deckSlides = deckFiles.map(
              (f) => cleanAssetUrl(`/projects/${item.folder}/${f}`)
            )

            const cleanSubTitle = subfolder.replace(/^Hero\s*Xoom\s*/i, '').replace(/^Hero\s*Xtreme\s*/i, '').trim() || subfolder
            const deckTitle = `${cleanTitle} - ${cleanSubTitle}`

            return {
              id: `deck-${sIdx + 1}`,
              subfolder,
              title: deckTitle,
              cleanTitle: cleanSubTitle,
              thumbnail: deckSlides[0] || null,
              slides: deckSlides,
              slideCount: deckSlides.length,
            }
          })
        }

        // All slide files sorted naturally (numeric sensitivity)
        const slideFiles = sortedMedia
          .filter((f) => {
            if (conceptFile && f === conceptFile) return false
            return isSlidePath(f)
          })
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

        fullPresentationSlides = slideFiles.map(
          (f) => cleanAssetUrl(`/projects/${item.folder}/${f}`)
        )

        // First slide serves as the clean 16:9 presentation thumbnail
        pptThumbnail = fullPresentationSlides[0] || assets[0] || null

        if (isAmazon) {
          modalItems = [
            conceptBoardUrl && {
              type: 'image',
              id: 'amazon-concept-board',
              stepNumber: 1,
              title: 'Amazon Prime - Gold Digger — Key Visual',
              cleanTitle: 'Key Visual',
              label: 'Key Visual',
              badge: 'VIEW IMAGE ⤢',
              badgeIcon: '⤢',
              src: conceptBoardUrl,
              thumbnail: conceptBoardUrl,
              aspectRatio: '16/9',
              caption: 'Amazon Prime Video - Gold Digger — Pitch Strategy',
            },
            fullPresentationSlides.length > 0 && {
              type: 'ppt',
              id: 'amazon-pitch-deck',
              stepNumber: 2,
              title: 'Amazon Prime - Gold Digger — Pitch Presentation Deck',
              cleanTitle: 'Pitch Deck',
              label: `Presentation Deck (${fullPresentationSlides.length} Slides)`,
              badge: `VIEW PRESENTATION DECK (${fullPresentationSlides.length} SLIDES)`,
              badgeIcon: '▶',
              thumbnail: pptThumbnail,
              src: pptThumbnail,
              slides: fullPresentationSlides,
              slideCount: fullPresentationSlides.length,
              caption: `${fullPresentationSlides.length} Widescreen Pitch Presentation Slides`,
            },
          ].filter(Boolean)

          previewAssets = modalItems.map((i) => i.thumbnail || i.src)
          assets = modalItems.map((i) => i.src || i.thumbnail)
          thumbnail = conceptBoardUrl || pptThumbnail
        } else if (presentationDecks.length > 1) {
          previewAssets = presentationDecks.map((d) => d.thumbnail)
          thumbnail = previewAssets[0]
          assets = previewAssets
        } else if (conceptFile) {
          previewAssets = [conceptBoardUrl, pptThumbnail]
          thumbnail = conceptBoardUrl
          assets = previewAssets
        } else {
          previewAssets = [pptThumbnail]
          thumbnail = pptThumbnail
          assets = previewAssets
        }
      }

      // Numbered Category & Section Pipeline
      const projectSections = !isAmazon ? parseProjectSections(item.folder, sortedMedia) : []
      let finalModalItems = modalItems
      let allSectionSlides = presentationSlides.length > 0 ? presentationSlides : fullPresentationSlides

      if (projectSections.length > 0 && (!modalItems || modalItems.length === 0)) {
        const structuredItems = []
        const gatheredSlides = []
        let gIdx = 0
        projectSections.forEach((sec) => {
          if (sec.isPresentation) {
            if (sec.slides && sec.slides.length > 0) {
              gatheredSlides.push(...sec.slides)
              structuredItems.push({
                type: 'ppt',
                id: sec.id,
                globalIndex: gIdx++,
                order: sec.order,
                title: `${cleanTitle} — ${sec.title}`,
                cleanTitle: sec.title,
                label: `${sec.title} (${sec.slideCount} Slides)`,
                badge: `VIEW PRESENTATION DECK • ${sec.title} (${sec.slideCount} SLIDES)`,
                badgeIcon: '▶',
                thumbnail: sec.thumbnail,
                src: sec.thumbnail,
                slides: sec.slides,
                slideCount: sec.slideCount,
                caption: `${sec.slideCount} Presentation Slides`,
              })
            }
          } else if (Array.isArray(sec.items)) {
            sec.items.forEach((item) => {
              item.globalIndex = gIdx++
              structuredItems.push(item)
            })
          }
        })
        if (structuredItems.length > 0) {
          finalModalItems = structuredItems
        }
        if (gatheredSlides.length > 0) {
          allSectionSlides = gatheredSlides
        }
      }

      return {
        id: metadata?.id || item.folder
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
        order,
        number: String(order).padStart(2, '0'),
        title: metadata?.title || cleanTitle.toUpperCase(),
        cleanTitle: metadata?.cleanTitle || cleanTitle,
        folder: item.folder,
        folderPath: cleanAssetUrl(`/projects/${item.folder}`),
        thumbnail,
        heroMedia: thumbnail,
        thumbnailClass: metadata?.thumbnailClass || (isPresentation ? 'aspect-video object-cover' : ''),
        isPresentation: isPresentation,
        isPresentationDeck: isPresentation,
        aspectRatio: metadata?.aspectRatio || (isPresentation ? '16/9' : null),
        gallery: assets.length > 1 ? assets.slice(1) : [],
        assets,
        previewAssets,
        sections: projectSections.length > 0 ? projectSections : [],
        modalItems: finalModalItems,
        presentationDecks: presentationDecks.length > 0 ? presentationDecks : undefined,
        presentationSlides: allSectionSlides,
        fullPresentationSlides: allSectionSlides,
        slides: allSectionSlides || [],
        pptThumbnail,
        allAssets: isPresentation ? (previewAssets.length > 1 ? [previewAssets[0], ...allSectionSlides] : allSectionSlides) : assets,
        videoUrl: videoAsset || null,
        category: finalCategory,
        year: finalYear,
        role: finalRole,
        tools: finalTools,
        accentColor: finalAccent,
        summary: finalSummary,
        description: finalDescription,
        hasPdf: Boolean(hasPdf),
        pdfUrl: pdfUrl || null,
        pdfFiles: (pdfFiles || []).map((f) => cleanAssetUrl(`/projects/${item.folder}/${f}`)),
        media: assets || [],
        pptxDownloadUrl: metadata?.pptxDownloadUrl || null,
      }
    })
    .sort((a, b) => a.order - b.order)

  return parsedProjects
}

/**
 * Universal Project Folder Parser.
 * Scans the entire project folder (both root and subfolders like slides/, media/, etc.)
 * for ALL standard web media formats (.jpg, .jpeg, .png, .webp, .svg, .mp4, .webm, .mov, .gif).
 *
 * Categorizes assets into:
 * 1. Presentation Decks (slides/): sequential 16:9 slides with matching media/ overlays.
 * 2. Standard Project Assets (general images & videos): root or non-slides assets mapped to
 *    Behance-style adaptive preview grid (16:9, 1:1, 4:5) and fullscreen lightbox view with navigation arrows.
 */
export const parseUniversalProjectFolder = (folderName, rawFiles = [], orderIndex = 11) => {
  const isMediaOverlay = (f) => f.toLowerCase().includes('media/') && /slide/i.test(f)
  const isVideo = (f) => checkIsVideo(f)
  const isPdf = (f) => /\.pdf$/i.test(f)
  const isImage = (f) => /\.(jpe?g|png|webp|gif|svg)$/i.test(f)

  // 1. Group presentation decks using scanProjectSubfolders
  const { slideDecks, standardMedia } = scanProjectSubfolders(folderName, rawFiles)
  const mediaOverlayFiles = (rawFiles || []).filter(isMediaOverlay)
  const pdfFiles = (rawFiles || []).filter(isPdf)

  const presentationDecks = []
  slideDecks.forEach((deck, sIdx) => {
    const deckSlideUrls = deck.slides.map(
      (f) => cleanAssetUrl(`/projects/${folderName}/${f}`)
    )
    let cleanSubTitle = deck.id
      .replace(/^hero\s*xoom\s*/i, '')
      .replace(/^hero\s*xtreme\s*/i, '')
      .replace(/^\d+[\s_-]*/, '')
      .trim() || deck.id

    const isGenericSlides = /^slides?$/i.test(cleanSubTitle)
    const deckTitle = isGenericSlides
      ? `${cleanProjectTitle(folderName)} — Presentation Deck`
      : `${cleanProjectTitle(folderName)} — ${cleanSubTitle}`

    presentationDecks.push({
      id: `deck-${sIdx + 1}`,
      order: deck.order,
      subfolder: deck.id,
      title: deckTitle,
      cleanTitle: isGenericSlides ? 'Presentation Deck' : cleanSubTitle,
      thumbnail: deckSlideUrls[0] || null,
      slides: deckSlideUrls,
      slideCount: deckSlideUrls.length,
    })
  })

  // 2. Standalone media (non-slides, non-media-overlay)
  // Sort images so Concept Boards are strictly first
  const imageFiles = standardMedia
    .filter(isImage)
    .sort((a, b) => {
      const aIsConcept = /concept|board/i.test(a)
      const bIsConcept = /concept|board/i.test(b)
      if (aIsConcept && !bIsConcept) return -1
      if (!aIsConcept && bIsConcept) return 1
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    })

  const videoFiles = standardMedia
    .filter(isVideo)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

  const hasSlides = presentationDecks.length > 0
  const hasGeneralAssets = imageFiles.length > 0 || videoFiles.length > 0
  const hasPdf = pdfFiles.length > 0

  const generalAssetUrls = [...imageFiles, ...videoFiles].map(
    (f) => cleanAssetUrl(`/projects/${folderName}/${f}`)
  )
  const pdfUrls = pdfFiles.map(
    (f) => cleanAssetUrl(`/projects/${folderName}/${f}`)
  )

  const allSlideUrls = presentationDecks.flatMap((d) => d.slides)

  // 3. Build structured modalItems combining standalone media (concept boards, videos, PDFs) and presentation decks
  const modalItems = []

  // Add images
  imageFiles.forEach((f, idx) => {
    const numMatch = f.match(/^(\d+)[\s_-]*/)
    const order = numMatch ? parseInt(numMatch[1], 10) : (idx + 1)
    const url = cleanAssetUrl(`/projects/${folderName}/${f}`)
    const isConcept = /concept|board/i.test(f)
    modalItems.push({
      type: 'image',
      id: `asset-img-${idx + 1}`,
      order,
      title: `${cleanProjectTitle(folderName)} — Visual ${String(idx + 1).padStart(2, '0')}`,
      cleanTitle: `Image ${idx + 1}`,
      label: `Image ${idx + 1}`,
      badge: 'VIEW IMAGE ⤢',
      badgeIcon: '⤢',
      src: url,
      thumbnail: url,
      aspectRatio: isConcept ? '16/9' : null,
      caption: `${cleanProjectTitle(folderName)} production visual.`,
    })
  })

  // Add videos
  videoFiles.forEach((f, idx) => {
    const numMatch = f.match(/^(\d+)[\s_-]*/)
    const order = numMatch ? parseInt(numMatch[1], 10) : (idx + 1)
    const url = cleanAssetUrl(`/projects/${folderName}/${f}`)
    modalItems.push({
      type: 'video',
      id: `asset-vid-${idx + 1}`,
      order,
      title: `${cleanProjectTitle(folderName)} — Video ${String(idx + 1).padStart(2, '0')}`,
      cleanTitle: `Video ${idx + 1}`,
      label: `Video ${idx + 1}`,
      badge: 'WATCH VIDEO ▶',
      badgeIcon: '▶',
      src: url,
      thumbnail: url,
      caption: `${cleanProjectTitle(folderName)} motion asset.`,
    })
  })

  // Add PDFs
  pdfFiles.forEach((f, idx) => {
    const url = cleanAssetUrl(`/projects/${folderName}/${f}`)
    modalItems.push({
      type: 'pdf',
      id: `asset-pdf-${idx + 1}`,
      order: 98,
      title: `${cleanProjectTitle(folderName)} — Verified Document`,
      cleanTitle: 'PDF Document',
      label: 'PDF Document',
      badge: 'VIEW PDF DOCUMENT ⤢',
      badgeIcon: '📄',
      src: url,
      pdfUrl: url,
      thumbnail: null,
      caption: 'Full high-resolution PDF document viewer.',
    })
  })

  // Add presentation decks
  presentationDecks.forEach((deck, dIdx) => {
    modalItems.push({
      type: 'ppt',
      id: deck.id || `deck-${dIdx + 1}`,
      order: deck.order || 99,
      title: deck.title,
      cleanTitle: deck.cleanTitle,
      label: `Presentation Deck: ${deck.cleanTitle} (${deck.slideCount} Slides)`,
      badge: `VIEW PRESENTATION DECK • ${deck.cleanTitle.toUpperCase()} (${deck.slideCount} SLIDES)`,
      badgeIcon: '▶',
      thumbnail: deck.thumbnail,
      src: deck.thumbnail,
      slides: deck.slides,
      slideCount: deck.slideCount,
      caption: `${deck.slideCount} Widescreen Presentation Slides`,
    })
  })

  // Sort modalItems strictly by order
  modalItems.sort((a, b) => (a.order || 99) - (b.order || 99))

  // Structured presentation slides formatted with slideNumber, baseJpeg, and overlay media
  const structuredPresentationSlides = allSlideUrls.map((slideUrl, index) => {
    const slideNum = index + 1
    const slideNumStr = String(slideNum).padStart(2, '0')
    const matchingMedia = mediaOverlayFiles.filter((m) => {
      const extractedNum = extractSlideNumberFromFilename(m)
      if (extractedNum !== null) return extractedNum === slideNum
      return m.includes(slideNumStr) || m.includes(`slide-${slideNum}`) || m.includes(`slide_${slideNum}`)
    })

    return {
      slideNumber: slideNum,
      baseJpeg: slideUrl,
      baseImage: slideUrl,
      backgroundColor: '#0d0d12',
      elements: matchingMedia.map((m, mIdx) => {
        const isVid = checkIsVideo(m)
        const mediaUrl = cleanAssetUrl(`/projects/${folderName}/${m}`)
        return {
          id: `elem-${slideNum}-${mIdx + 1}`,
          type: isVid ? 'video' : 'gif',
          src: mediaUrl,
          filename: m.split('/').pop(),
          isVideo: isVid,
          x: 0,
          y: 0,
          w: 100,
          h: 100,
          zIndex: 15,
          objectFit: 'contain',
        }
      }),
      media: matchingMedia.map((m) => ({
        src: cleanAssetUrl(`/projects/${folderName}/${m}`),
        isVideo: checkIsVideo(m),
      })),
    }
  })

  // Thumbnail selection
  const thumbnail =
    modalItems.find((i) => i.type === 'image')?.thumbnail ||
    modalItems.find((i) => i.type === 'ppt')?.thumbnail ||
    generalAssetUrls[0] ||
    allSlideUrls[0] ||
    null

  const match = folderName.match(/^(\d+)[\s_-]*(.+)$/)
  const order = match ? parseInt(match[1], 10) : orderIndex
  const cleanTitle = cleanProjectTitle(folderName)

  // Numbered Category & Section Pipeline
  const projectSections = parseProjectSections(folderName, rawFiles)
  let finalModalItems = modalItems
  let allSectionSlides = allSlideUrls

  if (projectSections.length > 0) {
    const structuredItems = []
    const gatheredSlides = []
    let gIdx = 0
    projectSections.forEach((sec) => {
      if (sec.isPresentation) {
        if (sec.slides && sec.slides.length > 0) {
          gatheredSlides.push(...sec.slides)
          structuredItems.push({
            type: 'ppt',
            id: sec.id,
            globalIndex: gIdx++,
            order: sec.order,
            title: `${cleanTitle} — ${sec.title}`,
            cleanTitle: sec.title,
            label: `${sec.title} (${sec.slideCount} Slides)`,
            badge: `VIEW PRESENTATION DECK • ${sec.title} (${sec.slideCount} SLIDES)`,
            badgeIcon: '▶',
            thumbnail: sec.thumbnail,
            src: sec.thumbnail,
            slides: sec.slides,
            slideCount: sec.slideCount,
            caption: `${sec.slideCount} Presentation Slides`,
          })
        }
      } else if (Array.isArray(sec.items)) {
        sec.items.forEach((item) => {
          item.globalIndex = gIdx++
          structuredItems.push(item)
        })
      }
    })
    if (structuredItems.length > 0) {
      finalModalItems = structuredItems
    }
    if (gatheredSlides.length > 0) {
      allSectionSlides = gatheredSlides
    }
  }

  return {
    id: folderName.toLowerCase().replace(/\s+/g, '-'),
    order,
    number: String(order).padStart(2, '0'),
    title: cleanTitle.toUpperCase(),
    cleanTitle,
    folder: folderName,
    folderPath: cleanAssetUrl(`/projects/${folderName}`),
    isUniversal: true,
    isUniversalPresentation: hasSlides,
    hasSlides,
    hasGeneralAssets,
    hasPdf: Boolean(hasPdf),
    pdfUrl: pdfUrls[0] || null,
    pdfFiles: pdfUrls,
    sections: projectSections.length > 0 ? projectSections : [],
    modalItems: finalModalItems,
    thumbnail,
    heroMedia: thumbnail,
    thumbnailClass: hasSlides ? 'aspect-video object-cover' : '',
    isPresentation: hasSlides,
    isPresentationDeck: hasSlides,
    aspectRatio: hasSlides ? '16/9' : null,
    presentationDecks: presentationDecks.length > 0 ? presentationDecks : undefined,
    presentationSlides: structuredPresentationSlides.length > 0 ? structuredPresentationSlides : allSectionSlides,
    structuredPresentationSlides,
    slideMeta: structuredPresentationSlides,
    fullPresentationSlides: allSectionSlides,
    slides: structuredPresentationSlides.length > 0 ? structuredPresentationSlides : (allSectionSlides || []),
    pptThumbnail: presentationDecks[0]?.thumbnail || allSectionSlides[0] || null,
    assets: finalModalItems.length > 0 ? finalModalItems.map((i) => i.src || i.thumbnail) : generalAssetUrls,
    previewAssets: finalModalItems.length > 0 ? finalModalItems.map((i) => i.thumbnail || i.src) : generalAssetUrls,
    media: finalModalItems.length > 0 ? finalModalItems.map((i) => i.src || i.thumbnail) : generalAssetUrls,
    generalAssets: generalAssetUrls,
    gallery: generalAssetUrls.length > 1 ? generalAssetUrls.slice(1) : [],
    allAssets: [...generalAssetUrls, ...allSectionSlides, ...pdfUrls],
    category: hasSlides ? 'Presentation Deck & Campaign' : 'Design & Visual Systems',
    year: new Date().getFullYear().toString(),
    role: 'Creative Director / Lead Designer',
    tools: hasSlides
      ? ['Presentation Design', 'Key Visuals', 'Campaign Direction']
      : ['Visual Systems', 'Art Direction', 'Design Execution'],
    accentColor: '#d8ff00',
    summary: hasSlides
      ? `Presentation pitch deck for ${cleanTitle} featuring ${allSlideUrls.length} widescreen slides${hasGeneralAssets ? ` and ${generalAssetUrls.length} production assets` : ''}.`
      : `Curated showcase and production assets for ${cleanTitle}.`,
    description: hasSlides
      ? `Comprehensive presentation pitch deck for ${cleanTitle} with interactive widescreen slides.`
      : `High-impact creative project featuring comprehensive visual systems, assets, and design execution.`,
    pptxDownloadUrl: null,
  }
}

/**
 * Universal Auto-Loader for future projects (runs safely without affecting existing projects).
 * Discovers any future project folders in public/projects/ that are not existing manual projects,
 * whether they contain slides/ decks, general images & videos, or both.
 */
export const loadUniversalPresentationFolders = (folders = scannedFolders) => {
  const discoveredProjects = []

  const futureFolders = (folders || []).filter((item) => {
    if (!item?.folder) return false
    if (isExistingProjectFolder(item.folder)) return false
    return (item.media || []).length > 0
  })

  for (let i = 0; i < futureFolders.length; i++) {
    const item = futureFolders[i]
    const proj = parseUniversalProjectFolder(item.folder, item.media, 11 + i)
    if (proj && (proj.hasSlides || proj.hasGeneralAssets || proj.hasPdf)) {
      discoveredProjects.push(proj)
    }
  }

  return discoveredProjects
}

// 1. Existing manual projects (Amazon, Hero XOOM, EAAA, Behance untouched!)
export const existingManualProjects = parseExistingProjectFolders(
  (scannedFolders || []).filter((item) => isExistingProjectFolder(item.folder))
)

// 2. Auto-loads any new future folders
export const futureUniversalProjects = loadUniversalPresentationFolders(scannedFolders)

// Merge safely with existing projects (existing projects retain 100% of their custom code)
export function parseProjectFolders(folders = scannedFolders) {
  const existingFolders = (folders || []).filter((item) =>
    isExistingProjectFolder(item.folder)
  )
  const existingProjects = parseExistingProjectFolders(existingFolders)
  const universalProjects = loadUniversalPresentationFolders(folders)

  // Separate non-Behance existing projects and Behance
  const nonBehanceExisting = existingProjects.filter(
    (p) => !p.title.toLowerCase().includes('behance') && !p.id.toLowerCase().includes('behance')
  )
  const behanceExisting = existingProjects.find(
    (p) => p.title.toLowerCase().includes('behance') || p.id.toLowerCase().includes('behance')
  )

  const combined = [...nonBehanceExisting, ...universalProjects].sort(
    (a, b) => a.order - b.order
  )

  const finalBehance =
    behanceExisting ||
    (folders.some((f) => f.folder.toLowerCase().includes('behance'))
      ? {
          ...BEHANCE_PROJECT,
          id: 'behance-portfolio',
          isBehance: true,
          title: 'BEHANCE PORTFOLIO',
          cleanTitle: 'Behance Portfolio',
          thumbnail: '/projects/behance/Behance-Thumbnail.webp',
          heroMedia: '/projects/behance/Behance-Thumbnail.webp',
        }
      : BEHANCE_PROJECT)

  // Ensure consecutive numbering for Behance
  finalBehance.number = String(combined.length + 1).padStart(2, '0')

  return [...combined, finalBehance]
}

// Merge safely with existing projects (existing projects retain 100% of their custom code)
export const allProjects = parseProjectFolders(scannedFolders)

// Export scanned project folders raw array
export const projectFolders = scannedFolders

// Primary sorted and mapped portfolio items list
export const finalPortfolioList = allProjects

// Main export used across WorkUI and ProjectPreview
export const PROJECTS_DATA = allProjects
export default PROJECTS_DATA

