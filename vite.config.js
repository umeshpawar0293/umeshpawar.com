import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function getProjectMediaFiles(dirPath, relativePrefix = '') {
  const results = []
  if (!fs.existsSync(dirPath)) return results
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  // Natural sort directory entries
  entries.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  )

  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue
    }
    const fullPath = path.join(dirPath, entry.name)
    const relPath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      // Avoid recursing into Amazon Prime's extracted cutout directory or _rels
      if (
        entry.name.toLowerCase() === '_rels' ||
        (entry.name.toLowerCase() === 'media' && dirPath.toLowerCase().includes('amazon'))
      ) {
        continue
      }
      results.push(...getProjectMediaFiles(fullPath, relPath))
    } else if (/\.(jpe?g|png|webp|gif|svg|mp4|webm|mov|pdf)$/i.test(entry.name)) {
      results.push(relPath)
    }
  }

  return results
}

function scanProjectsDirectory() {
  const projectsDir = path.resolve(__dirname, 'public/projects')
  if (!fs.existsSync(projectsDir)) return []
  const entries = fs.readdirSync(projectsDir, { withFileTypes: true })
  const folders = entries
    .filter(
      (e) =>
        e.isDirectory() &&
        !e.name.startsWith('.') &&
        !e.name.startsWith('_') &&
        e.name.toLowerCase() !== 'node_modules'
    )
    .map((dir) => {
      const folderPath = path.join(projectsDir, dir.name)
      let files = getProjectMediaFiles(folderPath)

      if (dir.name.toLowerCase().includes('eaaa')) {
        const conceptBoard = files.filter((file) =>
          file.toLowerCase().includes('concept') || file.toLowerCase().includes('board')
        )
        const remainingAssets = files.filter(
          (file) => !file.toLowerCase().includes('concept') && !file.toLowerCase().includes('board')
        )
        files = [...conceptBoard, ...remainingAssets]
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

  // Sort folders sequentially by leading number, unnumbered folders next, behance last
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

  return folders
}

function syncProjectFolders() {
  try {
    const folders = scanProjectsDirectory()
    const targetFile = path.resolve(__dirname, 'src/data/scannedProjectFolders.json')
    fs.writeFileSync(targetFile, JSON.stringify(folders, null, 2), 'utf-8')
  } catch (err) {
    console.error('[vite-plugin-project-folders] Error syncing project folders:', err)
  }
}

// Initial sync
syncProjectFolders()

function projectFoldersPlugin() {
  return {
    name: 'vite-plugin-project-folders',
    buildStart() {
      syncProjectFolders()
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.includes('/projects/amazon/')) {
          const amazonFolder = path.resolve(__dirname, 'public/projects/07 Amazon Prime - Gold Digger')
          const urlClean = decodeURIComponent(req.url.split('?')[0])

          let targetFile = null
          if (urlClean.includes('concept-board') || urlClean.includes('Concept-board')) {
            targetFile = path.join(amazonFolder, '01- Concept-board.webp')
            if (!fs.existsSync(targetFile)) targetFile = path.join(amazonFolder, '01- Concept-board.jpg')
          } else if (urlClean.includes('ppt-thumbnail') || urlClean.includes('ppt-slide-1.') || urlClean.includes('ppt-slide-01.')) {
            targetFile = path.join(amazonFolder, 'Slide 01.webp')
            if (!fs.existsSync(targetFile)) targetFile = path.join(amazonFolder, 'Slide 01.jpg')
          } else if (/ppt-slide-(\d+)\.(jpe?g|webp)/i.test(urlClean)) {
            const num = urlClean.match(/ppt-slide-(\d+)\.(jpe?g|webp)/i)[1]
            targetFile = path.join(amazonFolder, `Slide ${num.padStart(2, '0')}.webp`)
            if (!fs.existsSync(targetFile)) targetFile = path.join(amazonFolder, `Slide ${num.padStart(2, '0')}.jpg`)
          } else if (/slide\s*(\d+)\.(jpe?g|webp)/i.test(urlClean)) {
            const num = urlClean.match(/slide\s*(\d+)\.(jpe?g|webp)/i)[1]
            targetFile = path.join(amazonFolder, `Slide ${num.padStart(2, '0')}.webp`)
            if (!fs.existsSync(targetFile)) targetFile = path.join(amazonFolder, `Slide ${num.padStart(2, '0')}.jpg`)
          } else if (urlClean.endsWith('.pptx')) {
            targetFile = path.join(amazonFolder, 'Amazon Prime Video pitch_Round_2_deck.pptx')
          }

          if (targetFile && fs.existsSync(targetFile)) {
            const ext = path.extname(targetFile).toLowerCase()
            const mimeType = ext === '.pptx'
              ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
              : ext === '.webp'
              ? 'image/webp'
              : 'image/jpeg'
            res.setHeader('Content-Type', mimeType)
            return fs.createReadStream(targetFile).pipe(res)
          }
        }

        if (
          req.url &&
          (req.url.includes('%23') ||
            req.url.includes('YaaronWaliBaat') ||
            req.url.includes('#YaaronWaliBaat'))
        ) {
          const cleanFile = path.resolve(
            __dirname,
            'public/projects/behance/04-House of McDowells - YaaronWaliBaat.jpg'
          )
          if (fs.existsSync(cleanFile)) {
            res.setHeader('Content-Type', 'image/jpeg')
            return fs.createReadStream(cleanFile).pipe(res)
          }
        }

        if (req.url && /^\/(cv|CV)(\/|$)/i.test(req.url)) {
          const fileName = decodeURIComponent(req.url.split('/').pop().split('?')[0])
          let target = path.resolve(__dirname, 'public/cv', fileName)
          if (!fs.existsSync(target) || !fileName.endsWith('.pdf')) {
            target = path.resolve(__dirname, 'public/cv/Final_Final_CV_Approved.pdf')
          }
          if (fs.existsSync(target)) {
            res.setHeader('Content-Type', 'application/pdf')
            return fs.createReadStream(target).pipe(res)
          }
        }
        next()
      })

      const projectsDir = path.resolve(__dirname, 'public/projects')
      server.watcher.add(projectsDir)
      server.watcher.on('all', (event, filePath) => {
        if (filePath.includes('/public/projects')) {
          syncProjectFolders()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), projectFoldersPlugin()],
})

