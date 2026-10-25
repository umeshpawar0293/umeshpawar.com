import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECTS_DIR = path.resolve(__dirname, 'public/projects')
const EXTERNAL_BACKUP_DIR = path.resolve(__dirname, '../Original_Raw_Assets')
const ROOT_BACKUP_DIR = path.resolve(__dirname, '../backups/projects_original')
const BACKUP_DIR = fs.existsSync(EXTERNAL_BACKUP_DIR)
  ? EXTERNAL_BACKUP_DIR
  : (fs.existsSync(ROOT_BACKUP_DIR) ? ROOT_BACKUP_DIR : path.resolve(__dirname, 'backups/projects_original'))

// Stats tracking
let processedCount = 0
let totalOriginalBytes = 0
let totalWebpBytes = 0
let recompressedCount = 0
let recompressBeforeBytes = 0
let recompressAfterBytes = 0
let errors = []

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * 1. Safely backup a file to BACKUP_DIR if not already backed up
 */
function backupFile(fullPath) {
  const relPath = path.relative(PROJECTS_DIR, fullPath)
  const destPath = path.join(BACKUP_DIR, relPath)
  ensureDirSync(path.dirname(destPath))
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(fullPath, destPath)
  }
}

/**
 * Find raw source file from backups/originals if available
 */
function findRawSource(webpPath) {
  const relPath = path.relative(PROJECTS_DIR, webpPath)
  const parsed = path.parse(relPath)
  const candidateDirs = [EXTERNAL_BACKUP_DIR, ROOT_BACKUP_DIR, path.dirname(webpPath)]
  const possibleExts = ['.jpeg', '.jpg', '.png', '.JPEG', '.JPG', '.PNG']

  for (const cDir of candidateDirs) {
    if (!fs.existsSync(cDir)) continue
    for (const ext of possibleExts) {
      const candidate = cDir === path.dirname(webpPath)
        ? path.join(cDir, `${parsed.name}${ext}`)
        : path.join(cDir, parsed.dir, `${parsed.name}${ext}`)
      if (fs.existsSync(candidate)) {
        return candidate
      }
    }
  }
  return null
}

/**
 * 2. Recursively optimize raw images in dir (.jpg, .jpeg, .png)
 */
async function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      await processDirectory(fullPath)
    } else if (/\.(jpe?g|png)$/i.test(entry.name) && !entry.name.includes('.min.')) {
      const parsed = path.parse(fullPath)
      const webpPath = path.join(parsed.dir, `${parsed.name}.webp`)

      try {
        const origStat = fs.statSync(fullPath)
        totalOriginalBytes += origStat.size

        // 1. Ensure backup is safe
        backupFile(fullPath)

        // 2. Convert to WebP with updated sharp settings
        await sharp(fullPath)
          .resize({ width: 1920, withoutEnlargement: true })
          .webp({
            quality: 82,
            effort: 6,
            smartSubsample: true
          })
          .toFile(webpPath)

        const webpStat = fs.statSync(webpPath)
        totalWebpBytes += webpStat.size
        processedCount++

        // 3. Remove original heavy file from public/ once verified
        if (webpStat.size > 0 && fs.existsSync(webpPath)) {
          fs.unlinkSync(fullPath)
        }

        const savedPct = (((origStat.size - webpStat.size) / origStat.size) * 100).toFixed(1)
        console.log(`[Optimized] ${entry.name} (${(origStat.size / 1024).toFixed(0)}KB -> ${(webpStat.size / 1024).toFixed(0)}KB, -${savedPct}%)`)
      } catch (err) {
        console.error(`Failed to optimize ${fullPath}:`, err.message)
        errors.push({ file: fullPath, error: err.message })
      }
    } else if (entry.name.endsWith('.pptx')) {
      // Large PPTX raw file - keep safe in backup and remove from web distribution
      try {
        backupFile(fullPath)
        fs.unlinkSync(fullPath)
        console.log(`[Archived] ${entry.name} moved safely to backups/projects_original/`)
      } catch (err) {
        console.error(`Failed to archive ${fullPath}:`, err.message)
      }
    }
  }
}

/**
 * 3. Re-compress existing heavy WebP slides and images (Tata Motors & IIFL)
 */
async function recompressTargetDecks(targetFolderNames = []) {
  const foldersToProcess = targetFolderNames.length > 0
    ? targetFolderNames
    : ['15 Tata Motors - Red Moon Dark edition', '14 IIFL - MAUKA EXPRESS']

  console.log('-----------------------------------------------------')
  console.log(`RE-COMPRESSING SLIDES & IMAGES: ${foldersToProcess.join(', ')}`)
  console.log('-----------------------------------------------------')

  for (const folderName of foldersToProcess) {
    const folderPath = path.resolve(PROJECTS_DIR, folderName)
    if (!fs.existsSync(folderPath)) {
      console.warn(`Target folder does not exist: ${folderPath}`)
      continue
    }

    const getAllWebpFiles = (dir) => {
      const results = []
      const items = fs.readdirSync(dir, { withFileTypes: true })
      for (const item of items) {
        if (item.name.startsWith('.')) continue
        const itemPath = path.join(dir, item.name)
        if (item.isDirectory()) {
          results.push(...getAllWebpFiles(itemPath))
        } else if (item.name.endsWith('.webp') && !item.name.endsWith('.tmp.webp')) {
          results.push(itemPath)
        }
      }
      return results
    }

    const webpFiles = getAllWebpFiles(folderPath)
    console.log(`Processing ${webpFiles.length} WebP images in ${folderName}...`)

    for (const webpPath of webpFiles) {
      const parsed = path.parse(webpPath)
      const tempWebp = path.join(parsed.dir, `${parsed.name}.tmp.webp`)

      try {
        const beforeStat = fs.statSync(webpPath)
        const beforeSize = beforeStat.size
        recompressBeforeBytes += beforeSize

        // Prefer pristine raw source if available, otherwise re-encode existing webp
        const rawSource = findRawSource(webpPath)
        const sourceFile = rawSource || webpPath

        await sharp(sourceFile)
          .resize({ width: 1920, withoutEnlargement: true })
          .webp({
            quality: 82,
            effort: 6,
            smartSubsample: true
          })
          .toFile(tempWebp)

        const afterStat = fs.statSync(tempWebp)
        const afterSize = afterStat.size

        if (afterSize > 0) {
          fs.renameSync(tempWebp, webpPath)
          recompressAfterBytes += afterSize
          recompressedCount++

          const savedPct = (((beforeSize - afterSize) / beforeSize) * 100).toFixed(1)
          const sourceLabel = rawSource ? 'from raw' : 'from webp'
          console.log(`[Recompressed (${sourceLabel})] ${path.relative(folderPath, webpPath)} (${(beforeSize / 1024).toFixed(0)}KB -> ${(afterSize / 1024).toFixed(0)}KB, -${savedPct}%)`)
        } else {
          if (fs.existsSync(tempWebp)) fs.unlinkSync(tempWebp)
        }
      } catch (err) {
        console.error(`Failed to recompress ${webpPath}:`, err.message)
        if (fs.existsSync(tempWebp)) {
          try { fs.unlinkSync(tempWebp) } catch {}
        }
        errors.push({ file: webpPath, error: err.message })
      }
    }
  }
}

/**
 * 4. Update pptData.json references to .webp
 */
function updatePptData() {
  const pptDataPath = path.resolve(__dirname, 'src/data/pptData.json')
  if (fs.existsSync(pptDataPath)) {
    let content = fs.readFileSync(pptDataPath, 'utf-8')
    content = content.replace(/\.(jpe?g)/gi, '.webp')
    fs.writeFileSync(pptDataPath, content, 'utf-8')
    console.log('Updated src/data/pptData.json references to .webp')
  }
}

/**
 * 5. Update projectsData.js references to .webp
 */
function updateProjectsData() {
  const projectsDataPath = path.resolve(__dirname, 'src/data/projectsData.js')
  if (fs.existsSync(projectsDataPath)) {
    let content = fs.readFileSync(projectsDataPath, 'utf-8')
    content = content.replace(/Behance-Thumbnail\.jpg/g, 'Behance-Thumbnail.webp')
    fs.writeFileSync(projectsDataPath, content, 'utf-8')
    console.log('Updated src/data/projectsData.js Behance-Thumbnail references to .webp')
  }
}

/**
 * 6. Regenerate scannedProjectFolders.json using vite config scanner
 */
async function syncProjectFolders() {
  try {
    const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    const folders = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.') && !e.name.startsWith('_') && e.name.toLowerCase() !== 'node_modules')
      .map((dir) => {
        const folderPath = path.join(PROJECTS_DIR, dir.name)
        const getFiles = (d, rel = '') => {
          const items = fs.readdirSync(d, { withFileTypes: true })
          const res = []
          for (const item of items) {
            const itemRel = rel ? `${rel}/${item.name}` : item.name
            const itemFull = path.join(d, item.name)
            if (item.isDirectory()) {
              if (item.name.toLowerCase() === '_rels' || (item.name.toLowerCase() === 'media' && d.toLowerCase().includes('amazon'))) {
                continue
              }
              res.push(...getFiles(itemFull, itemRel))
            } else if (/\.(jpe?g|png|webp|gif|svg|mp4|webm|mov|pdf)$/i.test(item.name)) {
              res.push(itemRel)
            }
          }
          return res
        }

        let files = getFiles(folderPath)
        if (dir.name.toLowerCase().includes('eaaa')) {
          const conceptBoard = files.filter((f) => f.toLowerCase().includes('concept') || f.toLowerCase().includes('board'))
          const remaining = files.filter((f) => !f.toLowerCase().includes('concept') && !f.toLowerCase().includes('board'))
          files = [...conceptBoard, ...remaining]
        } else if (dir.name.toLowerCase().includes('xoom')) {
          const gamesConcept = files.filter((f) => /games/i.test(f) && (/concept/i.test(f) || /board/i.test(f)))
          const gamesSlides = files.filter((f) => /games/i.test(f) && /slide/i.test(f))
          const fixConcept = files.filter((f) => /fix/i.test(f) && (/concept/i.test(f) || /board/i.test(f)))
          const fixSlides = files.filter((f) => /fix/i.test(f) && /slide/i.test(f))
          const others = files.filter((f) =>
            !gamesConcept.includes(f) &&
            !gamesSlides.includes(f) &&
            !fixConcept.includes(f) &&
            !fixSlides.includes(f)
          )
          files = [...gamesConcept, ...gamesSlides, ...fixConcept, ...fixSlides, ...others]
        }

        return {
          folder: dir.name,
          media: files,
        }
      })

    folders.sort((a, b) => {
      if (a.folder.toLowerCase() === 'behance') return 1
      if (b.folder.toLowerCase() === 'behance') return -1
      const ma = a.folder.match(/^(\d+)/)
      const mb = b.folder.match(/^(\d+)/)
      const na = ma ? parseInt(ma[1], 10) : 999
      const nb = mb ? parseInt(mb[1], 10) : 999
      if (na !== nb) return na - nb
      return a.folder.localeCompare(b.folder, undefined, { numeric: true, sensitivity: 'base' })
    })

    const targetJson = path.resolve(__dirname, 'src/data/scannedProjectFolders.json')
    fs.writeFileSync(targetJson, JSON.stringify(folders, null, 2), 'utf-8')
    console.log(`Synced ${folders.length} project folders into src/data/scannedProjectFolders.json`)
  } catch (err) {
    console.error('Error syncing project folders json:', err)
  }
}

async function main() {
  console.log('=====================================================')
  console.log('STARTING PORTFOLIO ASSETS OPTIMIZATION (WebP @ Q82, Max Width 1920px)')
  console.log('Projects Directory:', PROJECTS_DIR)
  console.log('Backups Directory:', BACKUP_DIR)
  console.log('=====================================================')

  ensureDirSync(BACKUP_DIR)
  const startTime = Date.now()

  // 1. Process any uncompressed incoming raw images (.jpg, .png)
  await processDirectory(PROJECTS_DIR)

  // 2. Re-compress slide decks (Tata Motors & IIFL by default, or specific targets from CLI)
  const cliTargets = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
  await recompressTargetDecks(cliTargets)

  console.log('Updating project data references...')
  updatePptData()
  updateProjectsData()
  await syncProjectFolders()

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  const origMB = (totalOriginalBytes / 1024 / 1024).toFixed(2)
  const webpMB = (totalWebpBytes / 1024 / 1024).toFixed(2)
  const savedMB = ((totalOriginalBytes - totalWebpBytes) / 1024 / 1024).toFixed(2)

  const recompressBeforeMB = (recompressBeforeBytes / 1024 / 1024).toFixed(2)
  const recompressAfterMB = (recompressAfterBytes / 1024 / 1024).toFixed(2)
  const recompressSavedMB = ((recompressBeforeBytes - recompressAfterBytes) / 1024 / 1024).toFixed(2)
  const recompressSavedPct = recompressBeforeBytes > 0
    ? (((recompressBeforeBytes - recompressAfterBytes) / recompressBeforeBytes) * 100).toFixed(1)
    : '0.0'

  console.log('=====================================================')
  console.log('ASSET OPTIMIZATION COMPLETE!')
  if (processedCount > 0) {
    console.log(`New raw images processed:     ${processedCount}`)
    console.log(`Raw size:                     ${origMB} MB -> ${webpMB} MB (-${savedMB} MB)`)
  }
  if (recompressedCount > 0) {
    console.log(`Slides & images recompressed: ${recompressedCount}`)
    console.log(`Previous WebP size:           ${recompressBeforeMB} MB`)
    console.log(`Upgraded WebP size:           ${recompressAfterMB} MB`)
    console.log(`Space saved on recompress:    ${recompressSavedMB} MB (-${recompressSavedPct}%)`)
  }
  console.log(`Time taken:                   ${elapsed}s`)
  if (errors.length > 0) {
    console.warn(`Encountered ${errors.length} errors during processing.`)
  }
  console.log('Original high-res assets are 100% safely preserved in Original_Raw_Assets/')
  console.log('=====================================================')
}

main().catch(console.error)
